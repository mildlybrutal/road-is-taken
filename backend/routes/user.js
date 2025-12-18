import express, { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { userModel } from "../db/db.js";
import jwt from "jsonwebtoken";
import userMiddleware from "../middleware/user.js";
import { JWT_USER_PASSWORD } from "../config.js";
const userRouter = Router();

userRouter.post("/sign-up", async function (req, res) {
	try {
		const requiredBody = z.object({
			email: z.string().min(3).max(100),
			password: z.string().min(3).max(50),
			username: z.string().min(3).max(30),
		});

		const parsedDataWithSuccess = requiredBody.safeParse(req.body);

		if (!parsedDataWithSuccess.success) {
			return res.json({
				message: "Incorrect format",
				error: parsedDataWithSuccess.error,
			});
		}

		const email = req.body.email;
		const password = req.body.password;
		const username = req.body.username;

		const hashedPassword = await bcrypt.hash(password, 10);

		await userModel.create({
			email: email,
			password: hashedPassword,
			username: username,
		});
		return res.json({
			status: 200,
			message: "sign up endpoint hit",
		});
	} catch (error) {
		return res.json({
			status: 403,
			message: "Failed to sign up user",
		});
	}
});

userRouter.post("/sign-in", async function (req, res) {
	try {
		const requiredBody = z.object({
			email: z.string().min(3).max(100),
			password: z.string().min(3).max(50),
		});

		const parsedDataWithSuccess = requiredBody.safeParse(req.body);

		if (!parsedDataWithSuccess.success) {
			return res.json({
				status: 400,
				message: "Incorrect format",
				error: parsedDataWithSuccess.error,
			});
		}

		const email = req.body.email;
		const password = req.body.password;
		const response = await userModel.findOne({
			email: email,
		});

		if (!response) {
			return res.json({
				status: 403,
				message: "Invalid credentials",
			});
		}

		const checkPassword = await bcrypt.compare(password, response.password);

		if (checkPassword) {
			const token = jwt.sign(
				{
					id: response._id.toString(),
				},
				JWT_USER_PASSWORD
			);

			res.cookie("token", token, {
				httpOnly: true,
				secure: false, // Set to true in production with HTTPS
				sameSite: "lax"
			});

			return res.json({
				status: 200,
				message: "Sign-in successfull",
			});
		} else {
			return res.json({
				status: 403,
				message: "Invalid credentials",
			});
		}
	} catch (error) {
		return res.json({
			status: 500,
			message: "Failed to sign in user",
		});
	}
});

userRouter.use(userMiddleware);


userRouter.get("/me", async (req, res) => {
	try {
		const user = await userModel.findById(req.userId).select("-password");
		if (!user) {
			return res.json({
				status: 404,
				message: "User not found",
			});
		}

		res.json({
			status: 200,
			user: user,
		});
	} catch (error) {
		res.json({
			status: 500,
			message: "Server error fetching user",
		});
	}
});

export default userRouter;
