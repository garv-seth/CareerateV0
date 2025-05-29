import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SettingsPage: React.FC = () => {
  // Placeholder state for settings
  const [trackBrowserActivity, setTrackBrowserActivity] = React.useState(true);
  const [trackToolUsage, setTrackToolUsage] = React.useState(true);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Data Collection Preferences</h2>
          <div className="flex items-center justify-between mb-4">
            <Label htmlFor="browser-activity" className="text-base text-foreground">
              Track browser activity (URLs, time spent)
            </Label>
            <Switch 
              id="browser-activity" 
              checked={trackBrowserActivity} 
              onCheckedChange={setTrackBrowserActivity} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tool-usage" className="text-base text-foreground">
              Track development tool usage (VS Code, etc.)
            </Label>
            <Switch 
              id="tool-usage" 
              checked={trackToolUsage} 
              onCheckedChange={setTrackToolUsage} 
            />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Careerate is committed to your privacy. We only collect non-sensitive data to provide personalized recommendations. You can toggle these settings anytime.
          </p>
        </div>

        {/* Add other settings sections here, e.g., Account, Notifications */}
      </div>
    </div>
  );
};

export default SettingsPage; 