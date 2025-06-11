import React from 'react';

const Popup = () => {
  return (
    <div className="w-[400px] bg-gradient-to-br from-[#1e1e4b] to-[#302b63] p-6 text-white font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-[#4a4189] p-2 rounded-lg">
            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Careerate</h1>
        </div>
      </div>

      <div>
        <label htmlFor="agent-select" className="block text-sm font-medium text-gray-300 mb-2">
          Select Agent
        </label>
        <select
          id="agent-select"
          className="w-full bg-[#2a245d] border border-[#4a4189] rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#7e7ee3]"
        >
          <option>Loading Agents...</option>
        </select>
      </div>

      <div className="mt-4">
        <label htmlFor="question-input" className="block text-sm font-medium text-gray-300 mb-2">
          Your Question
        </label>
        <textarea
          id="question-input"
          rows={4}
          className="w-full bg-[#2a245d] border border-[#4a4189] rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#7e7ee3]"
          placeholder="e.g., How do I secure a Kubernetes cluster?"
        />
      </div>

      <div className="flex items-center justify-between mt-6 space-x-4">
        <button className="flex-1 bg-gray-600/50 hover:bg-gray-500/50 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Analyze Page
        </button>
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Ask AI
        </button>
      </div>

      <div className="mt-6 text-center">
        <button className="text-gray-300 hover:text-white transition-colors">
          Open Full Dashboard
        </button>
      </div>
    </div>
  );
};

export default Popup; 