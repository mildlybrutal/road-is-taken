import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Plus, ArrowRight, Loader2, Map, Github } from "lucide-react";
import { motion } from "framer-motion";

import GithubConnectModal from "../components/GithubConnectModal";

const Dashboard = () => {
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [domain, setDomain] = useState("");
    const [activeMode, setActiveMode] = useState("smart"); // "smart" | "resume" | "oss"
    const [resumeFile, setResumeFile] = useState(null);
    const [showGithubModal, setShowGithubModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            const res = await api.get("/roadmap/all");
            if (res.data.status === 200) {
                setRoadmaps(res.data.roadmaps);
            }
        } catch (error) {
            console.error("Failed to fetch roadmaps", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (activeMode === "smart") {
            if (!domain.trim()) return;
        } else if (activeMode === "oss") {
            if (!domain.trim()) return;
        } else {
            // Resume mode
            if (!resumeFile || !domain.trim()) return;
        }

        setIsGenerating(true);
        try {
            let res;
            if (activeMode === "smart") {
                res = await api.post("/roadmap/generate", { domain });
            } else if (activeMode === "oss") {
                res = await api.post("/oss/decode", { repoUrl: domain });
            } else {
                const formData = new FormData();
                formData.append("resume", resumeFile);
                formData.append("domain", domain);
                res = await api.post("/resume/analyse", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            if (res.data.status === 200) {
                // If it's resume mode, the backend returns 'newRoadmap' inside data?
                // Let's assume standard response structure
                navigate(`/roadmap/${res.data.newRoadmap._id}`);
            }
        } catch (error) {
            console.error("Failed to generate roadmap", error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            <GithubConnectModal
                isOpen={showGithubModal}
                onClose={() => setShowGithubModal(false)}
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage your learning paths and generate new ones.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowGithubModal(true)}
                    className="border-white/10 hover:bg-white/5 text-gray-300"
                >
                    <Github className="w-4 h-4 mr-2" />
                    Sync GitHub
                </Button>
            </div>

            {/* Generator Section */}
            <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">What do you want to learn next?</h2>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-white/10 pb-1">
                        <button
                            onClick={() => setActiveMode("smart")}
                            className={`pb-2 text-sm font-medium transition-colors relative ${activeMode === "smart" ? "text-white" : "text-gray-400 hover:text-gray-300"}`}
                        >
                            Smart Input
                            {activeMode === "smart" && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveMode("resume")}
                            className={`pb-2 text-sm font-medium transition-colors relative ${activeMode === "resume" ? "text-white" : "text-gray-400 hover:text-gray-300"}`}
                        >
                            Resume Mode
                            {activeMode === "resume" && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveMode("oss")}
                            className={`pb-2 text-sm font-medium transition-colors relative ${activeMode === "oss" ? "text-white" : "text-gray-400 hover:text-gray-300"}`}
                        >
                            Repo Decoder
                            {activeMode === "oss" && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>}
                        </button>
                    </div>

                    <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder={activeMode === "smart" ? "e.g. Full Stack Development..." : activeMode === "oss" ? "GitHub Repo URL (e.g. facebook/react)" : "Target Role (e.g. React Developer)"}
                                className="flex-1 bg-black/50 border-white/20 text-lg h-12"
                                disabled={isGenerating}
                            />
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isGenerating || !domain.trim() || (activeMode === "resume" && !resumeFile)}
                                className="shrink-0 h-12 px-8"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {activeMode === "resume" ? "Analyzing..." : activeMode === "oss" ? "Decoding..." : "Generating..."}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-5 w-5" /> {activeMode === "resume" ? "Analyze & Create" : activeMode === "oss" ? "Visualize Repo" : "Create Roadmap"}
                                    </>
                                )}
                            </Button>
                        </div>

                        {activeMode === "resume" && (
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Upload Resume (PDF only)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                                    />
                                </div>
                            </div>
                        )}

                        {activeMode === "smart" && (
                            <p className="text-xs text-gray-500">
                                Tip: We use your verified GitHub skills to skip what you already know.
                            </p>
                        )}
                    </form>
                </div>
            </section>

            {/* Roadmaps Grid */}
            <section>
                <h3 className="text-xl font-semibold text-white mb-6">Your Roadmaps</h3>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : roadmaps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roadmaps.map((map) => (
                            <Link key={map._id} to={`/roadmap/${map._id}`}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="group relative h-full rounded-xl border border-white/10 bg-white/5 p-6 hover:border-indigo-500/50 hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-lg bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                            <Map className="h-6 w-6" />
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                                {map.type === "normal" ? "Smart" : map.type === "resume" ? "Resume" : map.type === "oss" ? "OSS" : "Github"}
                                            </span>
                                            <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                                {new Date(map.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gray-200 transition-colors">
                                        {map.domain}
                                    </h4>
                                    <div className="flex items-center text-sm text-gray-400 group-hover:text-gray-300">
                                        View Roadmap <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/5">
                        <p className="text-gray-400 mb-4">No roadmaps generated yet.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
