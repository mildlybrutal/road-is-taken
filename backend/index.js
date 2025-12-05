import express from "express";
import userRouter from "./routes/user";
import questionRouter from "./routes/questions";
import userMiddleware from "./middleware/user";
import githubRouter from "./routes/github";
import roadmapRouter from "./routes/roadmap";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/v1/user", userMiddleware, userRouter);
app.use("/api/v1/questions", userMiddleware, questionRouter);
app.use("/api/v1/fetchGithub", userMiddleware, githubRouter);
app.use("/api/v1/roadmap", userMiddleware, roadmapRouter);

async function main() {
	await mongoose.connect(MONGODB_URI);
	app.listen(3000, () => {
		console.log("Server running at port 3000");
	});
}

main();
