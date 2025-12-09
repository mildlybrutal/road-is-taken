import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';

const DetailModal = ({ isOpen, onClose, node, onStatusChange }) => {
    if (!isOpen || !node) return null;

    const { label, description, status, resources } = node.data || {};
    // Mock resources if none provided, for demo purposes
    const links = resources || [
        { title: `${label} Documentation`, url: '#' },
        { title: `Learn ${label} in 10 Minutes`, url: '#' },
        { title: `Advanced ${label} Concepts`, url: '#' }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h2 className="text-2xl font-serif text-white">{label}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                {description || "No description available for this topic."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Recommended Resources</h3>
                            <div className="space-y-2">
                                {links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between group p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{link.title}</span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-gray-300" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-green-500' : status === 'pending' ? 'bg-white' : 'bg-gray-600'}`} />
                            <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                                {status}
                            </span>
                        </div>

                        {status === 'pending' && (
                            <Button
                                onClick={() => {
                                    onStatusChange(node.id, 'completed');
                                    onClose();
                                }}
                                className="bg-white text-black hover:bg-gray-200 border-none"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                            </Button>
                        )}
                        {status === 'completed' && (
                            <Button
                                variant="outline"
                                className="border-green-500/20 text-green-500 hover:bg-green-500/10 hover:text-green-400 cursor-default"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> Completed
                            </Button>
                        )}
                        {status === 'locked' && (
                            <Button disabled variant="outline" className="opacity-50 border-white/10 text-gray-500">
                                <Clock className="w-4 h-4 mr-2" /> Locked
                            </Button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DetailModal;
