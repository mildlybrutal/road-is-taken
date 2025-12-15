import axios from "axios";
import { Router } from "express";
import { userModel } from "../db/db.js";

const githubRouter = Router();

githubRouter.post("/username", async (req, res) => {
	const { githubHandle } = req.body;
	const userId = req.userId;

	if (!githubHandle) {
		res.json({
			status: 400,
			message: "Github username is required",
		});
	}
	try {
		const response = await axios.get(
			`https://api.github.com/users/${githubHandle}/repos?sort=updated&per_page=10`,
		);

		const repos = response.data;

		const skillsSet = new Set();
		repos.forEach((repo) => {
			if (repo.language) {
				skillsSet.add(repo.language);
			}
		});

		const detectedSkills = Array.from(skillsSet);

		const updatedUser = await userModel.findOneAndUpdate(
			{ _id: userId },
			{
				$set: {
					githubUsername: githubHandle,
					githubSkills: detectedSkills,
				},
			},
			{ new: true }
		);

		res.json({
			status: 200,
			message: "GitHub Synced",
			skills: detectedSkills,
			user: updatedUser,
		});
	} catch (error) {
		res.json({
			status: 500,
			error: "Server error",
		});
	}
});

export default githubRouter;
