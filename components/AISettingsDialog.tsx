"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  PROVIDER_PRESETS,
  getStoredAIConfig,
  setStoredAIConfig,
  hasValidAIKey,
} from '@/lib/clientAIConfig';
import { AIProvider, AIClientConfig } from '@/types/ai';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AISettingsDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AISettingsDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: AISettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasKeyConfigured, setHasKeyConfigured] = useState(false);

  const { toast } = useToast();

  const loadConfig = () => {
    const config = getStoredAIConfig();
    const currentProvider = config.provider || 'gemini';
    const preset = PROVIDER_PRESETS[currentProvider] || PROVIDER_PRESETS.gemini;
    setProvider(currentProvider);
    setApiKey(config.apiKey || '');
    setBaseURL(config.baseURL || preset.defaultBaseURL);
    setModel(config.model || preset.defaultModel);
    setHasKeyConfigured(hasValidAIKey());
    setTestResult(null);
  };

  useEffect(() => {
    loadConfig();

    const handleUpdate = () => {
      loadConfig();
    };

    window.addEventListener('architect_ai_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('architect_ai_config_updated', handleUpdate);
    };
  }, []);

  const handleProviderSelect = (selected: AIProvider) => {
    setProvider(selected);
    const preset = PROVIDER_PRESETS[selected];
    setBaseURL(preset.defaultBaseURL);
    setModel(preset.defaultModel);
    setTestResult(null);
  };

  const handleSave = () => {
    const config: AIClientConfig = {
      provider,
      apiKey: apiKey.trim(),
      baseURL: baseURL.trim(),
      model: model.trim(),
    };
    setStoredAIConfig(config);
    setHasKeyConfigured(hasValidAIKey());
    toast({
      title: 'AI Settings Saved',
      description: `Configured for ${PROVIDER_PRESETS[provider]?.name || 'Custom'} (${model.trim() || 'default'}).`,
    });
    setIsOpen(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          baseURL: baseURL.trim(),
          model: model.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Connected successfully! Responded with model: ${data.model}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to connect. Please check credentials and endpoint.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Network error while testing connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const currentPreset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.gemini;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 relative border-neutral-200 dark:border-neutral-800 hover:border-purple-500/50"
            title="Configure AI Model & API Key (BYOK)"
          >
            <KeyRound className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span className="hidden sm:inline text-xs font-medium">AI Model</span>
            {hasKeyConfigured ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Set Key
              </Badge>
            )}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">AI Provider & API Key (BYOK)</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Bring your own key or connect any OpenAI-compatible endpoint.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Provider Selection Tabs */}
          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Select Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_PRESETS) as AIProvider[]).map((key) => {
                const p = PROVIDER_PRESETS[key];
                const active = provider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleProviderSelect(key)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                      active
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-1 ring-purple-600'
                        : 'border-neutral-200 dark:border-neutral-800 bg-card hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">{p.name}</span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                      {key === 'gemini' ? 'Free tier available' : key === 'custom' ? 'Local / Self-hosted' : p.defaultModel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description & Link */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
            <span className="line-clamp-1">{currentPreset.description}</span>
            {currentPreset.keyUrl && (
              <a
                href={currentPreset.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400 hover:underline shrink-0 ml-2"
              >
                <span>Get API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {provider === 'custom' ? 'API Key (Optional for Ollama)' : 'API Key'}
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKey ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={currentPreset.placeholderKey}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              className="text-xs font-mono"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Model Name
              </label>
              <span className="text-[10px] text-neutral-500">e.g. {currentPreset.defaultModel}</span>
            </div>
            <Input
              type="text"
              placeholder={currentPreset.defaultModel}
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestResult(null);
              }}
              className="text-xs font-mono"
            />
            {currentPreset.recommendedModels && currentPreset.recommendedModels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-neutral-500">Recommended:</span>
                {currentPreset.recommendedModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setModel(m);
                      setTestResult(null);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      model === m
                        ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-400 text-purple-700 dark:text-purple-300'
                        : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Base URL (OpenAI Compatible)
              </label>
              <button
                type="button"
                onClick={() => setBaseURL(currentPreset.defaultBaseURL)}
                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline"
              >
                Reset Default
              </button>
            </div>
            <Input
              type="text"
              placeholder={currentPreset.defaultBaseURL}
              value={baseURL}
              onChange={(e) => {
                setBaseURL(e.target.value);
                setTestResult(null);
              }}
              className="text-xs font-mono"
            />
          </div>

          {/* Test Status */}
          {testResult && (
            <div
              className={`p-3 rounded-md text-xs flex items-start gap-2 border ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{testResult.message}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 text-[11px] text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Zero Server Storage:</strong> Your API key is stored only in your local browser and sent directly as headers with your planning requests. It is never saved to the database.
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting || (!apiKey && !baseURL.includes('localhost'))}
            className="gap-1.5"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Save Configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
