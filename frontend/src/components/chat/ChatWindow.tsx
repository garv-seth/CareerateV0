import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatWindowProps {
  agentName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agentName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    const aiResponseId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiResponseId, text: '', sender: 'ai' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ content: currentInput, role: 'user' }],
          agent: agentName,
        }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: !done });
        const eventLines = chunk.split('\n\n').filter(line => line.startsWith('data:'));
        
        for (const line of eventLines) {
            const jsonString = line.substring(5);
            try {
                const event = JSON.parse(jsonString);
                if (event.type === 'delta') {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === aiResponseId
                                ? { ...msg, text: msg.text + event.data }
                                : msg
                        )
                    );
                } else if (event.type === 'end') {
                  // You can handle the end of the stream here if needed
                  console.log('Stream ended');
                }
            } catch (e) {
                console.error('Failed to parse SSE event:', jsonString);
            }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiResponseId
            ? { ...msg, text: 'Error: Could not connect to the AI service.' }
            : msg
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg">
      {/* Message Display Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-600/50' 
                : 'bg-gray-700/50'
            }`}>
              <p className="text-white">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-white/10">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border border-white/20 rounded-l-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Ask ${agentName || 'Careerate'}...`}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600/50 border border-blue-500/50 text-white font-bold py-2 px-6 rounded-r-full transition-colors hover:bg-blue-500/60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 