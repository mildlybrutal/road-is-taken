import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Check, Loader2, UnfoldVertical } from "lucide-react";
import api from "../utils/api";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const VerifiedModal = ({ isOpen, onClose, roadmapId, nodeId, onSuccess }) => {
    const [repoUrl, setRepoUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!repoUrl.trim()) return;

        setIsLoading(true);
        setError("");

        try {
            const res = await api.post("/roadmap/verify-node", {
                roadmapId,
                nodeId,
                githubRepoUrl: repoUrl
            });

            if (res.data.status === 200) {
                setSuccess(true);
                if (onSuccess) onSuccess(res.data.roadmap);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setRepoUrl("");
                }, 2000);
            } else {
                setError(res.data.message || "Verification failed");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-green-500" />
                                Verify Implementation
                            </h3>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-400 mb-6 text-sm">
                            Prove your mastery! Paste the link to the GitHub repository where you implemented this topic.
                        </p>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                                    GitHub Repository URL
                                </label>
                                <Input
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="https://github.com/username/project"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-green-500/50"
                                    disabled={isLoading || success}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-green-400 text-sm bg-green-500/10 p-3 rounded border border-green-500/20 flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Verified! Node unlocked.
                                </div>
                            )}

                            <Button
                                type="submit"
                                className={`w-full h-11 ${success ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                                disabled={isLoading || success || !repoUrl.trim()}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : success ? (
                                    <>
                                        <UnfoldVertical className="w-4 h-4 mr-2" />
                                        Unlocking Next Steps...
                                    </>
                                ) : (
                                    "Verify & Complete"
                                )}
                            </Button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default VerifiedModal;
