import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { showNotification } from '../notifications';
import DownloadModal from './DownloadModal';

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    </svg>
);

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
);

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            navigate(`/#${sectionId}`);
            return;
        }

        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        showNotification('Logged out successfully', 'success');
        navigate('/login');
    };

    const navigateHome = () => {
        navigate('/dashboard');
    }

    // Check if we're on a protected route (dashboard, profile, etc.)
    const isProtectedRoute = ['/dashboard', '/profile', '/groupdetails', '/creategroup'].includes(location.pathname);
    const isAuthRoute = ['/login', '/signup'].includes(location.pathname);

    if (isProtectedRoute) {
        return (
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 border-b bg-white shadow-sm">
                <img
                    src={logo}
                    alt="Logo"
                    className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate('/dashboard')}
                />
                <div className="flex items-center space-x-3">
                    {location.pathname !== '/dashboard' && (
                        <button
                            onClick={navigateHome}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all border border-blue-100 shadow-sm cursor-pointer group"
                        >
                            <div className="bg-white p-1 rounded-full shadow-inner group-hover:scale-110 transition-transform text-blue-600">
                                <HomeIcon />
                            </div>
                            <span className="text-sm font-semibold pr-1 text-blue-600">
                                Dashboard
                            </span>
                        </button>
                    )}

                    {location.pathname !== '/profile' && (
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-200 shadow-sm cursor-pointer group"
                        >
                            <div className="bg-white p-1 rounded-full shadow-inner group-hover:scale-110 transition-transform text-gray-600">
                                <UserIcon />
                            </div>
                            <span className="text-sm font-semibold pr-1">Profile</span>
                        </button>
                    )}

                    {location.pathname === '/profile' && (
                        <button
                            onClick={handleLogout}
                            disabled={!isLoggedIn}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 transition-all border border-red-100 shadow-sm cursor-pointer group"
                        >
                            <div className="bg-white p-1 rounded-full shadow-inner group-hover:scale-110 transition-transform text-red-600">
                                <LogoutIcon />
                            </div>
                            <span className="text-sm font-semibold pr-1">{!isLoggedIn ? 'Logging out...' : 'Logout'}</span>
                        </button>
                    )}
                </div>
                <DownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </header>
        );
    }

    // Public header for non-protected routes
    return (
        <header className="shadow sticky z-50 top-0">
            <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5">
                <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
                    <Link to="/" className="flex items-center">
                        <img src={logo} className="mr-5 h-10 w-auto" alt="Logo" />
                    </Link>
                    <div className="flex items-center lg:order-2">
                        {isAuthRoute ? (
                            <button
                                onClick={() => navigate('/')}
                                className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 focus:outline-none cursor-pointer transition-colors "
                            >
                                {'<'} Home
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="text-white bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 focus:outline-none cursor-pointer transition-colors "
                            >
                                Get Started {'>'}
                            </Link>
                        )}
                    </div>
                    {!isAuthRoute && (
                        <div
                            className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1"
                            id="mobile-menu-2"
                        >
                            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection('home')}
                                        className="block py-2 pr-4 pl-3 duration-200 text-grey-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0 cursor-pointer"
                                    >
                                        Home
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection('features')}
                                        className="block py-2 pr-4 pl-3 duration-200 text-grey-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0 cursor-pointer"
                                    >
                                        Features
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => scrollToSection('how-it-works')}
                                        className="block py-2 pr-4 pl-3 duration-200 text-grey-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0 cursor-pointer"
                                    >
                                        How It Work
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </nav>
            <DownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </header>
    );
}