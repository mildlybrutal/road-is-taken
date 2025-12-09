import { Router } from "express";
import { questionModel } from "../db/db.js";
import mongoose from "mongoose";

const questionRouter = Router();

questionRouter.post("/next", async (req, res) => {
	try {
		const {
			domain,
			currentDifficulty = 2, // Default ->medium
			previousWasCorrect,
			answeredQuestionsIds = [],
		} = req.body;
		let nextDifficulty = currentDifficulty;

		if (answeredQuestionsIds.length > 0) {
			if (previousWasCorrect) {
				// correct -> increase difficulty
				nextDifficulty = Math.min(3, currentDifficulty + 1);
			} else {
				nextDifficulty = Math.max(1, currentDifficulty - 1); // wrong->decrease level
			}
		} else {
			nextDifficulty = 2;
		}

		const questions = await questionModel.aggregate([
			{
				$match: {
					domain: domain,
					difficulty: nextDifficulty,
					_id: {
						$nin: answeredQuestionsIds.map(
							(id) => new mongoose.Types.ObjectId(id)
						),
					},
				},
			},
			{ $sample: { size: 1 } },
		]);
		//fallback question
		if (!questions || questions.length === 0) {
			const fallbackQuestion = await questionModel.aggregate([
				{
					$match: {
						domain: domain,
						_id: {
							$nin: answeredQuestionsIds.map(
								(id) => new mongoose.Types.ObjectId(id)
							),
						},
					},
				},
				{ $sample: { size: 1 } },
			]);

			if (fallbackQuestion > 0) {
				return res.json({
					...fallbackQuestion[0],
					message: "Fallback question",
				});
			}
		}

		res.json(questions[0]);
	} catch (error) {
		res.json({
			status: 500,
			message: "Error fetching question",
		});
	}
});

questionRouter.post("/node-content", async (req, res) => {
	try {
		const { topic, domain } = req.body;

		// Find questions where tags include the topic (case insensitive regex/match)
		// Or text contains the topic
		const questions = await questionModel.find({
			domain: domain,
			$or: [
				{ tags: { $in: [new RegExp(topic, "i")] } },
				{ text: { $regex: topic, $options: "i" } },
			],
		});

		res.json({
			status: 200,
			questions,
		});
	} catch (error) {
		res.json({
			status: 500,
			message: "Error fetching specific content",
			error: error.message,
		});
	}
});

export default questionRouter;
