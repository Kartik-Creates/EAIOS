import { useState, type FormEvent, useEffect } from 'react';
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
