import { CareerateExtensionSettings, defaultSettings } from '@/types';

document.addEventListener('DOMContentLoaded', () => {
  const agentSelect = document.getElementById('agent-select') as HTMLSelectElement;
  const questionInput = document.getElementById('question-input') as HTMLTextAreaElement;
  const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
  const openDashboardLink = document.getElementById('open-dashboard') as HTMLAnchorElement;

  const API_BASE_URL = 'http://localhost:8000/api';
  const WEB_APP_URL = 'http://localhost:3000';

  // Fetch agents and populate dropdown
  const fetchAgents = async () => {
    if (!agentSelect) return;
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/servers`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      if (!data.servers || !Array.isArray(data.servers)) {
        throw new Error("Invalid data structure from API.");
      }

      agentSelect.innerHTML = ''; // Clear "Loading..."
      data.servers.forEach((agent: { id: string; name: string }) => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.name;
        agentSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      if (agentSelect) {
        agentSelect.innerHTML = '<option>Error loading agents</option>';
      }
    }
  };

  // Open the full dashboard
  const openDashboard = (e: MouseEvent) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` });
  };

  const handleSubmit = () => {
    const selectedAgent = agentSelect.value;
    const question = questionInput.value;
    if (!question.trim()) {
      questionInput.focus();
      return;
    }

    const url = new URL(`${WEB_APP_URL}/dashboard`);
    url.searchParams.set('agent', selectedAgent);
    url.searchParams.set('q', question);
    chrome.tabs.create({ url: url.toString() });
  };

  // Add event listeners
  fetchAgents();
  if (openDashboardLink) {
    openDashboardLink.addEventListener('click', openDashboard);
  }
  if (submitButton) {
    submitButton.addEventListener('click', handleSubmit);
  }
}); 