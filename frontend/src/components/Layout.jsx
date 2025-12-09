import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";

const Layout = ({ children }) => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    return (
        <div className="min-h-screen w-full relative bg-black text-gray-100 flex flex-col font-sans">
            {/* Dark White Dotted Grid Background */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    background: "#000000",
                    backgroundImage: `
                        radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
                    `,
                    backgroundSize: "30px 30px",
                    backgroundPosition: "0 0",
                }}
            />

            {/* Navbar */}
            <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="text-xl font-serif font-medium tracking-tight text-white hover:opacity-80 transition-opacity">
                            RoadIs<span className="text-gray-500 italic">Taken</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/dashboard" className="text-sm font-medium hover:text-white text-gray-400 transition-colors">
                                        Dashboard
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                                        Log out
                                    </Button>
                                </>
                            ) : (
                                <Link to="/auth">
                                    <Button variant="primary" size="sm">Sign In</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
