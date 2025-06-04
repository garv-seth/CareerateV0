import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import usePageTitle from '@/hooks/usePageTitle';

const SettingsPage: React.FC = () => {
  usePageTitle('Settings - Careerate');

  // Placeholder state for settings
  const [trackBrowserActivity, setTrackBrowserActivity] = React.useState(true);
  const [trackToolUsage, setTrackToolUsage] = React.useState(true);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Settings</h1>
      <div className="bg-card p-6 rounded-lg shadow-lg">
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and integrations here.
        </p>
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

          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">Profile configuration options will be available soon.</p>
          </div>
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">Notification settings will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 