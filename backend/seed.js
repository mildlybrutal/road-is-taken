import mongoose from "mongoose";
import questionRouter from "./routes/questions";

const questions = [
	// --- LEVEL 1: EASY ---
	{
		domain: "frontend_react",
		difficulty: 1,
		text: "What is the primary purpose of `useState` in React?",
		options: [
			{ text: "To manage local component state", isCorrect: true },
			{ text: "To fetch data from an API", isCorrect: false },
			{ text: "To route to different pages", isCorrect: false },
			{ text: "To memorize heavy calculations", isCorrect: false },
		],
		tags: ["hooks", "basics"],
	},
	{
		domain: "frontend_react",
		difficulty: 1,
		text: "Which syntax is used to render a list of items in React?",
		options: [
			{ text: "Array.map()", isCorrect: true },
			{ text: "for loop", isCorrect: false },
			{ text: "Array.forEach()", isCorrect: false },
			{ text: "while loop", isCorrect: false },
		],
		tags: ["rendering", "lists"],
	},
	{
		domain: "frontend_react",
		difficulty: 1,
		text: "What does JSX stand for?",
		options: [
			{ text: "JavaScript XML", isCorrect: true },
			{ text: "Java Syntax Extension", isCorrect: false },
			{ text: "JSON Xchange Schema", isCorrect: false },
			{ text: "JavaScript Xhtml", isCorrect: false },
		],
		tags: ["jsx", "basics"],
	},
	{
		domain: "frontend_react",
		difficulty: 1,
		text: "Props are ______.",
		options: [
			{ text: "Read-only (Immutable)", isCorrect: true },
			{ text: "Mutable inside the child", isCorrect: false },
			{ text: "Global variables", isCorrect: false },
			{ text: "Only for class components", isCorrect: false },
		],
		tags: ["props", "basics"],
	},
	{
		domain: "frontend_react",
		difficulty: 1,
		text: "How do you handle click events in React?",
		options: [
			{ text: "onClick={handler}", isCorrect: true },
			{ text: "onclick='handler()'", isCorrect: false },
			{ text: "v-on:click='handler'", isCorrect: false },
			{ text: "click={handler}", isCorrect: false },
		],
		tags: ["events", "basics"],
	},

	// --- LEVEL 2: MEDIUM ---
	{
		domain: "frontend_react",
		difficulty: 2,
		text: "What is the dependency array in `useEffect` used for?",
		options: [
			{ text: "To control when the effect re-runs", isCorrect: true },
			{ text: "To list the libraries imported", isCorrect: false },
			{ text: "To store the API response", isCorrect: false },
			{ text: "To declare state variables", isCorrect: false },
		],
		tags: ["hooks", "useEffect"],
	},
	{
		domain: "frontend_react",
		difficulty: 2,
		text: "Which hook would you use to memorize a computed value?",
		options: [
			{ text: "useMemo", isCorrect: true },
			{ text: "useCallback", isCorrect: false },
			{ text: "useRef", isCorrect: false },
			{ text: "useReducer", isCorrect: false },
		],
		tags: ["hooks", "performance"],
	},
	{
		domain: "frontend_react",
		difficulty: 2,
		text: "What happens when you call `setState`?",
		options: [
			{ text: "React schedules a re-render", isCorrect: true },
			{ text: "The DOM updates immediately", isCorrect: false },
			{ text: "The page reloads", isCorrect: false },
			{ text: "Nothing happens until the user clicks", isCorrect: false },
		],
		tags: ["state", "lifecycle"],
	},
	{
		domain: "frontend_react",
		difficulty: 2,
		text: "How can you pass data deep down the component tree without prop drilling?",
		options: [
			{ text: "Context API", isCorrect: true },
			{ text: "useRef", isCorrect: false },
			{ text: "useState", isCorrect: false },
			{ text: "Portals", isCorrect: false },
		],
		tags: ["context", "architecture"],
	},
	{
		domain: "frontend_react",
		difficulty: 2,
		text: "What is the main difference between `useCallback` and `useMemo`?",
		options: [
			{
				text: "useCallback returns a function, useMemo returns a value",
				isCorrect: true,
			},
			{
				text: "useCallback is for API calls, useMemo is for math",
				isCorrect: false,
			},
			{ text: "There is no difference", isCorrect: false },
			{ text: "useMemo runs on every render", isCorrect: false },
		],
		tags: ["hooks", "performance"],
	},

	// --- LEVEL 3: HARD ---
	{
		domain: "frontend_react",
		difficulty: 3,
		text: "In React 18, what feature allows rendering to be interrupted to keep the UI responsive?",
		options: [
			{ text: "Concurrent Mode", isCorrect: true },
			{ text: "Strict Mode", isCorrect: false },
			{ text: "Flux Architecture", isCorrect: false },
			{ text: "Shadow DOM", isCorrect: false },
		],
		tags: ["react18", "advanced"],
	},
	{
		domain: "frontend_react",
		difficulty: 3,
		text: "What is the purpose of `useLayoutEffect`?",
		options: [
			{
				text: "It runs synchronously after DOM mutations but before paint",
				isCorrect: true,
			},
			{ text: "It runs asynchronously after paint", isCorrect: false },
			{ text: "It is used for fetching data only", isCorrect: false },
			{ text: "It is deprecated", isCorrect: false },
		],
		tags: ["hooks", "rendering"],
	},
	{
		domain: "frontend_react",
		difficulty: 3,
		text: "Which of these is a valid reason to use `forwardRef`?",
		options: [
			{
				text: "To expose a DOM node from a child component to a parent",
				isCorrect: true,
			},
			{ text: "To pass state to a sibling component", isCorrect: false },
			{ text: "To loop through an array of refs", isCorrect: false },
			{ text: "To avoid re-rendering", isCorrect: false },
		],
		tags: ["refs", "advanced"],
	},
	{
		domain: "frontend_react",
		difficulty: 3,
		text: "What is a Higher-Order Component (HOC)?",
		options: [
			{
				text: "A function that takes a component and returns a new component",
				isCorrect: true,
			},
			{
				text: "A component that renders inside a loop",
				isCorrect: false,
			},
			{ text: "A component that manages global state", isCorrect: false },
			{ text: "A component at the top of the tree", isCorrect: false },
		],
		tags: ["patterns", "advanced"],
	},
	{
		domain: "frontend_react",
		difficulty: 3,
		text: "How does React handle reconciliation when list items lack keys?",
		options: [
			{
				text: "It defaults to using indices, causing potential bugs with reordering",
				isCorrect: true,
			},
			{ text: "It throws a fatal error", isCorrect: false },
			{ text: "It automatically generates unique IDs", isCorrect: false },
			{ text: "It re-renders the entire page", isCorrect: false },
		],
		tags: ["reconciliation", "internals"],
	},
];

const seedDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("Connected to DB");

		await questionRouter.deleteMany({ domain: "frontend_react" });
		console.log("Cleared old questions");

		await questionRouter.insertMany(questions);
		console.log("Seeded 15 React Questions successfully");

		mongoose.connection.close();
		console.log("Connection closed");
	} catch (err) {
		console.error("Error seeding:", err);
	}
};

seedDB();
