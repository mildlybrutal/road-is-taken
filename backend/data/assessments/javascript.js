export default javascript = {
	topic: "JavaScript",
	questions: [
		{
			question: "What is the difference between 'let' and 'var'?",
			options: [
				"let is block-scoped, var is function-scoped",
				"var is block-scoped, let is function-scoped",
				"There is no difference",
				"let can be redeclared, var cannot",
			],
			correctAnswer: "let is block-scoped, var is function-scoped",
			difficulty: "beginner",
		},
		{
			question: "What is a closure in JavaScript?",
			options: [
				"A function inside another function",
				"A function that has access to its outer function's variables even after the outer function returns",
				"A way to close browser windows",
				"A type of loop",
			],
			correctAnswer:
				"A function that has access to its outer function's variables even after the outer function returns",
			difficulty: "intermediate",
		},
		{
			question: "What does the 'this' keyword refer to?",
			options: [
				"The current function",
				"The global object",
				"The object that is executing the current function",
				"The parent function",
			],
			correctAnswer: "The object that is executing the current function",
			difficulty: "intermediate",
		},
		{
			question: "What is the purpose of 'async/await'?",
			options: [
				"To make code run faster",
				"To handle asynchronous operations in a synchronous-looking manner",
				"To create multiple threads",
				"To compile JavaScript",
			],
			correctAnswer:
				"To handle asynchronous operations in a synchronous-looking manner",
			difficulty: "intermediate",
		},
		{
			question: "What is the output of: typeof null?",
			options: ["null", "undefined", "object", "number"],
			correctAnswer: "object",
			difficulty: "beginner",
		},
		{
			question: "What is event delegation in JavaScript?",
			options: [
				"Assigning events to multiple elements",
				"Using event bubbling to handle events at a higher level in the DOM",
				"Removing event listeners",
				"Creating custom events",
			],
			correctAnswer:
				"Using event bubbling to handle events at a higher level in the DOM",
			difficulty: "advanced",
		},
		{
			question: "What does the spread operator (...) do?",
			options: [
				"Multiplies numbers",
				"Expands an iterable into individual elements",
				"Creates a range of numbers",
				"Divides arrays",
			],
			correctAnswer: "Expands an iterable into individual elements",
			difficulty: "beginner",
		},
		{
			question: "What is the purpose of Promise.all()?",
			options: [
				"To run promises sequentially",
				"To wait for all promises to resolve or any to reject",
				"To cancel all promises",
				"To create new promises",
			],
			correctAnswer:
				"To wait for all promises to resolve or any to reject",
			difficulty: "intermediate",
		},
		{
			question: "What is the difference between == and ===?",
			options: [
				"No difference",
				"== checks value only, === checks value and type",
				"=== is faster",
				"== is deprecated",
			],
			correctAnswer: "== checks value only, === checks value and type",
			difficulty: "beginner",
		},
		{
			question: "What is a higher-order function?",
			options: [
				"A function that runs faster",
				"A function that takes another function as argument or returns a function",
				"A function with more than 5 parameters",
				"A function that uses recursion",
			],
			correctAnswer:
				"A function that takes another function as argument or returns a function",
			difficulty: "advanced",
		},
	],
};
