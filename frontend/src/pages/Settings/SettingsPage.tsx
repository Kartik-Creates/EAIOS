import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Palette, Bell,
  Shield, Database,
  Plug, HelpCircle, LogOut,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import type { ThemePreference } from '@/context/ThemeContext';
import type { Language } from '@/context/LanguageContext';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';

// TypeScript Definitions
type ResponseStyle = 'concise' | 'balanced' | 'detailed';
type ResponseTone = 'professional' | 'friendly' | 'direct';

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
    theme: ThemePreference;
  };
  language: {
    language: Language;
    dateFormat: string;
    timeFormat: string;
    timezone: string;
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

const getDetectedTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

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
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour',
    timezone: getDetectedTimezone(),
  },
  notifications: {
    dailyBriefing: true,
    meetingSummaries: true,
    workflowApprovals: true,
    taskReminders: true,
    integrationAlerts: true,
    securityAlerts: true,
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
    className="settings-toggle"
    onClick={() => onChange(!checked)}
  >
    <span className="settings-toggle-thumb" />
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
  <div className="settings-segmented-control">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`settings-segment-btn ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'general' | 'personalization' | 'notifications' | 'security' | 'privacy' | 'integrations' | 'about'>('general');

  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem('eaios_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          appearance: {
            ...DEFAULT_PREFERENCES.appearance,
            theme: theme,
          },
          language: {
            ...DEFAULT_PREFERENCES.language,
            language: language,
            ...parsed?.language,
          },
        };
      } catch {
        // ignore fallback
      }
    }
    return {
      ...DEFAULT_PREFERENCES,
      appearance: { theme },
      language: { ...DEFAULT_PREFERENCES.language, language },
    };
  });

  // Keep local state in sync when global theme or language changes
  useEffect(() => {
    setPrefs((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, theme },
      language: { ...prev.language, language },
    }));
  }, [theme, language]);

  const handleSave = () => {
    localStorage.setItem('eaios_preferences', JSON.stringify(prefs));
    toast.success(t('settings.savedSuccess'));
  };

  const handleReset = () => {
    if (window.confirm(t('settings.confirmReset'))) {
      setPrefs(DEFAULT_PREFERENCES);
      setTheme('system');
      setLanguage('en');
      localStorage.setItem('eaios_preferences', JSON.stringify(DEFAULT_PREFERENCES));
      toast.success(t('settings.resetSuccess'));
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

  const handleThemeChange = (newThemeStr: string) => {
    const nextTheme = newThemeStr as ThemePreference;
    updateSection('appearance', 'theme', nextTheme);
    setTheme(nextTheme);
  };

  const handleLanguageChange = (newLangStr: string) => {
    const nextLang = newLangStr as Language;
    updateSection('language', 'language', nextLang);
    setLanguage(nextLang);
  };

  const navItems = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'personalization' as const, label: 'Personalization', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'privacy' as const, label: 'Privacy & Data', icon: Database },
    { id: 'integrations' as const, label: 'Integrations', icon: Plug },
    { id: 'about' as const, label: 'About', icon: HelpCircle },
  ];

  return (
    <div className="settings-page">

      <div className="settings-container">
        {/* Main Application Sidebar - Keep existing */}


        {/* Settings Navigation */}
        <motion.div
          className="settings-nav"
          variants={staggerContainer}
          initial="rest"
          animate="hover"
        >
          <nav>
            <ul className="settings-nav-list">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </ul>
          </nav>
        </motion.div>

        {/* Selected Content */}
        <motion.div
          className="settings-content"
          variants={staggerContainer}
          initial="rest"
          animate="hover"
        >
          {/* General Section */}
          <motion.section
            className={`settings-section ${activeSection === 'general' ? 'active-section' : ''}`}
            variants={staggerItem}
            style={{ display: activeSection === 'general' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <Settings size={24} />
              <span>General</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Language & Region</h3>
                  <p>Configure your language, region, timezone and date format.</p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label>Language</label>
                  <select
                    className="settings-select"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="hi">🇮🇳 हिन्दी</option>
                    <option value="mr">🇮🇳 मराठी</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label>Region</label>
                  <select
                    className="settings-select"
                    value={prefs.language.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="en">🇺🇸 United States</option>
                    <option value="hi">🇮🇳 India</option>
                    <option value="gb">🇬🇧 United Kingdom</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label>Timezone</label>
                  <select
                    className="settings-select"
                    value={prefs.language.timezone}
                    onChange={(e) => updateSection('language', 'timezone', e.target.value)}
                  >
                    <option value={getDetectedTimezone()}>Browser Default ({getDetectedTimezone()})</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label>Date Format</label>
                  <select
                    className="settings-select"
                    value={prefs.language.dateFormat}
                    onChange={(e) => updateSection('language', 'dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-31)</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label>Time Format</label>
                  <select
                    className="settings-select"
                    value={prefs.language.timeFormat}
                    onChange={(e) => updateSection('language', 'timeFormat', e.target.value)}
                  >
                    <option value="12-hour">12-hour (e.g. 2:30 PM)</option>
                    <option value="24-hour">24-hour (e.g. 14:30)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Other Sections - Hidden by default */}
          <motion.section
            className="settings-section"
            variants={staggerItem}
            style={{ display: activeSection === 'personalization' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <Palette size={24} />
              <span>Personalization</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>AI Response Preferences</h3>
                  <p>Configure how AI responds to your queries</p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label>Response Style</label>
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

                <div className="settings-form-group">
                  <label>Response Tone</label>
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

                <div className="settings-form-group">
                  <label>Default Format</label>
                  <select
                    className="settings-select"
                    value={prefs.ai.responseFormat}
                    onChange={(e) => updateSection('ai', 'responseFormat', e.target.value)}
                  >
                    <option value="structured">Structured</option>
                    <option value="plaintext">Plain Text</option>
                    <option value="bulleted">Bulleted</option>
                    <option value="step-by-step">Step-by-step</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label>Explanation Level</label>
                  <select
                    className="settings-select"
                    value={prefs.ai.explanationLevel}
                    onChange={(e) => updateSection('ai', 'explanationLevel', e.target.value)}
                  >
                    <option value="simple">Simple</option>
                    <option value="standard">Standard</option>
                    <option value="detailed">Detailed</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label>Enable Suggestions</label>
                  <Toggle
                    checked={prefs.ai.enableSuggestions}
                    onChange={(val) => updateSection('ai', 'enableSuggestions', val)}
                    ariaLabel="Enable Suggestions"
                  />
                </div>

                <div className="settings-form-group">
                  <label>Use Workspace Context</label>
                  <Toggle
                    checked={prefs.ai.useWorkspaceContext}
                    onChange={(val) => updateSection('ai', 'useWorkspaceContext', val)}
                    ariaLabel="Use Workspace Context"
                  />
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Appearance</h3>
                  <p>Configure theme and appearance preferences</p>
                </div>
              </div>

              <div className="settings-form-group">
                <label>Theme</label>
                <SegmentControl
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                    { label: 'System', value: 'system' }
                  ]}
                  value={theme}
                  onChange={handleThemeChange}
                />
              </div>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section
            className="settings-section"
            variants={staggerItem}
            style={{ display: activeSection === 'notifications' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <Bell size={24} />
              <span>Notifications</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Notification Preferences</h3>
                  <p>Choose which notifications you want to receive</p>
                </div>
              </div>

              <div className="settings-toggles-grid">
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>In-app Notifications</label>
                    <span>Receive notifications in the application</span>
                  </div>
                  <Toggle
                    checked={prefs.notifications.dailyBriefing}
                    onChange={(val) => updateSection('notifications', 'dailyBriefing', val)}
                    ariaLabel="In-app Notifications"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Meeting Summaries</label>
                    <span>Get notified about meeting recordings</span>
                  </div>
                  <Toggle
                    checked={prefs.notifications.meetingSummaries}
                    onChange={(val) => updateSection('notifications', 'meetingSummaries', val)}
                    ariaLabel="Meeting Summaries"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Workflow Approvals</label>
                    <span>Get notified when workflows require approval</span>
                  </div>
                  <Toggle
                    checked={prefs.notifications.workflowApprovals}
                    onChange={(val) => updateSection('notifications', 'workflowApprovals', val)}
                    ariaLabel="Workflow Approvals"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Task Reminders</label>
                    <span>Receive task and deadline reminders</span>
                  </div>
                  <Toggle
                    checked={prefs.notifications.taskReminders}
                    onChange={(val) => updateSection('notifications', 'taskReminders', val)}
                    ariaLabel="Task Reminders"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Integration Alerts</label>
                    <span>Get notified about integration status changes</span>
                  </div>
                  <Toggle
                    checked={prefs.notifications.integrationAlerts}
                    onChange={(val) => updateSection('notifications', 'integrationAlerts', val)}
                    ariaLabel="Integration Alerts"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Security Alerts</label>
                    <span>Receive important security notifications</span>
                  </div>
                  <Toggle
                    checked={prefs.notifications.securityAlerts}
                    onChange={(val) => updateSection('notifications', 'securityAlerts', val)}
                    ariaLabel="Security Alerts"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Security Section */}
          <motion.section
            className="settings-section"
            variants={staggerItem}
            style={{ display: activeSection === 'security' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <Shield size={24} />
              <span>Security</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Account Security</h3>
                  <p>Manage your account security settings</p>
                </div>
              </div>

              <div className="settings-actions-list">
                <button
                  className="settings-action-item"
                  onClick={() => {
                    // Navigate to profile page for password change
                    navigate(ROUTES.PROFILE);
                  }}
                >
                  <div className="settings-action-info">
                    <span>Change Password</span>
                    <p>Last changed 20 days ago</p>
                  </div>
                  <ChevronRight size={20} />
                </button>

                <button
                  className="settings-action-item"
                  onClick={() => toast.success(t('settings.featureComingSoon'))}
                >
                  <div className="settings-action-info">
                    <span>Two-factor Authentication</span>
                    <p>Not enabled</p>
                  </div>
                  <ChevronRight size={20} />
                </button>

                <button
                  className="settings-action-item"
                  onClick={() => toast.success(t('settings.featureComingSoon'))}
                >
                  <div className="settings-action-info">
                    <span>Active Sessions</span>
                    <p>Manage devices and sessions</p>
                  </div>
                  <ChevronRight size={20} />
                </button>

                <button
                  className="settings-action-item"
                  onClick={() => toast.success(t('settings.featureComingSoon'))}
                >
                  <div className="settings-action-info">
                    <span>Login Activity</span>
                    <p>View recent login activity</p>
                  </div>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Session Management</h3>
                  <p>Manage your current session</p>
                </div>
              </div>

              <div className="settings-actions-list">
                <button
                  className="settings-action-item danger-action"
                  onClick={() => {
                    if (window.confirm(t('settings.confirmSignOutAllDevices'))) {
                      logout();
                      toast.success(t('settings.signedOutAllDevices'));
                    }
                  }}
                >
                  <div className="settings-action-info">
                    <span>Sign Out All Devices</span>
                    <p>End all active sessions</p>
                  </div>
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </motion.section>

          {/* Privacy & Data Section */}
          <motion.section
            className="settings-section"
            variants={staggerItem}
            style={{ display: activeSection === 'privacy' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <Database size={24} />
              <span>Privacy & Data</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Data Preferences</h3>
                  <p>Manage your data and privacy settings</p>
                </div>
              </div>

              <div className="settings-toggles-grid">
                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Personalization Data</label>
                    <span>Use your personalization data to improve responses</span>
                  </div>
                  <Toggle
                    checked={prefs.context.usePreferences}
                    onChange={(val) => updateSection('context', 'usePreferences', val)}
                    ariaLabel="Personalization Data"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Conversation Context</label>
                    <span>Remember conversation context across queries</span>
                  </div>
                  <Toggle
                    checked={prefs.context.conversationContext}
                    onChange={(val) => updateSection('context', 'conversationContext', val)}
                    ariaLabel="Conversation Context"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Workspace Context</label>
                    <span>Use workspace data for more relevant responses</span>
                  </div>
                  <Toggle
                    checked={prefs.context.workspaceContext}
                    onChange={(val) => updateSection('context', 'workspaceContext', val)}
                    ariaLabel="Workspace Context"
                  />
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-info">
                    <label>Meeting Context</label>
                    <span>Use meeting data for context-aware responses</span>
                  </div>
                  <Toggle
                    checked={prefs.context.meetingContext}
                    onChange={(val) => updateSection('context', 'meetingContext', val)}
                    ariaLabel="Meeting Context"
                  />
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Data Export</h3>
                  <p>Export your data or delete your account</p>
                </div>
              </div>

              <div className="settings-actions-list">
                <button
                  className="settings-action-item"
                  onClick={() => toast.success(t('settings.featureComingSoon'))}
                >
                  <div className="settings-action-info">
                    <span>Export Data</span>
                    <p>Download all your data in JSON format</p>
                  </div>
                  <ChevronRight size={20} />
                </button>

                <button
                  className="settings-action-item danger-action"
                  onClick={() => {
                    if (window.confirm(t('settings.confirmAccountDeletion'))) {
                      if (window.confirm(t('settings.permanentAccountWarning'))) {
                        toast.success(t('settings.accountDeletionScheduled'));
                        logout();
                      }
                    }
                  }}
                >
                  <div className="settings-action-info">
                    <span>Delete Account</span>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </motion.section>

          {/* Integrations Section */}
          <motion.section
            className="settings-section"
            variants={staggerItem}
            style={{ display: activeSection === 'integrations' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <Plug size={24} />
              <span>Integrations</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Connected Services</h3>
                  <p>Manage your connected integrations</p>
                </div>
              </div>

              <div className="integrations-overview">
                <div className="integration-item">
                  <div className="integration-info">
                    <span>Gmail</span>
                    <Badge variant="green">Connected</Badge>
                  </div>
                  <button
                    className="settings-action-link"
                    onClick={() => navigate(ROUTES.INTEGRATIONS)}
                  >
                    Manage
                  </button>
                </div>

                <div className="integration-item">
                  <div className="integration-info">
                    <span>Slack</span>
                    <Badge variant="green">Connected</Badge>
                  </div>
                  <button
                    className="settings-action-link"
                    onClick={() => navigate(ROUTES.INTEGRATIONS)}
                  >
                    Manage
                  </button>
                </div>

                <div className="integration-item">
                  <div className="integration-info">
                    <span>Google Drive</span>
                    <Badge variant="green">Connected</Badge>
                  </div>
                  <button
                    className="settings-action-link"
                    onClick={() => navigate(ROUTES.INTEGRATIONS)}
                  >
                    Manage
                  </button>
                </div>

                <div className="integration-item">
                  <div className="integration-info">
                    <span>Jira</span>
                    <Badge variant="yellow">Not Connected</Badge>
                  </div>
                  <button
                    className="settings-action-link"
                    onClick={() => navigate(ROUTES.INTEGRATIONS)}
                  >
                    Connect
                  </button>
                </div>
              </div>

              <div className="settings-card-footer">
                <button
                  className="settings-primary-btn"
                  onClick={() => navigate(ROUTES.INTEGRATIONS)}
                >
                  Manage All Integrations
                </button>
              </div>
            </div>
          </motion.section>

          {/* About Section */}
          <motion.section
            className="settings-section"
            variants={staggerItem}
            style={{ display: activeSection === 'about' ? 'block' : 'none' }}
          >
            <h2 className="settings-section-title">
              <HelpCircle size={24} />
              <span>About</span>
            </h2>

            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3>Application Information</h3>
                  <p>Learn more about UnifyAI</p>
                </div>
              </div>

              <div className="about-info">
                <div className="about-item">
                  <span>Application Version</span>
                  <span>1.2.0</span>
                </div>

                <div className="about-item">
                  <span>Build Information</span>
                  <span>2026-09-13</span>
                </div>

                <div className="about-item">
                  <span>Terms of Service</span>
                  <button
                    className="settings-link-btn"
                    onClick={() => navigate(ROUTES.TERMS)}
                  >
                    View Terms
                  </button>
                </div>

                <div className="about-item">
                  <span>Privacy Policy</span>
                  <button
                    className="settings-link-btn"
                    onClick={() => navigate(ROUTES.PRIVACY)}
                  >
                    View Privacy Policy
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Action Bar */}
          <motion.div
            className="settings-actions-bar"
            variants={staggerItem}
          >
            <Button
              variant="ghost"
              onClick={handleReset}
              className="settings-reset-btn"
            >
              Reset to Defaults
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="settings-save-btn"
            >
              Save Changes
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}