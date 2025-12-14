import express from "express";
import userRouter from "./routes/user.js";
import resumeRouter from "./routes/resume.js";
import userMiddleware from "./middleware/user.js";
import githubRouter from "./routes/github.js";
import roadmapRouter from "./routes/roadmap.js";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
	origin: (origin, callback) => {
		console.log("CORS Origin Request:", origin);
		callback(null, true);
	},
	credentials: true
}));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/resume", userMiddleware, resumeRouter);
app.use("/api/v1/fetchGithub", userMiddleware, githubRouter);
app.use("/api/v1/roadmap", userMiddleware, roadmapRouter);

async function main() {
	await mongoose.connect(process.env.MONGODB_URI);
	app.listen(3000, () => {
		console.log("Server running at port 3000");
	});
}

main();
