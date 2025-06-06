import React, { useState } from 'react';
import axios from 'axios';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRequest } from '../../lib/msalConfig';

const ChatInterface = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.error(e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: '/',
      mainWindowRedirectUri: '/',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse('');

    const request = {
      ...loginRequest,
      account: accounts[0],
    };

    try {
      const tokenResponse = await instance.acquireTokenSilent(request);
      const headers = {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      };
      const result = await axios.post('http://localhost:3001/api/chat', { query }, { headers });
      setResponse(result.data.response);
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        instance.acquireTokenPopup(request).then(async (tokenResponse) => {
            const headers = {
                Authorization: `Bearer ${tokenResponse.accessToken}`,
            };
            const result = await axios.post('http://localhost:3001/api/chat', { query }, { headers });
            setResponse(result.data.response);
        }).catch((e) => {
            console.error(e);
            setResponse('Failed to acquire token.');
        })
      }
      console.error('Error fetching chat response:', error);
      setResponse('Failed to get response from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Pair Programmer for DevOps & SRE</h1>
      {isAuthenticated ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
      <form onSubmit={handleSubmit}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your question here..."
          rows="5"
          cols="50"
          disabled={isLoading || !isAuthenticated}
        />
        <br />
        <button type="submit" disabled={isLoading || !isAuthenticated}>
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