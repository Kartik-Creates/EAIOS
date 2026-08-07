import { useState, type FormEvent, useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppLogo } from '@/components/common/AppLogo';
import { fadeInUpVariants, staggerContainer, staggerItem } from '@/lib/motion';
import './LoginPage.css';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

interface LoginFormState {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

interface LogoItem {
  node: ReactNode;
  title: string;
}

const _integrationLogos: LogoItem[] = [
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#FAFAFA">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    title: 'GitHub',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335" />
      </svg>
    ),
    title: 'Gmail',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M7.71 3.5L1.15 15L4.58 21L11.14 9.5L7.71 3.5Z" fill="#FFC107" />
        <path d="M16.29 3.5H7.71L11.14 9.5H19.72L16.29 3.5Z" fill="#00E676" />
        <path d="M14.86 15H4.58L1.15 21H21.43L22.85 18.5L14.86 15Z" fill="#2979FF" />
      </svg>
    ),
    title: 'Google Drive',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#0052CC">
        <path d="M11.53 2c0 2.4-1.97 4.35-4.38 4.35H3.59V2h7.94zm0 6.55c0 2.4-1.97 4.35-4.38 4.35H3.59V8.55h7.94zm8.88 0c0 2.4-1.97 4.35-4.38 4.35h-3.56V8.55h7.94zM11.53 15.1c0 2.4-1.97 4.35-4.38 4.35H3.59v-4.35h7.94zm8.88 0c0 2.4-1.97 4.35-4.38 4.35h-3.56v-4.35h7.94z" />
      </svg>
    ),
    title: 'Jira',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#E01E5A" />
        <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.527 2.527 0 012.521 2.521 2.527 2.527 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36C5F0" />
        <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.527 2.527 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312z" fill="#2EB67D" />
        <path d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.313A2.528 2.528 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" fill="#ECB22E" />
      </svg>
    ),
    title: 'Slack',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M19.5 7.5A2.5 2.5 0 1 0 17 5a2.5 2.5 0 0 0 2.5 2.5zm1.5 1.5h-3a2 2 0 0 0-2 2v4a.5.5 0 0 0 .5.5H22a.5.5 0 0 0 .5-.5v-4a2 2 0 0 0-1.5-2z" fill="#6264A7" />
        <path d="M11.5 6A3.5 3.5 0 1 0 8 2.5 3.5 3.5 0 0 0 11.5 6zm2.5 2H6.5A2.5 2.5 0 0 0 4 10.5v8A1.5 1.5 0 0 0 5.5 20h12a1.5 1.5 0 0 0 1.5-1.5v-8A2.5 2.5 0 0 0 16.5 8z" fill="#4B53BC" />
      </svg>
    ),
    title: 'Microsoft Teams',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#FC6D26">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51a.42.42 0 01.79 0l2.43 7.48h8.14l2.43-7.48a.42.42 0 01.79 0l2.44 7.51 1.22 3.78a.84.84 0 01-.3.94z" />
      </svg>
    ),
    title: 'GitLab',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="#4285F4" />
        <path d="M7 11h5v5H7z" fill="#34A853" />
      </svg>
    ),
    title: 'Calendar',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#00897B" />
      </svg>
    ),
    title: 'Meet',
  },
  {
    node: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M1 17.5l9 3.5V3L1 6.5v11z" fill="#0078D4" />
        <path d="M10 5l13-2v18l-13-2V5z" fill="#0078D4" opacity="0.85" />
        <circle cx="5.5" cy="12" r="2.5" fill="#FFF" />
      </svg>
    ),
    title: 'Outlook',
  },
];

const validateForm = (values: LoginFormState): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  if (!values.email) {
    errors.email = 'Email is required.';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [formValues, setFormValues] = useState<LoginFormState>({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});

  useEffect(() => {
    if (BYPASS_AUTH) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof LoginFormErrors]) {
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

    try {
      await login({ username: formValues.email, password: formValues.password });
      toast.success('Welcome back!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Incorrect email or password.';
      toast.error(message);
    }
  };

  if (BYPASS_AUTH) {
    return null;
  }

  return (
    <div className="auth-page">
      <motion.div className="auth-form-card" variants={fadeInUpVariants} initial="hidden" animate="visible">
        <motion.div className="auth-logo" variants={staggerItem}>
          <AppLogo className="app-logo-vertical app-logo-large" />
        </motion.div>

            <motion.div className="auth-form-header" variants={staggerItem}>
              <h1>Welcome Back</h1>
              <p>Sign in to continue to your workspace.</p>
            </motion.div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <motion.div variants={staggerContainer}>
                <motion.div variants={staggerItem}>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    label="Email address"
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
                    id="login-password"
                    name="password"
                    type="password"
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={formValues.password}
                    onChange={handleChange}
                    error={formErrors.password}
                    icon={<Lock size={16} />}
                    disabled={isLoading}
                    required
                  />
                </motion.div>

                <motion.div variants={staggerItem}>
                  <Button
                    id="login-submit"
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    className="auth-btn-full"
                  >
                    {isLoading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </motion.div>
              </motion.div>
            </form>

            <p className="auth-form-footer">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER}>Create one</Link>
            </p>
      </motion.div>
    </div>
  );
}
