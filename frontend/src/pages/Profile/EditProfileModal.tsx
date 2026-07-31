import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(user?.full_name || '');
      setAvatarPreview(null);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, user?.full_name]);

  const getInitials = () => {
    if (!fullName.trim()) return 'U';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsLoading(true);
      const updatedUser = await authService.updateProfile({ full_name: fullName.trim() || undefined });
      setUser(updatedUser);

      if (avatarPreview) {
        localStorage.setItem(`avatar_${updatedUser.id}`, avatarPreview);
      } else {
        localStorage.removeItem(`avatar_${updatedUser.id}`);
      }

      setSuccess('Profile updated successfully.');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayAvatar = avatarPreview || (user?.id ? localStorage.getItem(`avatar_${user.id}`) : null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSubmit} className="edit-profile-form">
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

        <div className="edit-profile-avatar-section">
          <div className="edit-profile-avatar-preview">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profile preview" />
            ) : (
              <div className="edit-profile-avatar-placeholder">
                <span className="edit-profile-avatar-initials">{getInitials()}</span>
              </div>
            )}
          </div>
          <div className="edit-profile-avatar-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="edit-profile-file-input"
              aria-label="Upload profile picture"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} aria-hidden="true" />
              Upload Photo
            </Button>
            {displayAvatar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
              >
                <X size={14} aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>
          <p className="edit-profile-avatar-hint">JPG, PNG or GIF. Max size 2MB.</p>
        </div>

        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your full name"
          required
          icon={<Camera size={16} aria-hidden="true" />}
        />

        <div className="edit-profile-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
