import { Router } from "express";
import multer from "multer";
import { PdfData, VerbosityLevel } from "pdfdataextract";
import fs from "fs";
import path from "path";
import { roadmapModel } from "../db/db.js"
import { GoogleGenAI } from "@google/genai";

const resumeRouter = Router();
const ai = new GoogleGenAI({});

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

		const prompt = `
            Act as a Senior Engineering Mentor.
            The user wants to learn: "${domain}".
            
            Here is their RESUME (parsed text):
            "${resumeText}"

            --- INSTRUCTIONS ---
            1. **Analyze** the resume to understand their *current* verified tech stack.
            2. **Compare** it against the industry standard requirements for "${domain}".
            3. **Identify Gaps**: What strictly needs to be learned?
            4. **Construct a Roadmap (DAG)**:
               - If the user *already knows* a prerequisite (e.g. they know 'React' but want 'Next.js'), create the 'React' node but mark its status as "completed".
               - If a topic is new and essential, mark it as "pending".
               - Future advanced topics should be "locked".
			5. **CRITICAL**: For every topic, estimate the time to learn it (e.g., "4 hours", "2 days").
           		- "Pending" items need realistic study time.
           		- "Completed" items can have "0 hours".
            
            --- JSON RESPONSE FORMAT ---
            Return ONLY a valid JSON object. No markdown formatting.
            {
                "nodes": [
                    { 
                        "id": "node-1", 
                        "type": "topic", 
                        "data": { 
                            "label": "JavaScript Basics", 
                            "description": "Core language fundamentals.",
							"estimatedTime": "3 Days",  <-- ADD THIS
                            "status": "completed" 
                        },
                        "position": { "x": 0, "y": 0 }
                    },
                    { 
                        "id": "node-2", 
                        "type": "topic", 
                        "data": { 
                            "label": "Advanced React Patterns", 
                            "description": "HOCs, Render Props, and Custom Hooks.",
							"estimatedTime": "3 Days",  <-- ADD THIS
                            "status": "pending" 
                        },
                        "position": { "x": 0, "y": 100 }
                    }
                ],
                "edges": [
                    { "id": "e1-2", "source": "node-1", "target": "node-2" }
                ]
            }
        `;

		console.time("AI_GENERATE");
		const apiCall = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
		});
		console.timeEnd("AI_GENERATE");

		const text = apiCall.text;

		const jsonString = text.replace(/```json|```/g, "").trim();
		const graphData = JSON.parse(jsonString);

		const nodesWithPos = graphData.nodes.map((node, index) => ({
			...node,
			id: node.id || `node-${index}`,
			type: "topic",
			position: node.position || { x: 0, y: index * 100 },
			data: {
				...node.data,
				status: ["completed", "pending", "locked"].includes(
					node.data.status
				)
					? node.data.status
					: "locked",
			},
		}));

		const newRoadmap = new roadmapModel({
			user: userId,
			domain: `Resume Analysis: ${domain}`,
			nodes: nodesWithPos,
			edges: graphData.edges,
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
