import React from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { EngravedString } from '@/components/ui/interactive-string';

const LandingPage = () => {
    const { instance } = useMsal();

    const handleLogin = () => {
        instance.loginRedirect(loginRequest).catch(e => {
            console.error(e);
        });
    };

    return (
        <div className="relative w-full h-screen bg-gradient-to-br from-[#0a0a2a] via-[#0a0a2a] to-[#1e1e4b] overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <EngravedString text="Careerate" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h1
                    className="text-5xl md:text-7xl font-bold text-white mb-4 animate-fade-in-down"
                    style={{ textShadow: '0 4px 15px rgba(0, 0, 0, 0.5)' }}
                >
                    AI Pair Programmer for DevOps & SRE
                </h1>
                <p
                    className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in-up"
                    style={{ textShadow: '0 2px 5px rgba(0, 0, 0, 0.5)' }}
                >
                    Build, deploy, and manage your infrastructure with an AI partner that understands your code, streamlines your workflows, and enhances your productivity.
                </p>
                <button
                    onClick={handleLogin}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 animate-fade-in"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
};

export default LandingPage; 