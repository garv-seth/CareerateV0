import os
import json
import sys
import asyncio
from typing import Dict, Any, List
import aiohttp
from datetime import datetime

class WebSearchServer:
    def __init__(self):
        self.brave_api_key = os.getenv("BRAVE_SEARCH_API_KEY")
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        self.browserbase_api_key = os.getenv("BROWSERBASE_API_KEY")
        
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        method = request.get("method")
        params = request.get("params", {})
        
        if method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            
            if tool_name == "search":
                return await self.search(arguments)
            elif tool_name == "fetch_page":
                return await self.fetch_page(arguments)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        elif method == "list_tools":
            return {
                "result": [
                    {
                        "name": "search",
                        "description": "Search the web using Brave Search",
                        "parameters": {
                            "query": "string",
                            "limit": "number"
                        }
                    },
                    {
                        "name": "fetch_page",
                        "description": "Fetch and parse a web page",
                        "parameters": {
                            "url": "string"
                        }
                    }
                ]
            }
        else:
            return {"error": f"Unknown method: {method}"}
    
    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        query = params.get("query", "")
        limit = params.get("limit", 5)
        
        if not self.brave_api_key:
            return {"error": "Brave Search API key not configured"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={
                    "q": query,
                    "count": limit
                },
                headers={
                    "Accept": "application/json",
                    "X-Subscription-Token": self.brave_api_key
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "result": [
                            {
                                "title": result.get("title", ""),
                                "url": result.get("url", ""),
                                "description": result.get("description", "")
                            }
                            for result in data.get("web", {}).get("results", [])
                        ]
                    }
                else:
                    return {"error": f"Search failed: {response.status}"}
    
    async def fetch_page(self, params: Dict[str, Any]) -> Dict[str, Any]:
        url = params.get("url", "")
        
        if not self.browserbase_api_key:
            return {"error": "BrowserBase API key not configured"}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.browserbase.com/v1/fetch",
                json={
                    "url": url,
                    "wait_for": "networkidle0"
                },
                headers={
                    "Authorization": f"Bearer {self.browserbase_api_key}"
                }
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "result": {
                            "title": data.get("title", ""),
                            "content": data.get("content", ""),
                            "metadata": data.get("metadata", {})
                        }
                    }
                else:
                    return {"error": f"Page fetch failed: {response.status}"}

async def main():
    server = WebSearchServer()
    
    while True:
        try:
            # Read request from stdin
            request_line = sys.stdin.readline()
            if not request_line:
                break
                
            request = json.loads(request_line)
            response = await server.handle_request(request)
            
            # Write response to stdout
            print(json.dumps(response))
            sys.stdout.flush()
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(main()) 