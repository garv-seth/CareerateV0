import React, { useState } from 'react';
import axios from 'axios';

const ChatInterface = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse('');

    try {
      const result = await axios.post('http://localhost:3001/api/chat', { query });
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setResponse('Failed to get response from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Pair Programmer for DevOps & SRE</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your question here..."
          rows="5"
          cols="50"
          disabled={isLoading}
        />
        <br />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Ask AI'}
        </button>
      </form>
      {response && (
        <div>
          <h2>AI Response:</h2>
          <pre>{response}</pre>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 