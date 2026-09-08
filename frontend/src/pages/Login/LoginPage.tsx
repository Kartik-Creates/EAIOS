import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { storage } from '@/utils/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoLoop, type LogoItem } from '@/components/ui/LogoLoop';
import Ferrofluid from '@/components/ui/Ferrofluid';
import { RotatingText } from '@/components/ui/RotatingText';
import {
  SlackIcon,
  GitHubIcon,
  JiraIcon,
  NotionIcon,
  ConfluenceIcon,
  GmailIcon,
  GitLabIcon,
  DiscordIcon,
} from '@/components/integrations/IntegrationIcon';
import './LoginPage.css';

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
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

const integrationLogos: LogoItem[] = [
  { node: <SlackIcon size={22} />, title: 'Slack' },
  { node: <GitHubIcon size={22} />, title: 'GitHub' },
  { node: <JiraIcon size={22} />, title: 'Jira' },
  { node: <NotionIcon size={22} />, title: 'Notion' },
  { node: <ConfluenceIcon size={22} />, title: 'Confluence' },
  { node: <GmailIcon size={22} />, title: 'Gmail' },
  { node: <GitLabIcon size={22} />, title: 'GitLab' },
  { node: <DiscordIcon size={22} />, title: 'Discord' },
];

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
  const [searchParams] = useSearchParams();
  const { login, verifySession, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [formValues, setFormValues] = useState<LoginFormState>({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});

  // Check for OAuth callback parameters in the URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token') || searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      toast.error(`Google Sign-In failed: ${decodeURIComponent(errorParam.replace(/\+/g, ' '))}`);
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (accessToken && refreshToken) {
      storage.setAccessToken(accessToken);
      storage.setRefreshToken(refreshToken);
      verifySession().then(() => {
        toast.success('Welcome back!');
        navigate(ROUTES.DASHBOARD, { replace: true });
      });
    }
  }, [searchParams, verifySession, navigate]);

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

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`;
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

        <div className="auth-form-card">
          {/* Google OAuth Login Button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            <GoogleIcon size={20} />
            <span>{isGoogleLoading ? 'Connecting…' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>or sign in with email</span>
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
              disabled={isLoading || isGoogleLoading}
              required
            />

            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={formValues.password}
              onChange={handleChange}
              error={formErrors.password}
              icon={<Lock size={18} />}
              disabled={isLoading || isGoogleLoading}
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading || isGoogleLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Button
              id="login-submit"
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isGoogleLoading}
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
