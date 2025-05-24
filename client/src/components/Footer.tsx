import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-8 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 border-t border-blue-400/20 font-sfpro">
      <div className="flex items-center gap-3">
        <img src="/CareerateICON.png" alt="Careerate Logo" className="w-10 h-10 rounded-full shadow-lg" />
        <span className="text-xl font-bold tracking-tight">Careerate</span>
      </div>
      <nav className="flex flex-wrap gap-6 text-base font-medium">
        <a href="/" className="hover:underline hover:text-blue-200 transition">Home</a>
        <a href="/dashboard" className="hover:underline hover:text-blue-200 transition">Dashboard</a>
        <a href="/agents" className="hover:underline hover:text-blue-200 transition">Agents</a>
        <a href="/profile" className="hover:underline hover:text-blue-200 transition">Profile</a>
        <a href="/settings" className="hover:underline hover:text-blue-200 transition">Settings</a>
      </nav>
      <div className="text-sm text-blue-100/80 text-center md:text-right">
        © {new Date().getFullYear()} Careerate. All rights reserved.
      </div>
    </footer>
  );
} 