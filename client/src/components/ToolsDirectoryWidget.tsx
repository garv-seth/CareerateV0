import React, { useState, useEffect } from 'react';
import { Cpu, Search, ChevronDown, ChevronRight, Filter, ExternalLink } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  pricing: string;
  difficulty: string;
  popularity: number;
}

interface ToolCategory {
  id: string;
  name: string;
  description: string;
  tools: Tool[];
}

interface ToolsData {
  categories: ToolCategory[];
}

export default function ToolsDirectoryWidget() {
  const [toolsData, setToolsData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<{ difficulty: string[], pricing: string[] }>({ difficulty: [], pricing: [] });

  useEffect(() => {
    fetchToolsData();
  }, []);

  const fetchToolsData = async () => {
    try {
      const response = await fetch('/api/tools');
      const data = await response.json();
      setToolsData(data);
      // Initially expand all categories
      const initialExpansionState: Record<string, boolean> = {};
      if (data && data.categories) {
        data.categories.forEach((cat: ToolCategory) => initialExpansionState[cat.id] = true);
      }
      setExpandedCategories(initialExpansionState);
    } catch (error) {
      console.error('Error fetching tools data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // TODO: Implement filter logic based on filters state
  const filteredToolsData = toolsData; 

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
          {[1,2].map(i => (
            <div key={i} className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!filteredToolsData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
        <div className="text-center text-gray-500">
          <Cpu className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load AI tools directory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 font-sfpro">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Cpu className="w-6 h-6 mr-2 text-blue-600" />
          AI Tools Directory
        </h3>
        <div className="relative w-full md:w-1/3">
          <input 
            type="text"
            placeholder="Search tools..."
            className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        {/* TODO: Add Filter Button */}
        {/* <button className="p-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter className="w-5 h-5" />
        </button> */}        
      </div>

      {filteredToolsData.categories.map(category => (
        <div key={category.id} className="mb-6 last:mb-0">
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg cursor-pointer border-b border-gray-200"
            onClick={() => toggleCategory(category.id)}
          >
            <div>
              <h4 className="text-lg font-semibold text-gray-800">{category.name}</h4>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
            {expandedCategories[category.id] ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
          </div>

          {expandedCategories[category.id] && (
            <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tools.filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase())).map(tool => (
                <div key={tool.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900 truncate" title={tool.name}>{tool.name}</h5>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 h-10 overflow-hidden">{tool.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{tool.difficulty}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{tool.pricing}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" style={{ width: `${tool.popularity}%`}}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">Popularity: {tool.popularity}%</p>
                </div>
              ))}
              {category.tools.filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && searchTerm &&
                 <p className="text-sm text-gray-500 md:col-span-2 lg:col-span-3 text-center py-4">No tools found for "{searchTerm}" in this category.</p>
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 