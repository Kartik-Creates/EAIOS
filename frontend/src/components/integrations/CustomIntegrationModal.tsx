import { useState, useRef, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  ChevronDown,
  TestTube,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import './CustomIntegrationModal.css';

interface ServiceOption {
  id: string;
  label: string;
  category: 'oauth' | 'api' | 'token' | 'custom';
}

interface FormData {
  name: string;
  serviceUrl: string;
  authType: 'oauth2' | 'api_key' | 'bearer' | 'webhook' | 'basic';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiKey: string;
  baseUrl: string;
  personalAccessToken: string;
  webhookUrl: string;
  username: string;
  password: string;
  description: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [

  { id: 'notion', label: 'Notion', category: 'oauth' },
  { id: 'confluence', label: 'Confluence', category: 'oauth' },
  { id: 'microsoft-teams', label: 'Microsoft Teams', category: 'oauth' },
  { id: 'microsoft-sharepoint', label: 'Microsoft SharePoint', category: 'oauth' },
  { id: 'onedrive', label: 'OneDrive', category: 'oauth' },
  { id: 'dropbox', label: 'Dropbox', category: 'oauth' },
  { id: 'gitlab', label: 'GitLab', category: 'oauth' },
  { id: 'bitbucket', label: 'Bitbucket', category: 'oauth' },
  { id: 'linear', label: 'Linear', category: 'api' },
  { id: 'asana', label: 'Asana', category: 'api' },
  { id: 'trello', label: 'Trello', category: 'api' },
  { id: 'clickup', label: 'ClickUp', category: 'api' },
  { id: 'salesforce', label: 'Salesforce', category: 'api' },
  { id: 'hubspot', label: 'HubSpot', category: 'api' },
  { id: 'zendesk', label: 'Zendesk', category: 'api' },
  { id: 'discord', label: 'Discord', category: 'oauth' },
  { id: 'custom', label: 'Custom', category: 'custom' },
];

const CATEGORY_LABELS: Record<string, string> = {
  oauth: 'OAuth Services',
  api: 'API Services',
  token: 'Token Services',
  custom: 'Other',
};

interface CustomIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: Record<string, unknown>) => void;
}

