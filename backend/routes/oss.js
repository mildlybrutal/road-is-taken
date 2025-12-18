import Groq from "groq-sdk";
import axios from "axios";
import { Router } from "express";
import { roadmapModel } from "../db/db.js";

const ossRouter = Router();
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

const fetchRepoFile = async (owner, repo, path) => {
	try {
		const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
		const response = await axios.get(url, {
			headers: {
				Authorization: `token ${process.env.GITHUB_TOKEN}`,
				Accept: "application/vnd.github.v3+json",
			},
		})

		return Buffer.from(response.data.content, "base64").toString("utf-8");
	} catch (error) {
		return null;
	}
};

ossRouter.post("/decode", async (req, res) => {
	try {
		const { repoUrl } = req.body;
		const userId = req.userId;

		const cleanUrl = repoUrl.replace("https://github.com/", "");
		const [owner, repo] = cleanUrl.split("/");

		if (!owner || !repo) {
			return res.json({
				status: 400,
				message: "Invalid Github URL",
			});
		}

		let manifestContent = null;
		let language = "";

		manifestContent = await fetchRepoFile(owner, repo, "package.json");

		if (manifestContent) {
			language = "JavaScript/TypeScript";
		} else {
			manifestContent = await fetchRepoFile(owner, repo, "go.mod");
			if (manifestContent) language = "Go";
		}
		if (!manifestContent) {
			manifestContent = await fetchRepoFile(
				owner,
				repo,
				"requirements.txt"
			);
			if (manifestContent) language = "Python";
		}

		if (!manifestContent) {
			return res.status(404).json({
				error: "Could not find a supported manifest file (package.json, go.mod, requirements.txt).",
			});
		}

		// ============ PHASE 1: Analyze Repo & Generate Structure ============
		console.time("PHASE_1_STRUCTURE");
		const phase1Prompt = `
            Act as a Senior Technical Architect and Open Source Maintainer.
            I want to understand the architecture and tech stack of a specific project.

            --- PROJECT CONTEXT ---
            **Language:** ${language}
            **Repo Owner/Name:** ${owner}/${repo}
            **Manifest File Content:**
            "${manifestContent}"

            --- INSTRUCTIONS ---
            1. **Analyze the Dependencies:** - Identify the core "Runtime" stack (Frameworks, ORMs, State Management, API clients).
            - **IGNORE** standard build tools, linters, and testing libraries unless central to architecture.
            
            2. **Construct a LIGHTWEIGHT Learning Roadmap (DAG)**:
            - **Root Node:** The main language (e.g., "${language}"). Status: "completed".
            - **Child Nodes:** Critical libraries/frameworks. Status: "pending".
            - Keep it lightweight - details come later.
            
            3. Return ONLY valid JSON. No markdown.
            
            JSON FORMAT:
            {
                "nodes": [
                    { "id": "1", "label": "${language} Core", "status": "completed" },
                    { "id": "2", "label": "Express.js", "status": "pending" }
                ],
                "edges": [
                    { "id": "e1-2", "source": "1", "target": "2" }
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
			const batchLabels = batch.map((n) => `- ID: ${n.id}, Topic: ${n.label}`).join("\n");

			const phase2Prompt = `
                You are enriching roadmap nodes for understanding the repo: ${owner}/${repo} (${language}).
                
                For each topic below, explain *why* it is likely used in this specific repo.
                
                TOPICS:
                ${batchLabels}
                
                Return ONLY valid JSON. No markdown.
                Format:
                {
                    "<id>": {
                        "description": "Explain *why* it is used in this repo (e.g. 'Likely used to validate API request schemas')",
                        "estimatedTime": "Time to learn enough to understand the codebase (e.g. 2 days, 4 hours)",
                        "resources": [{ "title": "Docs", "url": "https://..." }],
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
			return {
				id: node.id,
				type: "topic",
				data: {
					label: node.label,
					description: details.description || "",
					estimatedTime: details.estimatedTime || "TBD",
					resources: details.resources || [],
					projectIdea: details.projectIdea || "",
				},
				status: node.status || "pending",
				position: { x: 0, y: 0 },
			};
		});

		const newRoadmap = new roadmapModel({
			user: userId,
			repoUrl: repoUrl,
			domain: cleanUrl,
			type: "oss",
			language: language,
			nodes: nodesWithPos,
			edges: structure.edges,
		});

		await newRoadmap.save();

		res.json({
			status: 200,
			message: "Roadmap generated successfully",
			detectedLanguage: language,
			newRoadmap,
		});
	} catch (error) {
		console.error("OSS Route Error:", error);
		res.json({
			status: 500,
			message: "AI call failed, unable to generate roadmap",
		});
	}
});

export default ossRouter;
