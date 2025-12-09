import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Landing from "./pages/Landing";

function ProtectedRoute({ children }) {
	const { isAuthenticated, isLoading } = useAuth();
	if (isLoading) return <div>Loading...</div>;
	return isAuthenticated ? children : <Navigate to="/auth" />;
}

function App() {
	return (
		<Router>
			<AuthProvider>
				<Layout>
					<Routes>
						<Route path="/" element={<Landing />} />
						<Route path="/auth" element={<Auth />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/roadmap/:id"
							element={
								<ProtectedRoute>
									<Roadmap />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</Layout>
			</AuthProvider>
		</Router>
	);
}

export default App;
