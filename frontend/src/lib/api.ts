import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied by Vite to the backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // In a real app, you would get the token from your auth context or local storage
    const token = localStorage.getItem('authToken'); // This is a placeholder
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Function to fetch the list of agents/servers
export const getAgents = async () => {
  const { data } = await api.get('/mcp/servers');
  return data.servers; // Based on the backend code I read
}; 