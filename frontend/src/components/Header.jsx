import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { showNotification } from '../notifications';
import DownloadModal from './DownloadModal';

const AndroidIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 cursor-pointer">
        <path d="M17.523 15.3414C17.0509 15.3414 16.6633 14.9538 16.6633 14.4817C16.6633 14.0097 17.0509 13.6221 17.523 13.6221C17.995 13.6221 18.3826 14.0097 18.3826 14.4817C18.3826 14.9538 17.995 15.3414 17.523 15.3414ZM6.47702 15.3414C6.00497 15.3414 5.6174 14.9538 5.6174 14.4817C5.6174 14.0097 6.00497 13.6221 6.47702 13.6221C6.94906 13.6221 7.33663 14.0097 7.33663 14.4817C7.33663 14.9538 6.94906 15.3414 6.47702 15.3414ZM17.1517 7.23485L18.847 4.29845C18.966 4.09241 18.8953 3.82855 18.6893 3.70951C18.4833 3.59047 18.2194 3.66115 18.1004 3.86719L16.3881 6.83296C15.0975 6.24151 13.6293 5.9189 12.0001 5.9189C10.3708 5.9189 8.90263 6.24151 7.61203 6.83296L5.89973 3.86719C5.78069 3.66115 5.51684 3.59047 5.31079 3.70951C5.10475 3.82855 5.03407 4.09241 5.15311 4.29845L6.84841 7.23485C3.8966 8.7909 2.00012 11.8347 2.00012 15.3333V16.2736C2.00012 16.5188 2.19838 16.717 2.44358 16.717H21.5566C21.8018 16.717 22.0001 16.5188 22.0001 16.2736V15.3333C22.0001 11.8347 20.1036 8.7909 17.1517 7.23485Z" />
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
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-200 shadow-sm cursor-pointer group"
                        title="Download App"
                    >
                        <div className="bg-white p-1 rounded-full shadow-inner group-hover:scale-110 transition-transform">
                            <AndroidIcon />
                        </div>
                        <span className="text-sm font-semibold pr-1">Try our app</span>
                    </button>
                    {location.pathname === '/profile' ? (
                        <button
                            onClick={handleLogout}
                            disabled={!isLoggedIn}
                            className="border px-4 py-1 rounded font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            {!isLoggedIn ? 'Logging out...' : 'Logout'}
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/profile')}
                            className="border px-4 py-1 rounded font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            Profile
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
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center space-x-2 px-3 py-1.5 mr-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all border border-gray-200 cursor-pointer group"
                            title="Download App"
                        >
                            <div className="bg-white p-1 rounded-full shadow-inner group-hover:scale-110 transition-transform">
                                <AndroidIcon />
                            </div>
                            <span className="text-sm font-semibold pr-1">Try our app</span>
                        </button>
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