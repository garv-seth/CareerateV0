import React from 'react';
import ChatInterface from './components/chat/ChatInterface';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";

const WelcomeUser = () => {
    const { accounts } = useMsal();
    const username = accounts[0].name;

    return <p>Welcome, {username}</p>;
};

function App() {
  const isAuthenticated = useIsAuthenticated();
  return (
    <div className="App">
       {isAuthenticated && <WelcomeUser />}
      <ChatInterface />
    </div>
  );
}

export default App; 