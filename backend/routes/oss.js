import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { Router } from "express";
import { roadmapModel } from "../db/db.js";

const ossRouter = Router();
const ai = new GoogleGenAI({});

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

		const prompt = `
            Act as a Senior Technical Architect and Open Source Maintainer.
            I want to understand the architecture and tech stack of a specific project so I can contribute to it or replicate it.

            --- PROJECT CONTEXT ---
            **Language:** ${language}
            **Repo Owner/Name:** ${owner}/${repo}
            **Manifest File Content:**
            "${manifestContent}"

            --- INSTRUCTIONS ---
            1. **Analyze the Dependencies:** - Identify the core "Runtime" stack (e.g., Frameworks, ORMs, State Management, API clients).
            - **IGNORE** standard build tools, linters, and testing libraries (e.g., ignoring nodemon, eslint, prettier, jest, webpack) unless they are central to the architecture (like Vite or Next.js).
            
            2. **Reverse Engineer the Architecture:**
            - Based on the dependencies, deduce the likely architecture (e.g., "This uses Redux for state and Axios for API," or "This uses Gin for routing and Gorm for DB").
            
            3. **Construct a Learning Roadmap (DAG):**
            - **Root Node:** The main language (e.g., "${language}"). Mark status as "completed" (assume I know the syntax).
            - **Child Nodes:** The critical libraries/frameworks identified in step 1. Mark status as "pending".
            - **Descriptions:** Do not just define the library. Explain *why* it is likely used in this specific repo (e.g., instead of "Zod is a validation lib", say "Zod: Likely used to validate API request schemas").
            
            4. **Time Estimation:**
            - Estimate how long it takes to learn enough of this tool to understand the codebase (e.g., "2 days", "4 hours").

            --- JSON RESPONSE FORMAT ---
            Return ONLY a valid JSON object. No markdown formatting.
            {
                "nodes": [
                    { 
                        "id": "1", 
                        "type": "topic", 
                        "data": { 
                            "label": "${language} Core", 
                            "estimatedTime": "0 hours",
							"resources": [{ "title": "Docs", "url": "https://..." }],
                            "description": "The fundamental language syntax.",
							"projectIdea": "Build a Todo App",
                        },
                        "status": "completed",
                        "position": { "x": 0, "y": 0 }
                    },
                    { 
                        "id": "2", 
                        "type": "topic", 
                        "data": { 
                            "label": "Express.js", 
                            "estimatedTime": "3 Days",
							"resources": [{ "title": "Docs", "url": "https://..." }],
                            "description": "Main web server framework handling routes and middleware.",
							"projectIdea": "Build a Todo App",
                        },
                        "status": "pending",
                        "position": { "x": 0, "y": 100 }
                    }
                ],
                "edges": [
                    { "id": "e1-2", "source": "1", "target": "2" }
                ]
            }
        `;

		const apiCall = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
		});

		const text = apiCall.text;
		const jsonString = text.replace(/```json|```/g, "").trim();
		const graphData = JSON.parse(jsonString);

		const nodesWithPos = graphData.nodes.map((node, index) => ({
			...node,
			position: { x: 0, y: 0 },
		}));

		const newRoadmap = new roadmapModel({
			user: userId,
			repoUrl: repoUrl,
			domain: cleanUrl,
			type: "oss",
			language: language,
			nodes: nodesWithPos,
			edges: graphData.edges,
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
