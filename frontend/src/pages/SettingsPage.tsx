import React from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { useMsal } from '@azure/msal-react';
import { b2cPolicies } from '@/authConfig'; // For profile edit if needed
import { Settings as SettingsIcon, UserCircle, ShieldQuestion, LogOut } from 'lucide-react';

const SettingsPage: React.FC = () => {
  usePageTitle("Settings - Careerate");
  const { instance, accounts } = useMsal();

  const handleEditProfile = () => {
    if (b2cPolicies.names.profileEdit && b2cPolicies.authorities.profileEdit) {
      instance.loginRedirect({ ...b2cPolicies.authorities.profileEdit, scopes: [] }) // Scopes might be needed if API calls are made from profile edit page
        .catch(e => console.error("Profile edit redirect error: ", e));
    } else {
      alert("Profile edit policy is not configured in authConfig.ts");
    }
  };

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: "/" });
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header className="mb-12">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Navigation or Section (Optional) */}
        <div className="md:col-span-1 space-y-4">
          {/* Example: Could be links or just a conceptual grouping */}
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10">
            <UserCircle className="mr-2 h-5 w-5" /> Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/10">
            <ShieldQuestion className="mr-2 h-5 w-5" /> Account Security
          </Button>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-2 bg-card p-6 sm:p-8 rounded-lg shadow-md border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Account Management</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground">Edit Profile</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Update your personal information using your identity provider.
              </p>
              {b2cPolicies.names.profileEdit ? (
                <Button onClick={handleEditProfile} variant="outline">
                  Edit Profile via Azure AD B2C
                </Button>
              ) : (
                <p className="text-sm text-amber-500">Profile edit policy not configured.</p>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-medium text-destructive mb-1">Sign Out</h3>
              <p className="text-sm text-muted-foreground mb-3">
                End your current session and sign out of Careerate.
              </p>
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 