import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UnifyLogo } from '@/components/common/UnifyLogo';
import { LogoLoop, type LogoItem } from '@/components/ui/LogoLoop';
import Ferrofluid from '@/components/ui/Ferrofluid';
import { RotatingText } from '@/components/ui/RotatingText';
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

      <div className="auth-container">
        {/* Left Column: Product Branding */}
        <div className="auth-branding-section">
          <h1 className="auth-brand-title">Unify<span className="auth-brand-accent">AI</span></h1>
          <p className="auth-brand-subtitle">Your AI Workspace</p>
          <RotatingText />
        </div>


            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                icon={<Mail size={18} />}
                disabled={isLoading}
                required
              />

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
                icon={<Lock size={18} />}
                disabled={isLoading}
                required
              />

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
            </form>

            <p className="auth-form-footer">
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER}>Create one</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Integrations Logo Loop (Positioned 36px above bottom) */}
      <div className="auth-bottom-logo-loop">
        <LogoLoop
          logos={integrationLogos}
          speed={80}
          direction="left"
          logoHeight={26}
          gap={48}
          scaleOnHover
          fadeOut
          fadeOutColor="#03010A"
          ariaLabel="Supported workspace integrations"
        />
      </div>
    </div>
  );
}
