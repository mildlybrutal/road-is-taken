import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ArrowRight, Sparkles, Brain, GitBranch, FileText, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const Landing = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4 relative overflow-hidden bg-transparent text-white selection:bg-white/30">

            {/* Background Effects Removed as per user request to show global dotted pattern */}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-5xl mx-auto space-y-8 z-10 relative"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium tracking-wider text-gray-400 uppercase mb-4 backdrop-blur-md shadow-lg shadow-white/5">
                    <Sparkles className="w-3 h-3" />
                    <span>AI-Powered Learning Paths</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-white leading-[1.1] pb-2">
                    RoadIs<span className="text-gray-500 italic">Taken</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Generate the perfect curriculum for any skill. <br />
                    <span className="text-gray-100 font-normal">Topologically sorted. Instantly ready.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                    <Link to="/auth">
                        <Button size="lg" className="rounded-full border-none bg-white hover:bg-gray-200 text-black h-14 px-10 text-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95">
                            Start Journey <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link to="/auth">
                        <Button variant="ghost" size="lg" className="rounded-full border border-white/10 hover:bg-white/5 hover:border-white/20 h-14 px-10 text-lg text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Features Expanded & Monochrome */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 max-w-7xl w-full px-4 relative z-10"
            >
                {[
                    {
                        icon: <Brain className="w-6 h-6 text-white" />,
                        title: "Topic-Based",
                        description: "Smart input filters known concepts to generate specific learning paths."
                    },
                    {
                        icon: <GitBranch className="w-6 h-6 text-white" />,
                        title: "Repo Decoder",
                        description: "Reverse-engineer GitHub repos into structured roadmaps instantly."
                    },
                    {
                        icon: <FileText className="w-6 h-6 text-white" />,
                        title: "Career Path",
                        description: "Upload your resume to identify gaps and get a tailored plan."
                    },
                    {
                        icon: <CheckCircle className="w-6 h-6 text-white" />,
                        title: "Smart Skipping",
                        description: "Sync with GitHub to auto-verify skills and focus on what's new."
                    }
                ].map((feature, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        className="group p-8 border border-white/5 bg-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm text-left rounded-2xl shadow-xl shadow-black/50"
                    >
                        <div className="mb-6 p-4 bg-white/5 w-fit rounded-xl border border-white/10 group-hover:border-white/30 group-hover:bg-white/10 transition-colors">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-serif text-white mb-3 group-hover:text-gray-200 transition-colors">{feature.title}</h3>
                        <p className="text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors">{feature.description}</p>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default Landing;
