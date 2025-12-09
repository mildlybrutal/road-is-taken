import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { motion } from "framer-motion";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        username: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            if (isLogin) {
                const res = await api.post("/user/sign-in", {
                    email: formData.email,
                    password: formData.password,
                });
                if (res.data.status === 200) {
                    login();
                    navigate("/dashboard");
                } else {
                    setError(res.data.message);
                }
            } else {
                const res = await api.post("/user/sign-up", {
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                });
                if (res.data.status === 200) {
                    setSuccess("Account created successfully! Please sign in.");
                    setIsLogin(true);
                    setFormData({ ...formData, password: "" }); // Clear password for safety
                } else {
                    setError(res.data.message);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        }
    };

    return (
        <div className="min-h-screen w-full bg-black relative flex items-center justify-center overflow-hidden">
            {/* Dark White Dotted Grid Background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: "#000000",
                    backgroundImage: `
                        radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
                    `,
                    backgroundSize: "30px 30px",
                    backgroundPosition: "0 0",
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8"
            >
                <div className="rounded-xl border border-white/10 bg-black/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
                    <h2 className="mb-2 text-center text-4xl font-normal text-white" style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>
                        {isLogin ? "Welcome Back" : "Start Journey"}
                    </h2>
                    <p className="mb-8 text-center text-gray-400 font-light">
                        {isLogin ? "Enter your details to access your roadmaps" : "Create your account to start building"}
                    </p>

                    {error && (
                        <div className="mb-6 rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20 text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 rounded-md bg-green-500/10 p-3 text-sm text-green-500 border border-green-500/20 text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Username</label>
                                <Input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="johndoe"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-300"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Email</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="name@example.com"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Password</label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-300"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4 bg-white text-black hover:bg-gray-200 border-none font-medium h-11"
                            size="lg"
                        >
                            {isLogin ? "Sign In" : "Sign Up"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError("");
                                setSuccess("");
                            }}
                            className="font-medium text-white hover:text-gray-300 transition-colors underline underline-offset-4 decoration-gray-700 hover:decoration-white"
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
