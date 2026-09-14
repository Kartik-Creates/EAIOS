import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Ferrofluid from '@/components/ui/Ferrofluid';

import { authService } from '@/services/authService';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppLogo } from '@/components/common/AppLogo';
import { fadeInUpVariants, staggerContainer, staggerItem } from '@/lib/motion';
import './RegisterPage.css';

interface RegisterFormState {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const validateForm = (values: RegisterFormState): RegisterFormErrors => {
  const errors: RegisterFormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = 'Full name is required.';
  }

  if (!values.email) {
    errors.email = 'Email is required.';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="google-icon">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [formValues, setFormValues] = useState<RegisterFormState>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});

  const handleGoogleSignUp = () => {
    setIsGoogleLoading(true);
    window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof RegisterFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        full_name: formValues.full_name.trim(),
        email: formValues.email,
        password: formValues.password,
      });
      toast.success('Account created! Please sign in.');
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-canvas">
        <Ferrofluid
          colors={['#ffffff', '#ffffff', '#ffffff']}
          speed={0.3}
          scale={1.6}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={2.5}
          shimmer={1.5}
          glow={2}
          flowDirection="down"
          opacity={1}
          mouseInteraction
          mouseStrength={1}
          mouseRadius={0.35}
        />
      </div>

      <motion.div className="auth-form-card" variants={fadeInUpVariants} initial="hidden" animate="visible">
        <motion.div className="auth-logo" variants={staggerItem}>
          <AppLogo className="app-logo-vertical app-logo-large" />
        </motion.div>

        <motion.div className="auth-form-header" variants={staggerItem}>
          <h1>Create your account</h1>
          <p>Join UnifyAI to start managing enterprise knowledge with AI.</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
          >
            <GoogleIcon size={20} />
            <span>{isGoogleLoading ? 'Connecting…' : 'Sign up with Google'}</span>
          </button>
        </motion.div>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <motion.div variants={staggerContainer}>
            <motion.div variants={staggerItem}>
              <Input
                id="register-fullname"
                name="full_name"
                type="text"
                label="Full name"
                placeholder="Jane Smith"
                autoComplete="name"
                value={formValues.full_name}
                onChange={handleChange}
                error={formErrors.full_name}
                icon={<User size={16} />}
                disabled={isLoading}
                required
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <Input
                id="register-email"
                name="email"
                type="email"
                label="Work email"
                placeholder="you@company.com"
                autoComplete="email"
                value={formValues.email}
                onChange={handleChange}
                error={formErrors.email}
                icon={<Mail size={16} />}
                disabled={isLoading}
                required
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <Input
                id="register-password"
                name="password"
                type="password"
                label="Password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={formValues.password}
                onChange={handleChange}
                error={formErrors.password}
                icon={<Lock size={16} />}
                disabled={isLoading}
                required
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                label="Confirm password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                icon={<Lock size={16} />}
                disabled={isLoading}
                required
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <Button
                id="register-submit"
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="auth-btn-full"
              >
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Button>
            </motion.div>
          </motion.div>
        </form>

        <p className="auth-form-footer">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
