import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Info, RefreshCw } from 'lucide-react';

interface DeploymentInfo {
  status: string;
  timestamp: string;
  version: string;
  deployTimestamp: string;
  gitCommit: string;
  cacheBust: string;
}

export function DeploymentInfo() {
  const [deployInfo, setDeployInfo] = useState<DeploymentInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDeploymentInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setDeployInfo(data);
    } catch (error) {
      console.error('Failed to fetch deployment info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      fetchDeploymentInfo();
    }
  }, []);

  // Show deployment info on triple-click anywhere (for production debugging)
  useEffect(() => {
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    const handleTripleClick = () => {
      clickCount++;

      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 500);
      } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        clickCount = 0;
        setIsVisible(!isVisible);
        if (!deployInfo) {
          fetchDeploymentInfo();
        }
      }
    };

    document.addEventListener('click', handleTripleClick);
    return () => {
      document.removeEventListener('click', handleTripleClick);
      if (clickTimer) clearTimeout(clickTimer);
    };
  }, [isVisible, deployInfo]);

  if (!isVisible) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp || timestamp === 'unknown') return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const shortCommit = (commit: string) => {
    if (!commit || commit === 'unknown') return 'unknown';
    return commit.substring(0, 8);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="glass-pane rounded-lg p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="font-medium">Deployment Info</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDeploymentInfo}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>

        {deployInfo ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Status:</span>
              <Badge variant={deployInfo.status === 'OK' ? 'default' : 'destructive'}>
                {deployInfo.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Version:</span>
              <span className="font-mono">{deployInfo.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Commit:</span>
              <span className="font-mono">{shortCommit(deployInfo.gitCommit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Deployed:</span>
              <span className="text-right">{formatTimestamp(deployInfo.deployTimestamp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Cache Bust:</span>
              <span className="font-mono">{deployInfo.cacheBust}</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-foreground/60">
            {isLoading ? 'Loading...' : 'Failed to load deployment info'}
          </div>
        )}

        <div className="text-center pt-2 border-t border-border">
          <span className="text-foreground/40">Triple-click anywhere to toggle</span>
        </div>
      </div>
    </div>
  );
}