'use client'; // Required for Next.js if using client-side features in animated-backgrounds

import React from 'react';
import { AnimatedBackground } from 'animated-backgrounds';

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden">
      <AnimatedBackground
        animationName="galaxySpiral" // Or another one like starryNight, particleNetwork
        // You can experiment with blendMode and other props as per the package docs
        // blendMode="screen"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      />
      <div className="relative z-10 p-4">
        <img src="/CareerateICON.png" alt="Careerate Logo" className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6" />
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Careerate: The AI for AI
        </h1>
        <p className="text-lg md:text-2xl mb-8 max-w-2xl mx-auto">
          Personalized AI tool recommendations and productivity insights to keep you ahead in the AI age.
        </p>
        {/* Placeholder for Auth / Sign Up button */}
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          // onClick={() => console.log('Sign up clicked')} // Replace with actual auth logic
        >
          Sign Up for Beta
        </button>
      </div>
    </div>
  );
};

export default HeroSection; 