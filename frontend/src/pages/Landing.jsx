import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ArrowRight, Sparkles, Zap, Brain, Map } from "lucide-react";
import { motion } from "framer-motion";

const Landing = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4 relative overflow-hidden">

            {/* Subtle Gradient Spotlights - No Purples, just deep grays/whites */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-5xl mx-auto space-y-8 z-10"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium tracking-wider text-gray-400 uppercase mb-2 backdrop-blur-md">
                    <Map className="w-3 h-3" />
                    <span>The Roadmap Revolution</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight text-white leading-[1.1]">
                    RoadIs<span className="text-gray-500 italic">Taken</span>
                </h1>

                <p className="text-2xl text-gray-400 max-w-2xl mx-auto font-light">
                    Generate the perfect curriculum for any skill. <br />
                    <span className="text-gray-100">Topologically sorted. Instantly ready.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                    <Link to="/auth">
                        <Button size="lg" className="rounded-none border border-white bg-white text-black hover:bg-gray-200 h-14 px-10 text-lg transition-all shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]">
                            Start Journey <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link to="/auth">
                        <Button variant="ghost" size="lg" className="rounded-none border border-white/20 hover:bg-white/5 h-14 px-10 text-lg text-gray-300">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Features Minimalist */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl w-full px-4"
            >
                {[
                    {
                        icon: <Brain className="w-6 h-6 text-white" />,
                        title: "AI Architecture",
                        description: "Deep structured learning paths generated instantly."
                    },
                    {
                        icon: <Zap className="w-6 h-6 text-white" />,
                        title: "Instant Graph",
                        description: "Visual dependency trees for complex topics."
                    },
                    {
                        icon: <Sparkles className="w-6 h-6 text-white" />,
                        title: "Adaptive Levels",
                        description: "From Novice to Expert, scaled to your needs."
                    }
                ].map((feature, idx) => (
                    <div key={idx} className="group p-8 border border-white/5 bg-black/20 hover:bg-white/5 transition-all duration-300 backdrop-blur-sm text-left">
                        <div className="mb-6 p-3 bg-white/5 w-fit rounded-none border border-white/10 group-hover:border-white/30 transition-colors">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-serif text-white mb-3">{feature.title}</h3>
                        <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default Landing;
