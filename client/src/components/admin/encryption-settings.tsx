import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Unlock, Key, Settings, Database, Server, Globe, Activity, Eye, EyeOff, BarChart3, RefreshCw, AlertTriangle } from "lucide-react";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EncryptionSettings {
  globalEncryption: boolean;
  routeEncryption: {
    orders: boolean;
    admin: boolean;
    users: boolean;
    payments: boolean;
    products: boolean;
    profile: boolean;
  };
  clientDecryption: boolean;
  loggingEnabled: boolean;
  testingMode: boolean;
}

const defaultSettings: EncryptionSettings = {
  globalEncryption: true,
  routeEncryption: {
    orders: true,
    admin: true,
    users: true,
    payments: true,
    products: true,
    profile: true,
  },
  clientDecryption: false,
  loggingEnabled: true,
  testingMode: false,
};

export function EncryptionSettings() {
  const [settings, setSettings] = useState<EncryptionSettings>(defaultSettings);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current encryption settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/admin/encryption-settings'],
    queryFn: () => apiRequestJson('/api/admin/encryption-settings'),
    onSuccess: (data) => {
      if (data) {
        const newSettings = { ...defaultSettings, ...data };
        setSettings(newSettings);
        
        // Settings loaded from server
      }
    },
    onError: () => {
      // If endpoint doesn't exist, use defaults
      setSettings(defaultSettings);
    }
  });

  // Update encryption settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: EncryptionSettings) =>
      apiRequestJson('/api/admin/encryption-settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      }),
    onSuccess: () => {
      toast({
        title: "Encryption Settings Updated",
        description: "Changes will take effect immediately for new requests.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/encryption-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update encryption settings",
        variant: "destructive",
      });
    },
  });

  // Get encryption statistics
  const { data: encryptionStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/encryption-stats'],
    queryFn: () => apiRequestJson('/api/admin/encryption-stats'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Test endpoint mutation
  const testEndpointMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const startTime = Date.now();
      const response = await apiRequestJson(endpoint);
      const endTime = Date.now();
      return { endpoint, response, responseTime: endTime - startTime };
    },
    onSuccess: (data) => {
      const isEncrypted = data.response?.encrypted === true;
      setTestResults(prev => [...prev.slice(-4), data]); // Keep last 5 results
      toast({
        title: "Test Complete",
        description: `${data.endpoint}: ${isEncrypted ? 'Encrypted' : 'Plain'} (${data.responseTime}ms)`,
        variant: isEncrypted ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test endpoint",
        variant: "destructive"
      });
    }
  });

  // Test encryption endpoint
  const testEncryptionMutation = useMutation({
    mutationFn: () => apiRequestJson('/api/admin/test-encryption'),
    onSuccess: (data) => {
      toast({
        title: "Encryption Test Results",
        description: `Test completed. Response time: ${data.responseTime}ms`,
      });
    },
  });

  const handleSettingChange = (key: keyof EncryptionSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const handleRouteSettingChange = (route: keyof EncryptionSettings['routeEncryption'], value: boolean) => {
    const newSettings = {
      ...settings,
      routeEncryption: {
        ...settings.routeEncryption,
        [route]: value,
      },
    };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const enableTestingMode = () => {
    const testingSettings = {
      ...settings,
      globalEncryption: false,
      routeEncryption: {
        orders: false,
        admin: false,
        users: false,
        payments: false,
        products: false,
        profile: false,
      },
      clientDecryption: false,
      testingMode: true,
      loggingEnabled: true,
    };
    setSettings(testingSettings);
    updateSettingsMutation.mutate(testingSettings);
  };

  const enableProductionMode = () => {
    const productionSettings = {
      ...settings,
      globalEncryption: true,
      routeEncryption: {
        orders: true,
        admin: true,
        users: true,
        payments: true,
        products: true,
        profile: true,
      },
      clientDecryption: false,
      testingMode: false,
      loggingEnabled: true,
    };
    setSettings(productionSettings);
    updateSettingsMutation.mutate(productionSettings);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Encryption & Security Control Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Mode</p>
              <Badge variant={settings.testingMode ? "secondary" : "default"}>
                {settings.testingMode ? "Testing Mode" : "Production Mode"}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant={settings.testingMode ? "default" : "outline"}
                size="sm"
                onClick={enableTestingMode}
                disabled={updateSettingsMutation.isPending}
              >
                <Settings className="h-4 w-4 mr-2" />
                Enable Testing Mode
              </Button>
              <Button
                variant={!settings.testingMode ? "default" : "outline"}
                size="sm"
                onClick={enableProductionMode}
                disabled={updateSettingsMutation.isPending}
              >
                <Shield className="h-4 w-4 mr-2" />
                Enable Production Mode
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Encryption Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Global Encryption</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all encryption functionality
              </p>
            </div>
            <Switch
              checked={settings.globalEncryption}
              onCheckedChange={(value) => handleSettingChange('globalEncryption', value)}
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Client-side Decryption</Label>
              <p className="text-sm text-muted-foreground">
                Automatically decrypt responses on the frontend
              </p>
            </div>
            <Switch
              checked={settings.clientDecryption}
              onCheckedChange={(value) => handleSettingChange('clientDecryption', value)}
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Security Logging</Label>
              <p className="text-sm text-muted-foreground">
                Log encryption/decryption events for monitoring
              </p>
            </div>
            <Switch
              checked={settings.loggingEnabled}
              onCheckedChange={(value) => handleSettingChange('loggingEnabled', value)}
              disabled={updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Route-Specific Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Route-Specific Encryption
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings.routeEncryption).map(([route, enabled]) => (
            <div key={route} className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="capitalize">/api/{route}</Label>
                <p className="text-sm text-muted-foreground">
                  {route === 'orders' && 'Order creation, retrieval, and payment processing'}
                  {route === 'admin' && 'Admin panel operations and user management'}
                  {route === 'users' && 'User data and profile management'}
                  {route === 'payments' && 'Payment processing and financial data'}
                  {route === 'products' && 'Product creation and management'}
                  {route === 'profile' && 'User profile updates and personal data'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={enabled ? "default" : "secondary"}>
                  {enabled ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                  {enabled ? 'Encrypted' : 'Plain'}
                </Badge>
                <Switch
                  checked={enabled}
                  onCheckedChange={(value) => handleRouteSettingChange(route as keyof EncryptionSettings['routeEncryption'], value)}
                  disabled={updateSettingsMutation.isPending || !settings.globalEncryption}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Testing & Debugging Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Test Encryption System</Label>
              <p className="text-sm text-muted-foreground">
                Send a test request to verify encryption is working
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testEncryptionMutation.mutate()}
              disabled={testEncryptionMutation.isPending}
            >
              {testEncryptionMutation.isPending ? 'Testing...' : 'Run Test'}
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Encrypted Routes:</strong>
                <ul className="list-disc list-inside mt-1">
                  {Object.entries(settings.routeEncryption)
                    .filter(([_, enabled]) => enabled)
                    .map(([route]) => (
                      <li key={route} className="capitalize">
                        /api/{route}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <strong>Plain Text Routes:</strong>
                <ul className="list-disc list-inside mt-1">
                  {Object.entries(settings.routeEncryption)
                    .filter(([_, enabled]) => !enabled)
                    .map(([route]) => (
                      <li key={route} className="capitalize">
                        /api/{route}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {settings.testingMode && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Testing Mode Active</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                All encryption is disabled. Requests and responses are in plain text for easy debugging.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug & Testing Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Debug & Testing Tools
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
            >
              {showDebugPanel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Real-time Statistics */}
          {encryptionStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {encryptionStats.enabledRoutes?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Encrypted Routes</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {encryptionStats.globalEncryption ? 'ON' : 'OFF'}
                </p>
                <p className="text-sm text-muted-foreground">Global Status</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {encryptionStats.testingMode ? 'TEST' : 'PROD'}
                </p>
                <p className="text-sm text-muted-foreground">Current Mode</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchStats()}
                  disabled={testEndpointMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground mt-2">Refresh Stats</p>
              </div>
            </div>
          )}

          {/* Debug Panel */}
          {showDebugPanel && (
            <div className="space-y-4 border-t pt-4">
              {/* Endpoint Testing */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Live Endpoint Testing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { name: "Orders", path: "/api/orders" },
                    { name: "Users", path: "/api/users" },
                    { name: "Products", path: "/api/products" },
                  ].map((endpoint) => (
                    <Button
                      key={endpoint.path}
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => testEndpointMutation.mutate(endpoint.path)}
                      disabled={testEndpointMutation.isPending}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Test {endpoint.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Recent Test Results
                  </h4>
                  <div className="space-y-2">
                    {testResults.slice(-3).map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium">{result.endpoint}</span>
                          <Badge className="ml-2" variant={result.response?.encrypted ? "default" : "secondary"}>
                            {result.response?.encrypted ? 'Encrypted' : 'Plain'}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{result.responseTime}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Server Settings Display */}
              <div>
                <h4 className="font-medium mb-3">Server-Side Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Client Decryption:</span>
                    <Badge variant={settings.clientDecryption ? "default" : "secondary"}>
                      {settings.clientDecryption ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Global Encryption:</span>
                    <Badge variant={settings.globalEncryption ? "default" : "secondary"}>
                      {settings.globalEncryption ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Testing Mode:</span>
                    <Badge variant={settings.testingMode ? "secondary" : "default"}>
                      {settings.testingMode ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}