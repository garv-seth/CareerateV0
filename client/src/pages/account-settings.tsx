import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Key,
  CreditCard,
  Bell,
  Globe,
  Trash2,
  Save,
  Edit,
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/AppShell";

export default function AccountSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch subscription data
  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription/current"],
  });

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.metadata?.bio || "",
    company: user?.metadata?.company || "",
    location: user?.metadata?.location || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: formData.name,
      metadata: {
        bio: formData.bio,
        company: formData.company,
        location: formData.location,
      },
    });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground/70">Loading your profile...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center space-x-2 text-foreground/70 hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-foreground/60">Manage your account preferences and settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 glass-pane">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-foreground">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary/20 data-[state=active]:text-foreground">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-primary/20 data-[state=active]:text-foreground">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-primary/20 data-[state=active]:text-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="glass-pane rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Profile Information</CardTitle>
                    <CardDescription className="text-foreground/70">
                      Manage your account details and public profile
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-primary/10 rounded-full"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Full Name</Label>
                    <Input
                      value={isEditing ? formData.name : user?.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className="glass-pane rounded-lg text-foreground placeholder:text-foreground/50 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Email</Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="glass-pane rounded-lg text-foreground/60 disabled:opacity-60"
                    />
                    <p className="text-xs text-foreground/50">Email cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Bio</Label>
                  <Textarea
                    value={isEditing ? formData.bio : user?.metadata?.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    className="glass-pane rounded-lg text-foreground placeholder:text-foreground/50 disabled:opacity-60 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Company</Label>
                    <Input
                      value={isEditing ? formData.company : user?.metadata?.company || ""}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Your company"
                      className="glass-pane rounded-lg text-foreground placeholder:text-foreground/50 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Location</Label>
                    <Input
                      value={isEditing ? formData.location : user?.metadata?.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Your location"
                      className="glass-pane rounded-lg text-foreground placeholder:text-foreground/50 disabled:opacity-60"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="border-border text-foreground hover:bg-primary/10 rounded-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-primary-foreground rounded-full"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="glass-pane rounded-3xl">
              <CardHeader>
                <CardTitle className="text-foreground">Security Settings</CardTitle>
                <CardDescription className="text-foreground/70">
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                      <p className="text-sm text-foreground/60">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">Login Notifications</h3>
                      <p className="text-sm text-foreground/60">Get notified when someone logs into your account</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">API Key Access</h3>
                      <p className="text-sm text-foreground/60">Personal API key for programmatic access</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value="sk_live_..."
                        disabled
                        className="w-48 glass-pane text-foreground/60 text-xs font-mono"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-foreground/70 hover:text-foreground hover:bg-primary/10 rounded-full"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Connected Accounts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">GH</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">GitHub</p>
                          <p className="text-sm text-foreground/60">Connected as @{user?.metadata?.github_username || 'username'}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="glass-pane rounded-3xl">
              <CardHeader>
                <CardTitle className="text-foreground">Subscription & Billing</CardTitle>
                <CardDescription className="text-foreground/70">
                  Manage your subscription plan and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {subscription?.plan?.displayName || "Free Plan"}
                      </h3>
                      <p className="text-foreground/70">
                        ${subscription?.plan?.monthlyPrice || 0}/month
                      </p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {subscription?.status || "Active"}
                    </Badge>
                  </div>

                  {subscription?.usage && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-medium text-foreground">Usage This Month</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/70">Projects</span>
                            <span className="text-foreground">
                              {subscription.usage.projects?.usage || 0} / {subscription.usage.projects?.limit === -1 ? "∞" : subscription.usage.projects?.limit || 0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground/70">AI Generations</span>
                            <span className="text-foreground">
                              {subscription.usage.aiGenerations?.usage || 0} / {subscription.usage.aiGenerations?.limit === -1 ? "∞" : subscription.usage.aiGenerations?.limit || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Button variant="outline" className="border-border text-foreground hover:bg-primary/10 rounded-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Payment Methods
                  </Button>
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 text-primary-foreground rounded-full">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="glass-pane rounded-3xl">
              <CardHeader>
                <CardTitle className="text-foreground">Preferences</CardTitle>
                <CardDescription className="text-foreground/70">
                  Customize your Careerate experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">Email Notifications</h3>
                      <p className="text-sm text-foreground/60">Receive emails about deployments and important updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">Desktop Notifications</h3>
                      <p className="text-sm text-foreground/60">Show browser notifications for real-time events</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">Auto-Deploy</h3>
                      <p className="text-sm text-foreground/60">Automatically deploy when code is pushed to main branch</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg glass-pane">
                    <div>
                      <h3 className="font-medium text-foreground">AI Suggestions</h3>
                      <p className="text-sm text-foreground/60">Get proactive AI recommendations for code improvements</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Danger Zone</h3>
                  <Alert className="border-red-500/30 bg-red-500/10">
                    <AlertDescription className="text-red-300">
                      Once you delete your account, there is no going back. Please be certain.
                    </AlertDescription>
                  </Alert>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}