export const CustomIntegrationModal = ({ isOpen, onClose, onSave }: CustomIntegrationModalProps) => {
  const [step, setStep] = useState<'service' | 'form'>('service');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    serviceUrl: '',
    authType: 'oauth2',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    apiKey: '',
    baseUrl: '',
    personalAccessToken: '',
    webhookUrl: '',
    username: '',
    password: '',
    description: '',
  });
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('service');
      setSearchQuery('');
      setSelectedService(null);
      setTestResult(null);
      setFormData({
        name: '',
        serviceUrl: '',
        authType: 'oauth2',
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        apiKey: '',
        baseUrl: '',
        personalAccessToken: '',
        webhookUrl: '',
        username: '',
        password: '',
        description: '',
      });
      setIconPreview(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredServices = SERVICE_OPTIONS.filter((service) =>
    service.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedServices = filteredServices.reduce<Record<string, ServiceOption[]>>((acc, service) => {
    const category = CATEGORY_LABELS[service.category] || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  const handleServiceSelect = (service: ServiceOption) => {
    setSelectedService(service);
    if (service.category === 'custom') {
      setFormData((prev) => ({ ...prev, name: '', serviceUrl: '', authType: 'oauth2' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: service.label,
        serviceUrl: '',
        authType: service.category === 'oauth' ? 'oauth2' : service.category === 'api' ? 'api_key' : 'bearer',
      }));
    }
    setStep('form');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const success = Math.random() > 0.3;
    setTestResult(success ? 'success' : 'error');
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    onSave?.({ ...formData, service: selectedService?.label });
    setIsSubmitting(false);
    onClose();
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const renderServiceSearch = () => (
    <div className="custom-integration-step">
      <div className="custom-integration-step-header">
        <h3 className="custom-integration-step-title">Choose Service</h3>
        <p className="custom-integration-step-desc">
          Select the service you want to integrate with, or choose Custom for a manual setup.
        </p>
      </div>

      <div className="custom-integration-search" ref={dropdownRef}>
        <Search size={16} className="custom-integration-search-icon" />
        <input
          type="text"
          className="custom-integration-search-input"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            className="custom-integration-search-clear"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="custom-integration-service-list">
        {Object.entries(groupedServices).map(([category, services]) => (
          <div key={category} className="custom-integration-service-group">
            <div className="custom-integration-service-group-label">{category}</div>
            <div className="custom-integration-service-options">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={cn(
                    'custom-integration-service-option',
                    selectedService?.id === service.id && 'custom-integration-service-option-selected'
                  )}
                  onClick={() => handleServiceSelect(service)}
                >
                  <span className="custom-integration-service-option-label">{service.label}</span>
                  {service.category === 'custom' && (
                    <span className="custom-integration-service-option-badge">Custom</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderForm = () => {
    const isCustom = selectedService?.category === 'custom';
    const isOAuth = selectedService?.category === 'oauth';
    const isApi = selectedService?.category === 'api';

    return (
      <div className="custom-integration-step">
        <div className="custom-integration-step-header">
          <button
            type="button"
            className="custom-integration-back-btn"
            onClick={() => {
              setStep('service');
              setSelectedService(null);
              setTestResult(null);
            }}
          >
            ← Back
          </button>
          <h3 className="custom-integration-step-title">
            {isCustom ? 'Custom Integration' : selectedService?.label}
          </h3>
          <p className="custom-integration-step-desc">
            {isCustom
              ? 'Configure your custom integration details below.'
              : `Connect to ${selectedService?.label} using the required credentials.`}
          </p>
        </div>

        <div className="custom-integration-form">
          {isCustom && (
            <>
              <Input
                label="Integration Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Integration"
                required
              />
              <Input
                label="Service URL *"
                value={formData.serviceUrl}
                onChange={(e) => setFormData({ ...formData, serviceUrl: e.target.value })}
                placeholder="https://api.example.com"
                required
              />
              <div className="custom-integration-form-group">
                <label className="custom-integration-label">Authentication Type</label>
                <div className="custom-integration-select-wrapper">
                  <select
                    className="custom-integration-select"
                    value={formData.authType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        authType: e.target.value as FormData['authType'],
                      })
                    }
                  >
                    <option value="oauth2">OAuth 2.0</option>
                    <option value="api_key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="webhook">Webhook</option>
                    <option value="basic">Basic Authentication</option>
                  </select>
                  <ChevronDown size={16} className="custom-integration-select-icon" />
                </div>
              </div>
            </>
          )}

          {isOAuth && (
            <>
              <Input
                label="Client ID *"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Enter client ID"
                required
              />
              <Input
                label="Client Secret *"
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                placeholder="Enter client secret"
                required
              />
              <Input
                label="Redirect URI *"
                value={formData.redirectUri}
                onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                placeholder="https://your-app.com/callback"
                required
              />
            </>
          )}

          {isApi && (
            <>
              <Input
                label="API Key *"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter API key"
                required
              />
              <Input
                label="Base URL *"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.example.com"
                required
              />
            </>
          )}

          {!isCustom && formData.authType === 'bearer' && (
            <Input
              label="Personal Access Token *"
              type="password"
              value={formData.personalAccessToken}
              onChange={(e) => setFormData({ ...formData, personalAccessToken: e.target.value })}
              placeholder="Enter personal access token"
              required
            />
          )}

          {isCustom && formData.authType === 'webhook' && (
            <Input
              label="Webhook URL *"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              placeholder="https://your-app.com/webhook"
              required
            />
          )}

          {isCustom && formData.authType === 'basic' && (
            <>
              <Input
                label="Username *"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
              />
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </>
          )}

          {isCustom && (
            <div className="custom-integration-form-group">
              <label className="custom-integration-label">Description (optional)</label>
              <textarea
                className="custom-integration-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this integration..."
                rows={3}
              />
            </div>
          )}

          {isCustom && (
            <div className="custom-integration-form-group">
              <label className="custom-integration-label">Upload Icon (optional)</label>
              <div className="custom-integration-icon-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="custom-integration-file-input"
                />
                <div className="custom-integration-icon-preview">
                  {iconPreview ? (
                    <img src={iconPreview} alt="Icon preview" />
                  ) : (
                    <div className="custom-integration-icon-placeholder">
                      <Upload size={20} />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {iconPreview ? 'Change Icon' : 'Upload Icon'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="custom-integration-test-result">
          {testResult === 'success' && (
            <div className="custom-integration-test-success">
              <CheckCircle2 size={16} />
              <span>Connection Successful</span>
            </div>
          )}
          {testResult === 'error' && (
            <div className="custom-integration-test-error">
              <AlertCircle size={16} />
              <span>Connection Failed</span>
            </div>
          )}
        </div>

        <div className="custom-integration-form-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || isTesting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isSubmitting || isTesting}
            isLoading={isTesting}
          >
            <TestTube size={14} />
            Test Connection
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSubmitting || isTesting}
            isLoading={isSubmitting}
          >
            Save Integration
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Integration" className="custom-integration-modal">
      {step === 'service' && renderServiceSearch()}
      {step === 'form' && renderForm()}
    </Modal>
  );
};
