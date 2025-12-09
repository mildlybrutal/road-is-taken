import jwt from "jsonwebtoken";
import { JWT_USER_PASSWORD } from "../config.js";

function userMiddleware(req, res, next) {
	const token = req.cookies.token || req.headers.authorization;

	if (!token) {
		return res.status(403).json({
			status: 403,
			message: "Authentication token missing",
		});
	}

	try {
		const response = jwt.verify(token, JWT_USER_PASSWORD);
		if (response) {
			req.userId = response.id;
			next();
		} else {
			res.status(403).json({
				status: 403,
				message: "Invalid credentials",
			});
		}
	} catch (e) {
		return res.status(403).json({
			status: 403,
			message: "Invalid or expired token",
		});
	}
}

export default userMiddleware;
