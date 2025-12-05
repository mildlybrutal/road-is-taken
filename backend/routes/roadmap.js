import { Router } from "express";
import { roadmapModel, userModel } from "../db/db";
import { GoogleGenAI } from "@google/genai";

const roadmapRouter = Router();

const ai = new GoogleGenAI({});

roadmapRouter.post("/generate", async (req, res) => {
	try {
		const { domain } = req.body;
		const userId = req.user.id;

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
            - Quiz Score: ${user.quizScore}/100
            - Verified Skills (Already knows these): [${user.githubSkills.join(
				", "
			)}]
            
            REQUIREMENTS:
            1. Generate a Directed Acyclic Graph (DAG) of learning topics.
            2. If a topic matches the "Verified Skills", set its status to "completed".
            3. If a topic is a prerequisite for a completed topic, mark it "completed" too.
            4. If a topic is the immediate next step, set status to "pending". All others "locked".
            5. Return ONLY valid JSON. No markdown. No text.
            
            JSON STRUCTURE:
            {
                "nodes": [
                { 
                    "id": "1", 
                    "type": "topic", 
                    "data": { 
                        "label": "Topic Name", 
                        "description": "Short summary", 
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
				user: req.user.id,
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

export default roadmapRouter;
