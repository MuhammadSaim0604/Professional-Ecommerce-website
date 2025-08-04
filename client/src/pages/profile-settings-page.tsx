import { useQuery } from "@tanstack/react-query";
import ProfileSettings from "@/components/profile-settings";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function ProfileSettingsPage() {
  const [, navigate] = useLocation();
  const [defaultTab, setDefaultTab] = useState("profile");
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['profile', 'preferences', 'privacy', 'security'].includes(tab)) {
      setDefaultTab(tab);
    }
  }, []);

  // Also listen for location changes to update the tab
  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['profile', 'preferences', 'privacy', 'security'].includes(tab)) {
        setDefaultTab(tab);
      }
    };

    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your profile settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information, preferences, and privacy settings.
        </p>
      </div>
      <ProfileSettings user={user} defaultTab={defaultTab} />
    </div>
  );
}