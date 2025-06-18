'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { LogoIcon } from './icons/logo-icon';
import { NavPill } from './nav-pill';
import { AgentStatusBar } from './agent-status-bar';
import { UserMenu } from './user-menu';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Agents', path: '/agents' },
  { name: 'Collaboration', path: '/collaboration' },
  { name: 'Settings', path: '/settings' },
];

export const GlassNavbar = () => {
  const [activePath, setActivePath] = useState('/');
  const agents = useStore((state) => state.agents);

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-glass-dark border-b border-glass-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo with animated glow */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary shadow-lg shadow-primary-main/25 
                            flex items-center justify-center animate-pulse-glow">
                <LogoIcon className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 w-10 h-10 rounded-lg bg-gradient-primary opacity-50 
                            animate-ping-slow"></div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Careerate</span>
          </div>

          {/* Glass Navigation Pills */}
          <div className="hidden md:flex items-center space-x-1 bg-glass-white rounded-full p-1 
                        border border-glass-border backdrop-blur-sm">
            {navItems.map((item) => (
              <div key={item.path} onClick={() => setActivePath(item.path)}>
                <NavPill name={item.name} path={item.path} isActive={activePath === item.path} />
              </div>
            ))}
          </div>

          {/* Agent Status Indicators */}
          <div className="flex items-center space-x-4">
            <AgentStatusBar agents={agents} />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}; 