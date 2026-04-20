import React, { useState } from 'react';
import { showNotification } from '../notifications';
import oweGoApk from '../assets/OweGo.apk';

const DownloadModal = ({ isOpen, onClose }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = () => {
        setIsDownloading(true);
        showNotification('Thanks for downloading OweGo APK!', 'info');

        setTimeout(() => {
            // Simulate download
            setIsDownloading(false);
            const dummyLink = document.createElement('a');
            dummyLink.href = oweGoApk;
            dummyLink.download = 'OweGo.apk';
            document.body.appendChild(dummyLink);
            dummyLink.click();
            document.body.removeChild(dummyLink);

            setTimeout(() => onClose(), 500);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 opacity-100"
            onClick={onClose}
        >
            <div
                className="bg-white p-8 rounded-[2rem] border border-gray-200 text-center max-w-sm w-[90%] shadow-2xl relative transform transition-all duration-300 scale-100"
                onClick={e => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-5 cursor-pointer text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Get OweGo App</h2>
                <p className="text-gray-500 text-sm mb-6">Experience faster expense tracking on your Android device.</p>

                <div className="bg-gray-50 p-5 rounded-2xl mb-6 text-left space-y-3 border border-gray-100">
                    <div className="flex justify-between text-sm"><span className="text-gray-400 font-medium">File:</span> <span className="text-gray-700 font-semibold">OweGo.apk</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400 font-medium">Size:</span> <span className="text-gray-700 font-semibold">14.2 MB</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400 font-medium">Version:</span> <span className="text-gray-700 font-semibold">v1.0.4</span></div>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full py-3.5 rounded-xl font-bold cursor-pointer transition-all duration-300 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    {isDownloading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Downloading...</span>
                        </>
                    ) : (
                        <span>Download APK</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DownloadModal;
