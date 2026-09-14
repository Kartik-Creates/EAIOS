import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings, User, Paintbrush, Globe,
    Bell, Box, MessageSquare, Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import type { ThemePreference } from '@/context/ThemeContext';
import type { Language } from '@/context/LanguageContext';
import { staggerContainer, staggerItem } from '@/lib/motion';
import { ROUTES } from '@/constants/routes';
import './personalization.css';

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
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

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
        toast.success(t('personalization.savedSuccess'));
    };

    const handleReset = () => {
        if (window.confirm(t('personalization.confirmReset'))) {
            setPrefs(DEFAULT_PREFERENCES);
            setTheme('system');
            setLanguage('en');
            localStorage.setItem('eaios_preferences', JSON.stringify(DEFAULT_PREFERENCES));
            toast.success(t('personalization.resetSuccess'));
        }
    };

    const updateSection = <K extends keyof UserPreferences>(
        section: K,
        key: keyof UserPreferences[K],
        value: UserPreferences[K][typeof key]
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

    return (
        <div className="personalization-page">
            <motion.div
                className="personalization-header"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="personalization-title">{t('personalization.title')}</h1>
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
                            <h2 className="card-title">{t('personalization.aiPrefs')}</h2>
                            <p className="card-subtitle">{t('personalization.aiPrefsDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.responseStyle')}</span>
                            <span className="pref-desc">{t('personalization.responseStyleDesc')}</span>
                        </div>
                        <SegmentControl
                            options={[
                                { label: t('personalization.responseStyleConcise'), value: 'concise' },
                                { label: t('personalization.responseStyleBalanced'), value: 'balanced' },
                                { label: t('personalization.responseStyleDetailed'), value: 'detailed' }
                            ]}
                            value={prefs.ai.responseStyle}
                            onChange={(val) => updateSection('ai', 'responseStyle', val as ResponseStyle)}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.responseTone')}</span>
                            <span className="pref-desc">{t('personalization.responseToneDesc')}</span>
                        </div>
                        <SegmentControl
                            options={[
                                { label: t('personalization.responseToneProfessional'), value: 'professional' },
                                { label: t('personalization.responseToneFriendly'), value: 'friendly' },
                                { label: t('personalization.responseToneDirect'), value: 'direct' }
                            ]}
                            value={prefs.ai.responseTone}
                            onChange={(val) => updateSection('ai', 'responseTone', val as ResponseTone)}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.defaultFormat')}</span>
                        </div>
                        <select
                            className="pref-select"
                            value={prefs.ai.responseFormat}
                            onChange={(e) => updateSection('ai', 'responseFormat', e.target.value)}
                            aria-label={t('personalization.defaultFormat')}
                        >
                            <option value="structured">{t('personalization.formatStructured')}</option>
                            <option value="plaintext">Plain Text</option>
                            <option value="bulleted">Bulleted</option>
                            <option value="step-by-step">Step-by-step</option>
                        </select>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.enableSuggestions')}</span>
                            <span className="pref-desc">{t('personalization.enableSuggestionsDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.ai.enableSuggestions}
                            onChange={(val) => updateSection('ai', 'enableSuggestions', val)}
                            ariaLabel={t('personalization.enableSuggestions')}
                        />
                    </div>
                </motion.section>

                {/* Section 2: Appearance */}
                <motion.section className="personalization-card" variants={staggerItem}>
                    <div className="card-header">
                        <div className="card-icon"><Paintbrush size={20} /></div>
                        <div>
                            <h2 className="card-title">{t('personalization.appearance')}</h2>
                            <p className="card-subtitle">{t('personalization.appearanceDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.theme')}</span>
                            <span className="pref-desc">{t('personalization.themeDesc')}</span>
                        </div>
                        <SegmentControl
                            options={[
                                { label: t('personalization.themeLight'), value: 'light' },
                                { label: t('personalization.themeDark'), value: 'dark' },
                                { label: t('personalization.themeSystem'), value: 'system' },
                            ]}
                            value={theme}
                            onChange={handleThemeChange}
                        />
                    </div>


                </motion.section>

                {/* Section 3: Language & Region */}
                <motion.section className="personalization-card" variants={staggerItem}>
                    <div className="card-header">
                        <div className="card-icon"><Globe size={20} /></div>
                        <div>
                            <h2 className="card-title">{t('personalization.languageRegion')}</h2>
                            <p className="card-subtitle">{t('personalization.languageRegionDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.language')}</span>
                        </div>
                        <select
                            className="pref-select"
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            aria-label={t('personalization.language')}
                        >
                            <option value="en">🇬🇧 English</option>
                            <option value="hi">🇮🇳 हिन्दी</option>
                            <option value="mr">🇮🇳 मराठी</option>
                        </select>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.dateFormat')}</span>
                        </div>
                        <select
                            className="pref-select"
                            value={prefs.language.dateFormat}
                            onChange={(e) => updateSection('language', 'dateFormat', e.target.value)}
                            aria-label={t('personalization.dateFormat')}
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 31/12/2026)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 12/31/2026)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-12-31)</option>
                        </select>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.timeFormat')}</span>
                        </div>
                        <select
                            className="pref-select"
                            value={prefs.language.timeFormat}
                            onChange={(e) => updateSection('language', 'timeFormat', e.target.value)}
                            aria-label={t('personalization.timeFormat')}
                        >
                            <option value="12-hour">12-hour (e.g. 2:30 PM)</option>
                            <option value="24-hour">24-hour (e.g. 14:30)</option>
                        </select>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.timezone')}</span>
                        </div>
                        <select
                            className="pref-select"
                            value={prefs.language.timezone}
                            onChange={(e) => updateSection('language', 'timezone', e.target.value)}
                            aria-label={t('personalization.timezone')}
                        >
                            <option value={getDetectedTimezone()}>Browser Default ({getDetectedTimezone()})</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                            <option value="UTC">UTC (Coordinated Universal Time)</option>
                            <option value="America/New_York">America/New_York (EST/EDT)</option>
                            <option value="Europe/London">Europe/London (GMT/BST)</option>
                        </select>
                    </div>
                </motion.section>

                {/* Section 4: Notifications */}
                <motion.section className="personalization-card" variants={staggerItem}>
                    <div className="card-header">
                        <div className="card-icon"><Bell size={20} /></div>
                        <div>
                            <h2 className="card-title">{t('personalization.notifications')}</h2>
                            <p className="card-subtitle">{t('personalization.notificationsDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.dailyBriefing')}</span>
                            <span className="pref-desc">{t('personalization.dailyBriefingDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.notifications.dailyBriefing}
                            onChange={(val) => updateSection('notifications', 'dailyBriefing', val)}
                            ariaLabel={t('personalization.dailyBriefing')}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.meetingSummaries')}</span>
                            <span className="pref-desc">{t('personalization.meetingSummariesDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.notifications.meetingSummaries}
                            onChange={(val) => updateSection('notifications', 'meetingSummaries', val)}
                            ariaLabel={t('personalization.meetingSummaries')}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.securityAlerts')}</span>
                            <span className="pref-desc">{t('personalization.securityAlertsDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.notifications.securityAlerts}
                            onChange={() => toast(t('personalization.securityAlertMsg'), { icon: '🛡️' })}
                            ariaLabel={t('personalization.securityAlerts')}
                        />
                    </div>
                </motion.section>

                {/* Section 5: Personal Context */}
                <motion.section className="personalization-card" variants={staggerItem}>
                    <div className="card-header">
                        <div className="card-icon"><User size={20} /></div>
                        <div>
                            <h2 className="card-title">{t('personalization.personalContext')}</h2>
                            <p className="card-subtitle">{t('personalization.personalContextDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.useMyPrefs')}</span>
                            <span className="pref-desc">{t('personalization.useMyPrefsDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.context.usePreferences}
                            onChange={(val) => updateSection('context', 'usePreferences', val)}
                            ariaLabel={t('personalization.useMyPrefs')}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.rememberContext')}</span>
                            <span className="pref-desc">{t('personalization.rememberContextDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.context.conversationContext}
                            onChange={(val) => updateSection('context', 'conversationContext', val)}
                            ariaLabel={t('personalization.rememberContext')}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.useWorkspaceContext')}</span>
                            <span className="pref-desc">{t('personalization.useWorkspaceContextDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.context.workspaceContext}
                            onChange={(val) => updateSection('context', 'workspaceContext', val)}
                            ariaLabel={t('personalization.useWorkspaceContext')}
                        />
                    </div>
                </motion.section>

                {/* Section 6: Chat Preferences */}
                <motion.section className="personalization-card" variants={staggerItem}>
                    <div className="card-header">
                        <div className="card-icon"><MessageSquare size={20} /></div>
                        <div>
                            <h2 className="card-title">{t('personalization.chatPrefs')}</h2>
                            <p className="card-subtitle">{t('personalization.chatPrefsDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.enterToSend')}</span>
                            <span className="pref-desc">{t('personalization.enterToSendDesc')}</span>
                        </div>
                        <Toggle
                            checked={prefs.chat.enterToSend}
                            onChange={(val) => updateSection('chat', 'enterToSend', val)}
                            ariaLabel={t('personalization.enterToSend')}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.showTimestamps')}</span>
                        </div>
                        <Toggle
                            checked={prefs.chat.showTimestamps}
                            onChange={(val) => updateSection('chat', 'showTimestamps', val)}
                            ariaLabel={t('personalization.showTimestamps')}
                        />
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.saveChatHistory')}</span>
                        </div>
                        <Toggle
                            checked={prefs.chat.saveHistory}
                            onChange={(val) => updateSection('chat', 'saveHistory', val)}
                            ariaLabel={t('personalization.saveChatHistory')}
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
                            <h2 className="card-title">{t('personalization.integrationOptions')}</h2>
                            <p className="card-subtitle">{t('personalization.integrationOptionsDesc')}</p>
                        </div>
                    </div>

                    <div className="integration-item">
                        <div className="integration-icon">
                            <Box size={20} />
                        </div>
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.noConnections')}</span>
                            <span className="pref-desc">{t('personalization.noConnectionsDesc')}</span>
                        </div>
                        <button
                            className="btn-reset"
                            onClick={() => navigate(ROUTES.INTEGRATIONS)}
                        >
                            {t('personalization.manageIntegrations')}
                        </button>
                    </div>
                </motion.section>

                {/* Section 8: Data & History */}
                <motion.section className="personalization-card" variants={staggerItem}>
                    <div className="card-header">
                        <div className="card-icon"><Database size={20} /></div>
                        <div>
                            <h2 className="card-title">{t('personalization.dataHistory')}</h2>
                            <p className="card-subtitle">{t('personalization.dataHistoryDesc')}</p>
                        </div>
                    </div>

                    <div className="pref-row">
                        <div className="pref-info">
                            <span className="pref-label">{t('personalization.clearHistory')}</span>
                            <span className="pref-desc">{t('personalization.clearHistoryDesc')}</span>
                        </div>
                        <button
                            className="btn-danger"
                            onClick={() => {
                                if (window.confirm(t('personalization.confirmClear'))) {
                                    toast.success(t('personalization.clearedSuccess'));
                                }
                            }}
                        >
                            {t('personalization.clearHistoryBtn')}
                        </button>
                    </div>
                </motion.section>

                {/* Action Bar */}
                <motion.div className="personalization-actions" variants={staggerItem}>
                    <button className="btn-reset" onClick={handleReset}>
                        {t('personalization.resetDefaults')}
                    </button>
                    <button className="btn-save" onClick={handleSave}>
                        {t('personalization.saveChanges')}
                    </button>
                </motion.div>

            </motion.div>
        </div>
    );
}