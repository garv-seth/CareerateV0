'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TabButton } from './tab-button';
import AgentActivityFeed from './activity-views/agent-activity-feed';
import CodePreview from './activity-views/code-preview';
import CollaborationView from './activity-views/collaboration-view';
import MultiWorkspace from './activity-views/multi-workspace';

const tabs = [
    { id: 'activity', name: 'Activity' },
    { id: 'code', name: 'Code' },
    { id: 'collaboration', name: 'Collaboration' },
    { id: 'workspace', name: 'Workspace' },
] as const;

type TabId = typeof tabs[number]['id'];

const tabContent: { [key in TabId]: React.ComponentType } = {
    activity: AgentActivityFeed,
    code: CodePreview,
    collaboration: CollaborationView,
    workspace: MultiWorkspace,
}

export const ActivityViewer = () => {
    const [activeTab, setActiveTab] = useState<TabId>('activity');
    const ActiveComponent = tabContent[activeTab];

    return (
        <div className="w-3/5 h-full flex flex-col bg-glass-white/5 backdrop-blur-sm">
          
          {/* Tab Navigation */}
          <div className="flex items-center p-2 border-b border-glass-border">
            <div className="flex space-x-1 bg-glass-white rounded-lg p-1">
              {tabs.map((tab) => (
                <TabButton 
                    key={tab.id} 
                    name={tab.name} 
                    isActive={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
          </div>
    
          {/* Dynamic Content Area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    <ActiveComponent />
                </motion.div>
            </AnimatePresence>
          </div>
        </div>
      );
}; 