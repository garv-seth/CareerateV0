'use client';

import { GlassButton } from "@careerate/ui";
import { Send } from "lucide-react";
import React, { useState } from "react";

interface ChatInputProps {
    onSend: (message: string) => void;
}

export const ChatInput = ({ onSend }: ChatInputProps) => {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage("");
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your AInterns..."
                className="flex-1 w-full px-4 py-2 text-sm text-white bg-glass-white border border-glass-border rounded-lg focus:ring-2 focus:ring-primary-main focus:outline-none backdrop-blur-sm"
            />
            <GlassButton size="md" onClick={handleSend}>
                <Send className="w-4 h-4" />
            </GlassButton>
        </div>
    );
}; 