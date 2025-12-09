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

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!domain.trim()) return;

        setIsGenerating(true);
        try {
            const res = await api.post("/roadmap/generate", { domain });
            if (res.data.status === 200) {
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
                    <h2 className="text-2xl font-bold text-white mb-4">What do you want to learn next?</h2>
                    <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4">
                        <Input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="e.g. Full Stack Development, Machine Learning, Pottery..."
                            className="flex-1 bg-black/50 border-white/20 text-lg h-12"
                            disabled={isGenerating}
                        />
                        <Button type="submit" size="lg" disabled={isGenerating || !domain.trim()} className="shrink-0 h-12 px-8">
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-5 w-5" /> Create Roadmap
                                </>
                            )}
                        </Button>
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
                                        <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                            {new Date(map.createdAt).toLocaleDateString()}
                                        </span>
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
