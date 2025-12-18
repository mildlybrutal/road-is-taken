import { Router } from "express";
import { roadmapModel, userModel } from "../db/db.js";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk"
import axios from "axios";

const roadmapRouter = Router();

const groq = new Groq({
	apiKey: process.env.GROQ_API_KEY,
})

//const ai = new GoogleGenAI({});

// Retry helper with exponential backoff for 503 errors
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
	for (let i = 0; i < retries; i++) {
		try {
			return await fn();
		} catch (error) {
			if (error.status === 503 && i < retries - 1) {
				console.log(`Retry ${i + 1}/${retries} after ${delay}ms...`);
				await new Promise((r) => setTimeout(r, delay));
				delay *= 2; // Exponential backoff
			} else {
				throw error;
			}
		}
	}
};

roadmapRouter.post("/generate", async (req, res) => {
	try {
		const { domain } = req.body;
		const userId = req.userId;

		const user = await userModel.findById(userId);

		if (!user) {
			return res.json({
				status: 404,
				message: "user not found",
			});
		}

		// ============ PHASE 1: Generate Structure ============
		console.time("PHASE_1_STRUCTURE");
		const phase1Prompt = `
            Act as a Senior Engineering Mentor. Create a learning roadmap STRUCTURE for: "${domain}".
            
            USER CONTEXT:
            - Verified Skills (Already knows these): [${user.githubSkills.join(", ")}]
            
            REQUIREMENTS:
            1. Generate a Directed Acyclic Graph (DAG) of learning topics (10-15 nodes max).
            2. **SMART INPUT LOGIC**: 
               - If a topic matches "Verified Skills" or is a prerequisite, mark as "completed".
               - If a topic is the immediate next step, set status to "pending". All others "locked".
            3. Return ONLY valid JSON. No markdown. No text.
            4. Keep this LIGHTWEIGHT - only labels and structure, details come later.
            
            JSON STRUCTURE:
            {
                "nodes": [
                    { "id": "1", "label": "Topic Name", "status": "completed" | "pending" | "locked" }
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
                You are enriching roadmap nodes for the domain: "${domain}".
                
                For each topic below, provide learning details.
                
                TOPICS:
                ${batchLabels}
                
                Return ONLY valid JSON. No markdown.
                Format:
                {
                    "<id>": {
                        "description": "Brief 1-2 sentence explanation",
                        "estimatedTime": "e.g. 4 Hours, 2 Days",
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
				status: node.status ? node.status.toLowerCase() : "locked",
				position: { x: 0, y: 0 },
			};
		});

		const newRoadmap = new roadmapModel({
			user: userId,
			domain: domain,
			nodes: nodesWithPos,
			edges: structure.edges,
		});

		await newRoadmap.save();

		res.json({
			status: 200,
			message: "Roadmap generated successfully",
			newRoadmap,
		});
	} catch (error) {
		console.error("Roadmap generation error:", error);
		res.json({
			status: 500,
			message: "AI call failed, unable to generate roadmap",
			error: error.message,
		});
	}
});

roadmapRouter.get("/view", async (req, res) => {
	try {
		const roadmap = await roadmapModel
			.findOne({
				user: req.userId,
			})
			.sort({ createdAt: -1 });

		if (!roadmap) {
			return res.json({
				status: 404,
				message: "Failed to fetch roadmap",
			});
		}

		res.json({
			status: 200,
			message: "Roadmap fetched successfully",
			roadmap,
		});
	} catch (error) {
		res.json({
			status: 500,
			message: "Server error",
		});
	}
});

roadmapRouter.put("/update", async (req, res) => {
	try {
		const { roadmapId, nodeId, status } = req.body;

		const roadmap = await roadmapModel.findById(roadmapId);

		if (!roadmap) {
			return res.json({
				status: 404,
				message: "Roadmap not found",
			});
		}

		const nodeIndex = roadmap.nodes.findIndex((n) => n.id === nodeId);

		if (nodeIndex === -1) {
			return res.json({
				status: 404,
				message: "node not found",
			});
		}

		roadmap.nodes[nodeIndex].status = status;

		if (status === "completed") {
			const outgoingEdges = roadmap.edges.filter(
				(edge) => edge.source === nodeId
			);

			outgoingEdges.forEach((edge) => {
				const targetNodeIndex = roadmap.nodes.findIndex(
					(n) => n.id === edge.target
				);

				if (targetNodeIndex !== -1) {
					if (roadmap.nodes[targetNodeIndex].status === "locked") {
						roadmap.nodes[targetNodeIndex].status = "pending";
					}
				}
			});
		}

		await roadmap.save();

		res.json({
			status: 200,
			message: "Roadmap update successful",
			roadmap,
		});
	} catch (error) {
		res.json({
			status: 500,
			message: "Roadmap update failed",
		});
	}
});

roadmapRouter.get("/all", async (req, res) => {
	try {
		const roadmaps = await roadmapModel
			.find({
				user: req.userId,
			})
			.sort({ createdAt: -1 });

		res.json({
			status: 200,
			message: "Roadmaps fetched successfully",
			roadmaps: roadmaps || [],
		});
	} catch (error) {
		res.json({
			status: 500,
			message: "Error fetching roadmaps",
		});
	}
});

roadmapRouter.post("/verify-node", async (req, res) => {
	try {
		const { roadmapId, nodeId, githubRepoUrl } = req.body;

		if (!githubRepoUrl) {
			return res.json({
				status: 400,
				message: "GitHub repository URL is required",
			});
		}

		// Extract owner and repo from URL
		// Format: https://github.com/owner/repo
		const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
		const match = githubRepoUrl.match(regex);

		if (!match) {
			return res.json({
				status: 400,
				message: "Invalid GitHub URL",
			});
		}

		const owner = match[1];
		const repo = match[2].replace(".git", ""); // Clean up if they pasted .git url

		// Verify with GitHub API
		try {
			const githubRes = await axios.get(
				`https://api.github.com/repos/${owner}/${repo}`
			);

			if (githubRes.status === 200) {
				// Repo exists!
				// Here we could add more logic: check language, check recency, etc.
				// For now, we trust the existence + user intent.

				const roadmap = await roadmapModel.findById(roadmapId);
				if (!roadmap) {
					return res.json({
						status: 404,
						message: "Roadmap not found",
					});
				}

				const nodeIndex = roadmap.nodes.findIndex(
					(n) => n.id === nodeId
				);
				if (nodeIndex === -1) {
					return res.json({
						status: 404,
						message: "Node not found",
					});
				}

				roadmap.nodes[nodeIndex].status = "completed";

				// Unlock logic (copied from update route logic)
				const outgoingEdges = roadmap.edges.filter(
					(edge) => edge.source === nodeId
				);

				outgoingEdges.forEach((edge) => {
					const targetNodeIndex = roadmap.nodes.findIndex(
						(n) => n.id === edge.target
					);
					if (
						targetNodeIndex !== -1 &&
						roadmap.nodes[targetNodeIndex].status === "locked"
					) {
						roadmap.nodes[targetNodeIndex].status = "pending";
					}
				});

				await roadmap.save();

				return res.json({
					status: 200,
					message: "Node verified and completed!",
					roadmap,
				});
			}
		} catch (ghError) {
			// GitHub API error (e.g. 404)
			return res.json({
				status: 400,
				message:
					"Could not verify repository. Make sure it is public and exists.",
			});
		}
	} catch (error) {
		res.json({
			status: 500,
			message: "Verification failed",
			error: error.message,
		});
	}
});

export default roadmapRouter;
