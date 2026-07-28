import { useState, type FormEvent } from 'react';
import { Key, Lock, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { TokenManualInput } from '@/types/integration.types';

interface ManualTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'slack' | 'jira';
  providerLabel: string;
  onSubmitToken: (payload: TokenManualInput) => Promise<void>;
}

export const ManualTokenModal = ({
  isOpen,
  onClose,
  provider,
  providerLabel,
  onSubmitToken,
}: ManualTokenModalProps) => {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitToken({
        provider,
        access_token: accessToken.trim(),
        refresh_token: refreshToken.trim() || undefined,
      });
      setAccessToken('');
      setRefreshToken('');
      onClose();
    } catch (err: any) {
      setError(err?.message || `Failed to save ${providerLabel} token.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${providerLabel} Integration Token`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Enter your encrypted bot or personal API access token for {providerLabel}. Tokens are
          encrypted with AES-256 in DB storage.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error)',
              color: '#fca5a5',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Access Token *"
          type="password"
          placeholder={`Enter ${providerLabel} Access Token (xoxb-... or token)`}
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          required
          icon={<Key size={16} />}
        />

        <Input
          label="Refresh Token (Optional)"
          type="password"
          placeholder="Enter Refresh Token (if applicable)"
          value={refreshToken}
          onChange={(e) => setRefreshToken(e.target.value)}
          icon={<Lock size={16} />}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!accessToken.trim()}>
            Save Encrypted Token
          </Button>
        </div>
      </form>
    </Modal>
  );
};
