import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const userSchema = new Schema(
	{
		email: { type: String, required: true },
		password: { type: String, required: true },
		username: { type: String, required: true, trim: true },
		githubUsername: { type: String, trim: true },
		domain: String,
		level: { type: Number, default: 1, min: 1 },
		level: { type: Number, default: 1, min: 1 },
		githubSkills: [String],
	},
	{ timestamps: true }
);

const nodeSchema = new Schema({
	id: String, // "node-1"
	type: String, // "topic" or "project"
	data: {
		label: String, // "Learn useEffect"
		estimatedTime: String,
		resources: [{ title: String, url: String }],
		description: String,
		projectIdea: String,
	},
	status: {
		type: String,
		enum: ["locked", "pending", "completed"],
		default: "locked",
	},
	position: { x: Number, y: Number },
});

const edgeSchema = new Schema({
	id: String,
	source: String,
	target: String,
});

const roadmapSchema = new Schema(
	{
		user: {
			type: ObjectId,
			ref: "User",
		},
		domain: String,
		type: {
			type: String,
			enum: ["normal", "resume", "github", "oss"],
			default: "normal",
		},
		nodes: [nodeSchema],
		edges: [edgeSchema],
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);



const userModel = mongoose.model("user", userSchema);
const roadmapModel = mongoose.model("roadmap", roadmapSchema);

export { userModel, roadmapModel };
