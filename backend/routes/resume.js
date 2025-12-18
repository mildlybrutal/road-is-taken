import { Router } from "express";
import multer from "multer";
import { PdfData, VerbosityLevel } from "pdfdataextract";
import fs from "fs";
import path from "path";
import { roadmapModel } from "../db/db.js"
import Groq from "groq-sdk";

const resumeRouter = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Retry helper with exponential backoff for 503 errors
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (error.status === 503 && i < retries - 1) {
				console.log(`Retry ${i + 1}/${retries} after ${delay}ms...`);
				await new Promise((r) => setTimeout(r, delay));
				delay *= 2;
			} else {
				throw error;
			}
		}
	}
};

// Configure Multer for Disk Storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Ensure directory exists
		const uploadDir = "./backend/uploads";
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "application/pdf") {
			cb(null, true);
		} else {
			cb(new Error("Only PDF files are allowed"), false);
		}
	},
});

resumeRouter.post("/analyse", upload.single("resume"), async (req, res) => {
	let filePath = null;
	try {
		const { domain } = req.body;
		const userId = req.userId;

		if (!req.file) {
			return res.json({
				status: 400,
				message: "PDF file is required",
			});
		}

		filePath = req.file.path;

		if (!domain) {
			// Clean up if domain is missing
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
			return res.json({
				status: 400,
				message: "Target domain is required",
			});
		}

		let resumeText = "";

		try {
			console.time("PDF_PARSE");
			const fileBuffer = fs.readFileSync(filePath);
			const data = await PdfData.extract(fileBuffer, {
				verbosity: VerbosityLevel.ERRORS,
				get: {
					pages: true,
					text: true,
				},
			});

			resumeText = data.text.join(" ");

			resumeText = resumeText
				.replace(/\n+/g, " ")
				.replace(/\s+/g, " ")
				.trim();

			if (resumeText.length > 10000) {
				resumeText = resumeText.substring(0, 10000) + "...";
			}
			console.timeEnd("PDF_PARSE");
		} catch (parseError) {
			console.error("PDF Parsing Error:", parseError);
			console.timeEnd("PDF_PARSE");
			return res.json({
				status: 500,
				message: "Failed to read pdf",
			});
		} finally {
			// Clean up the uploaded file
			if (filePath && fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}

		// ============ PHASE 1: Analyze Resume & Generate Structure ============
		console.time("PHASE_1_STRUCTURE");
		const phase1Prompt = `
            Act as a Senior Engineering Mentor.
            The user wants to learn: "${domain}".
            
            Here is their RESUME (parsed text):
            "${resumeText}"

            --- INSTRUCTIONS ---
            1. **Analyze** the resume to understand their *current* verified tech stack.
            2. **Compare** it against requirements for "${domain}".
            3. **Identify Gaps**: What strictly needs to be learned?
            4. **Construct a LIGHTWEIGHT Roadmap Structure (DAG)**:
               - If user *already knows* a prerequisite, mark as "completed".
               - New essential topics: "pending". Future advanced: "locked".
            5. Return ONLY valid JSON. No markdown. Keep it lightweight - details come later.
            
            JSON FORMAT:
            {
                "nodes": [
                    { "id": "node-1", "label": "Topic Name", "status": "completed" | "pending" | "locked" }
                ],
                "edges": [
                    { "id": "e1-2", "source": "node-1", "target": "node-2" }
                ]
            }
        `;

		const phase1Call = await retryWithBackoff(() =>
			groq.chat.completions.create({
				messages: [{ role: "user", content: phase1Prompt }],
				model: "openai/gpt-oss-120b",
			})
		);

		const phase1Text = phase1Call.choices[0]?.message?.content || "";
		const phase1Json = phase1Text.replace(/```json|```/g, "").trim();
		const structure = JSON.parse(phase1Json);
		console.timeEnd("PHASE_1_STRUCTURE");

		// ============ PHASE 2: Enrich Nodes in Batches ============
		console.time("PHASE_2_ENRICHMENT");
		const BATCH_SIZE = 5;
		const enrichedDetails = {};

		for (let i = 0; i < structure.nodes.length; i += BATCH_SIZE) {
			const batch = structure.nodes.slice(i, i + BATCH_SIZE);
			const batchLabels = batch.map((n) => `- ID: ${n.id}, Topic: ${n.label}, Status: ${n.status}`).join("\n");

			const phase2Prompt = `
                You are enriching learning roadmap nodes for someone learning: "${domain}".
                
                For each topic below, provide learning details. For "completed" topics, keep it brief.
                
                TOPICS:
                ${batchLabels}
                
                Return ONLY valid JSON. No markdown.
                Format:
                {
                    "<id>": {
                        "description": "Brief 1-2 sentence explanation",
                        "estimatedTime": "e.g. 0 hours for completed, 4 Hours, 2 Days for new topics",
                        "resources": [{ "title": "Resource Name", "url": "https://..." }],
                        "projectIdea": "A practical project to apply this"
                    }
                }
            `;

			const phase2Call = await retryWithBackoff(() =>
				groq.chat.completions.create({
					messages: [{ role: "user", content: phase2Prompt }],
					model: "openai/gpt-oss-120b",
				})
			);

			const phase2Text = phase2Call.choices[0]?.message?.content || "";
			const phase2Json = phase2Text.replace(/```json|```/g, "").trim();
			const batchDetails = JSON.parse(phase2Json);

			Object.assign(enrichedDetails, batchDetails);
		}
		console.timeEnd("PHASE_2_ENRICHMENT");

		// ============ Merge Structure + Details ============
		const nodesWithPos = structure.nodes.map((node, index) => {
			const details = enrichedDetails[node.id] || {};
			const rawStatus = node.status || "locked";
			const status = rawStatus.toLowerCase();

			return {
				id: node.id || `node-${index}`,
				type: "topic",
				position: { x: 0, y: index * 100 },
				data: {
					label: node.label,
					description: details.description || "",
					estimatedTime: details.estimatedTime || "TBD",
					resources: details.resources || [],
					projectIdea: details.projectIdea || "",
				},
				status: ["completed", "pending", "locked"].includes(status) ? status : "locked",
			};
		});

		const newRoadmap = new roadmapModel({
			user: userId,
			domain: `Resume Analysis: ${domain}`,
			type: "resume",
			nodes: nodesWithPos,
			edges: structure.edges,
		});

		await newRoadmap.save();

		res.json({
			status: 200,
			message: "Resume analyzed and roadmap generated successfully",
			newRoadmap,
		});
	} catch (error) {
		// Ensure file is deleted if checking req.file failed or something else happened
		if (filePath && fs.existsSync(filePath)) {
			try {
				fs.unlinkSync(filePath);
			} catch (cleanupErr) {
				console.error("Failed to cleanup file:", cleanupErr);
			}
		}

		return res.status(500).json({
			status: 500,
			message: "Internal server error processing resume.",
			error: error.message,
		});
	}
});

export default resumeRouter;
