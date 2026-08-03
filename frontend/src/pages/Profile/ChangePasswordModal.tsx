import { useState, type FormEvent } from 'react';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(response.detail || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Password Security">
      <form onSubmit={handleSubmit} className="password-form">
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Ensure your account uses a strong, unique password. Changing your password will verify your credentials.
        </p>

        {error && (
          <div className="form-feedback-alert error">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="form-feedback-alert success">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        <Input
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          icon={<Lock size={16} aria-hidden="true" />}
        />

        <Input
          label="New Password (min 8 chars)"
          type="password"
          placeholder="Enter new strong password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          icon={<Lock size={16} aria-hidden="true" />}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          icon={<Lock size={16} aria-hidden="true" />}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
