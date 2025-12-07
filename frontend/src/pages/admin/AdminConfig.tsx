import React, { useState, useEffect } from 'react';
import { Settings, Shield, Activity, Cog, Code, Save, RefreshCw, Check } from 'lucide-react';
import { getConfig, updateConfig } from '../../lib/api';
import type { ConfigData } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
}

const tabs: TabConfig[] = [
  { id: 'auth', name: 'Authentication', icon: <Shield className="w-4 h-4" />, category: 'auth' },
  { id: 'observability', name: 'Observability', icon: <Activity className="w-4 h-4" />, category: 'observability' },
  { id: 'system', name: 'System', icon: <Cog className="w-4 h-4" />, category: 'system' },
  { id: 'generation', name: 'Generation', icon: <Code className="w-4 h-4" />, category: 'generation' },
];

const configLabels: Record<string, { label: string; description: string; type: 'text' | 'number' | 'boolean' | 'password' | 'select'; options?: string[] }> = {
  'auth.entraId.enabled': { label: 'Enable Entra ID SSO', description: 'Allow users to sign in with Microsoft Entra ID', type: 'boolean' },
  'auth.entraId.tenantId': { label: 'Tenant ID', description: 'Azure AD tenant ID (directory ID)', type: 'text' },
  'auth.entraId.clientId': { label: 'Client ID', description: 'Azure AD application client ID', type: 'text' },
  'auth.entraId.clientSecret': { label: 'Client Secret', description: 'Azure AD application client secret', type: 'password' },
  'observability.pollingInterval': { label: 'Polling Interval (ms)', description: 'How often to refresh metrics (1000-10000)', type: 'number' },
  'audit.retentionDays': { label: 'Audit Log Retention (days)', description: 'Days to keep audit logs before automatic cleanup', type: 'number' },
  'system.maxUploadSize': { label: 'Max Upload Size (bytes)', description: 'Maximum file upload size in bytes', type: 'number' },
  'system.maxCrawlDepth': { label: 'Max Crawl Depth', description: 'Maximum depth for URL crawling', type: 'number' },
  'generation.defaultLanguage': { label: 'Default Language', description: 'Default output language for MCP generation', type: 'select', options: ['typescript', 'python'] },
};

export const AdminConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState('auth');
  const [_config, setConfig] = useState<ConfigData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getConfig();
      setConfig(data);
      
      // Flatten config into form values
      const values: Record<string, any> = {};
      for (const category of Object.keys(data)) {
        for (const item of data[category]) {
          values[item.key] = item.value;
        }
      }
      setFormValues(values);
      setOriginalValues(values);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const hasChanges = () => {
    return Object.keys(formValues).some(key => formValues[key] !== originalValues[key]);
  };

  const getChangedValues = () => {
    const changes: Record<string, any> = {};
    for (const key of Object.keys(formValues)) {
      if (formValues[key] !== originalValues[key]) {
        changes[key] = formValues[key];
      }
    }
    return changes;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const changes = getChangedValues();
      await updateConfig(changes);
      setOriginalValues({ ...formValues });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormValues({ ...originalValues });
    setSaveSuccess(false);
  };

  const renderConfigItem = (key: string) => {
    const meta = configLabels[key] || { label: key, description: '', type: 'text' };
    const value = formValues[key];

    return (
      <div key={key} className="py-4 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground">
              {meta.label}
            </label>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta.description}
            </p>
          </div>
          <div className="w-64 flex-shrink-0">
            {meta.type === 'boolean' ? (
              <Switch
                checked={!!value}
                onCheckedChange={(checked) => handleChange(key, checked)}
              />
            ) : meta.type === 'select' ? (
              <Select value={value || ''} onValueChange={(v) => handleChange(key, v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meta.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : meta.type === 'number' ? (
              <Input
                type="number"
                value={value || ''}
                onChange={(e) => handleChange(key, parseInt(e.target.value, 10) || 0)}
              />
            ) : (
              <Input
                type={meta.type === 'password' ? 'password' : 'text'}
                value={value || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={meta.type === 'password' ? '••••••••' : ''}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const getKeysForCategory = (category: string): string[] => {
    return Object.keys(configLabels).filter((key) => key.startsWith(category + '.'));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Configuration
          </h2>
          <p className="text-muted-foreground">
            Manage system settings and configuration.
          </p>
        </div>
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-muted-foreground mx-auto animate-spin" />
          <p className="text-muted-foreground mt-4">Loading configuration...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Configuration
          </h2>
          <p className="text-muted-foreground">
            Manage system settings and configuration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges() || saving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || saving}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-6 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                {tab.icon}
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <CardContent className="p-6">
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                {getKeysForCategory(tab.category).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No configuration options available for this category.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {getKeysForCategory(tab.category).map((key) => renderConfigItem(key))}
                  </div>
                )}
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>

      {/* Help text */}
      <div className="text-sm text-muted-foreground">
        <Settings className="w-4 h-4 inline-block mr-1" />
        Changes to some settings may require a server restart to take effect.
      </div>
    </div>
  );
};
