import { Router } from "express";
import { roadmapModel, userModel } from "../db/db.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

const roadmapRouter = Router();

const ai = new GoogleGenAI({});

roadmapRouter.post("/generate", async (req, res) => {
	try {
		const { domain } = req.body;
		const userId = req.userId;

		const user = await userModel.findById(userId);

		if (!user) {
			res.json({
				status: 404,
				message: "user not found",
			});
		}
		const prompt = `
            Act as a Senior Engineering Mentor. Create a learning roadmap for: "${domain}".
            
            USER CONTEXT:
            - Current Skill Level: ${user.level}/3
            - Verified Skills (Already knows these): [${user.githubSkills.join(
			", "
		)}]
            
            REQUIREMENTS:
            1. Generate a Directed Acyclic Graph (DAG) of learning topics.
            2. **SMART INPUT LOGIC**: 
               - If a topic matches the "Verified Skills", or is a prerequisite of a verified skill, MARK IT AS "completed".
               - **DO NOT** create nodes for basic prerequisites the user obviously knows (implied by their verified skills), UNLESS it is necessary to show the path.
               - IF the user knows X, and X leads to Y, start the "pending" nodes at Y.
            3. If a topic is the immediate next step, set status to "pending". All others "locked".
            4. Return ONLY valid JSON. No markdown. No text.
			5. **ESTIMATE TIME**: specific to their level (e.g., "2 hours" for a pro, "1 week" for a beginner).
			
            
            JSON STRUCTURE:
            {
                "nodes": [
                { 
                    "id": "1", 
                    "type": "topic", 
                    "data": { 
                        "label": "Topic Name", 
                        "description": "Short summary", 
                        "estimatedTime": "4 Hours",
                        "resources": [{ "title": "Docs", "url": "https://..." }] 
                    }, 
                    "status": "completed" | "pending" | "locked" 
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
			domain: domain,
			nodes: nodesWithPos,
			edges: graphData.edges,
		});

		await newRoadmap.save();

		res.json({
			status: 200,
			message: "Roadmap generated successfully",
			newRoadmap,
		});
	} catch (error) {
		res.json({
			status: 500,
			message: "AI call failed, unable to generate roadmap",
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
					//changes target from locked to pending
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

				const nodeIndex = roadmap.nodes.findIndex((n) => n.id === nodeId);
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
