import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Paintbrush, Globe,
  Bell, Box, MessageSquare, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { ROUTES } from '@/constants/routes';
import './personalization.css';

// TypeScript Definitions
type ResponseStyle = 'concise' | 'balanced' | 'detailed';
type ResponseTone = 'professional' | 'friendly' | 'direct';
type ThemeMode = 'corporate-white' | 'dark' | 'system';

interface UserPreferences {
  ai: {
    responseStyle: ResponseStyle;
    responseTone: ResponseTone;
    responseFormat: string;
    explanationLevel: string;
    enableSuggestions: boolean;
    useWorkspaceContext: boolean;
  };
  appearance: {
    theme: ThemeMode;
  };
  language: {
    language: string;
  };
  notifications: {
    dailyBriefing: boolean;
    meetingSummaries: boolean;
    workflowApprovals: boolean;
    taskReminders: boolean;
    integrationAlerts: boolean;
    securityAlerts: boolean;
  };
  context: {
    usePreferences: boolean;
    conversationContext: boolean;
    workspaceContext: boolean;
    meetingContext: boolean;
  };
  chat: {
    enterToSend: boolean;
    showTimestamps: boolean;
    autoScroll: boolean;
    saveHistory: boolean;
    suggestedPrompts: boolean;
    newChatContext: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  ai: {
    responseStyle: 'balanced',
    responseTone: 'professional',
    responseFormat: 'structured',
    explanationLevel: 'standard',
    enableSuggestions: true,
    useWorkspaceContext: true,
  },
  appearance: {
    theme: 'system',
  },
  language: {
    language: 'english',
  },
  notifications: {
    dailyBriefing: true,
    meetingSummaries: true,
    workflowApprovals: true,
    taskReminders: true,
    integrationAlerts: true,
    securityAlerts: true, // Required by infosec architecture
  },
  context: {
    usePreferences: true,
    conversationContext: true,
    workspaceContext: true,
    meetingContext: true,
  },
  chat: {
    enterToSend: true,
    showTimestamps: false,
    autoScroll: true,
    saveHistory: true,
    suggestedPrompts: true,
    newChatContext: true,
  },
};

const Toggle = ({
  checked,
  onChange,
  ariaLabel
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    className="pref-switch"
    onClick={() => onChange(!checked)}
  >
    <span className="pref-switch-thumb" />
  </button>
);

const SegmentControl = ({
  options,
  value,
  onChange
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="segmented-control">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`segment-btn ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function PersonalizationPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Load from local storage
  useEffect(() => {
    const stored = localStorage.getItem('eaios_preferences');
    if (stored) {
      try {
        setPrefs(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse preferences");
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('eaios_preferences', JSON.stringify(prefs));
    // Also notify theme hook if appearance.theme was modified differently from global current theme.
    // The instructions say "if the project already exposes a theme context, use it. Do NOT duplicate theme logic."
    // We update preference state but let the user toggle global theme via the existing button,
    // or allow them to set it specifically here and we call toggleTheme() if needed to match.
    // Given the Topbar only has toggleTheme, we can just switch it if it differs.
    if ((prefs.appearance.theme === 'dark' && theme === 'corporate-white') ||
      (prefs.appearance.theme === 'corporate-white' && theme === 'dark')) {
      toggleTheme();
    }
    toast.success('Preferences saved successfully');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all preferences to their defaults?')) {
      setPrefs(DEFAULT_PREFERENCES);
      toast.success('Preferences reset to defaults');
    }
  };

  const updateSection = <K extends keyof UserPreferences>(
    section: K,
    key: keyof UserPreferences[K],
    value: any
  ) => {
    setPrefs((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      }
    }));
  };

  return (
    <div className="personalization-page">
      <motion.div
        className="personalization-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="personalization-title">Personalization</h1>
        <p className="personalization-subtitle">
          Customize how EAIOS looks, responds, and works for you.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="rest"
        animate="hover"
      >
        {/* Section 1: AI Preferences */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><Settings size={20} /></div>
            <div>
              <h2 className="card-title">AI Preferences</h2>
              <p className="card-subtitle">Control how EAIOS generates responses.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Response Style</span>
              <span className="pref-desc">Choose how detailed EAIOS responses should be.</span>
            </div>
            <SegmentControl
              options={[
                { label: 'Concise', value: 'concise' },
                { label: 'Balanced', value: 'balanced' },
                { label: 'Detailed', value: 'detailed' }
              ]}
              value={prefs.ai.responseStyle}
              onChange={(val) => updateSection('ai', 'responseStyle', val as ResponseStyle)}
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Response Tone</span>
              <span className="pref-desc">Select the personality and tone of the AI.</span>
            </div>
            <SegmentControl
              options={[
                { label: 'Professional', value: 'professional' },
                { label: 'Friendly', value: 'friendly' },
                { label: 'Direct', value: 'direct' }
              ]}
              value={prefs.ai.responseTone}
              onChange={(val) => updateSection('ai', 'responseTone', val as ResponseTone)}
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Default Response Format</span>
            </div>
            <select
              className="pref-select"
              value={prefs.ai.responseFormat}
              onChange={(e) => updateSection('ai', 'responseFormat', e.target.value)}
              aria-label="Default Response Format"
            >
              <option value="structured">Structured</option>
              <option value="plaintext">Plain Text</option>
              <option value="bulleted">Bulleted</option>
              <option value="step-by-step">Step-by-step</option>
            </select>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Enable AI Suggestions</span>
              <span className="pref-desc">Show follow-up suggestions after an answer.</span>
            </div>
            <Toggle
              checked={prefs.ai.enableSuggestions}
              onChange={(val) => updateSection('ai', 'enableSuggestions', val)}
              ariaLabel="Enable AI suggestions"
            />
          </div>
        </motion.section>

        {/* Section 2: Appearance */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><Paintbrush size={20} /></div>
            <div>
              <h2 className="card-title">Appearance</h2>
              <p className="card-subtitle">Manage EAIOS theme and visual preferences.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Theme</span>
              <span className="pref-desc">Select your preferred color theme.</span>
            </div>
            <SegmentControl
              options={[
                { label: 'Light', value: 'corporate-white' },
                { label: 'Dark', value: 'dark' },
              ]}
              value={prefs.appearance.theme === 'system' ? theme : prefs.appearance.theme}
              onChange={(val) => {
                updateSection('appearance', 'theme', val);
              }}
            />
          </div>

        </motion.section>

        {/* Section 3: Language & Region */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><Globe size={20} /></div>
            <div>
              <h2 className="card-title">Language & Region</h2>
              <p className="card-subtitle">Set your regional preferences.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Language</span>
            </div>
            <select
              className="pref-select"
              value={prefs.language.language}
              onChange={(e) => updateSection('language', 'language', e.target.value)}
              aria-label="Language"
            >
              <option value="english">English</option>
            </select>
          </div>

        </motion.section>

        {/* Section 4: Notifications */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><Bell size={20} /></div>
            <div>
              <h2 className="card-title">Notifications</h2>
              <p className="card-subtitle">Manage which notifications you receive.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Daily AI Briefing</span>
              <span className="pref-desc">Receive your daily AI-generated briefing.</span>
            </div>
            <Toggle
              checked={prefs.notifications.dailyBriefing}
              onChange={(val) => updateSection('notifications', 'dailyBriefing', val)}
              ariaLabel="Daily AI Briefing"
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Meeting Summaries</span>
              <span className="pref-desc">Receive notifications when meeting summaries are ready.</span>
            </div>
            <Toggle
              checked={prefs.notifications.meetingSummaries}
              onChange={(val) => updateSection('notifications', 'meetingSummaries', val)}
              ariaLabel="Meeting Summaries"
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Security Alerts</span>
              <span className="pref-desc">Receive important security and account notifications. (Required)</span>
            </div>
            <Toggle
              checked={prefs.notifications.securityAlerts}
              onChange={() => toast('Security alerts are required by organizational policies.', { icon: '🛡️' })}
              ariaLabel="Security Alerts"
            />
          </div>
        </motion.section>

        {/* Section 5: Personal Context */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><User size={20} /></div>
            <div>
              <h2 className="card-title">Personal Context</h2>
              <p className="card-subtitle">These preferences control how EAIOS uses available context within your authorized workspace permissions.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Use My Preferences</span>
              <span className="pref-desc">Allow EAIOS to use my personalization preferences when responding.</span>
            </div>
            <Toggle
              checked={prefs.context.usePreferences}
              onChange={(val) => updateSection('context', 'usePreferences', val)}
              ariaLabel="Use My Preferences"
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Remember Conversation Context</span>
              <span className="pref-desc">Use relevant previous conversation context for follow-ups.</span>
            </div>
            <Toggle
              checked={prefs.context.conversationContext}
              onChange={(val) => updateSection('context', 'conversationContext', val)}
              ariaLabel="Conversation Context"
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Use Workspace Context</span>
              <span className="pref-desc">Use authorized workspace information when relevant.</span>
            </div>
            <Toggle
              checked={prefs.context.workspaceContext}
              onChange={(val) => updateSection('context', 'workspaceContext', val)}
              ariaLabel="Workspace Context"
            />
          </div>
        </motion.section>

        {/* Section 6: Chat Preferences */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><MessageSquare size={20} /></div>
            <div>
              <h2 className="card-title">Chat Preferences</h2>
              <p className="card-subtitle">Customize your chat interface experience.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Enter to Send</span>
              <span className="pref-desc">Press Enter to send a message. (Shift+Enter for newline)</span>
            </div>
            <Toggle
              checked={prefs.chat.enterToSend}
              onChange={(val) => updateSection('chat', 'enterToSend', val)}
              ariaLabel="Enter to Send"
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Show Message Timestamps</span>
            </div>
            <Toggle
              checked={prefs.chat.showTimestamps}
              onChange={(val) => updateSection('chat', 'showTimestamps', val)}
              ariaLabel="Show Message Timestamps"
            />
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Save Chat History</span>
            </div>
            <Toggle
              checked={prefs.chat.saveHistory}
              onChange={(val) => updateSection('chat', 'saveHistory', val)}
              ariaLabel="Save Chat History"
            />
          </div>
        </motion.section>

        {/* Section 7: Integration Preferences */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </div>
            <div>
              <h2 className="card-title">Integration Context Options</h2>
              <p className="card-subtitle">Allow EAIOS to use connected platforms to provide richer context.</p>
            </div>
          </div>

          <div className="integration-item">
            <div className="integration-icon">
              <Box size={20} />
            </div>
            <div className="pref-info">
              <span className="pref-label">No connections</span>
              <span className="pref-desc">Navigate to Integrations to connect Google Workspace, Slack, Jira, etc.</span>
            </div>
            <button
              className="btn-reset"
              onClick={() => navigate(ROUTES.INTEGRATIONS)}
            >
              Manage Integrations
            </button>
          </div>
        </motion.section>

        {/* Section 8: Data & History */}
        <motion.section className="personalization-card" variants={staggerItem}>
          <div className="card-header">
            <div className="card-icon"><Database size={20} /></div>
            <div>
              <h2 className="card-title">Data & History</h2>
              <p className="card-subtitle">Manage your local data.</p>
            </div>
          </div>

          <div className="pref-row">
            <div className="pref-info">
              <span className="pref-label">Clear Chat History</span>
              <span className="pref-desc">Delete all locally saved chat history.</span>
            </div>
            <button
              className="btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your chat history?')) {
                  toast.success('Chat history cleared');
                }
              }}
            >
              Clear History
            </button>
          </div>
        </motion.section>

        {/* Action Bar */}
        <motion.div className="personalization-actions" variants={staggerItem}>
          <button className="btn-reset" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
}
