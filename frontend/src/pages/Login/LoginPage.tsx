import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Cpu, Search, MessageSquare, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import './LoginPage.css';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
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

  return (
    <div className="auth-page">
      {/* ── Left Branding Panel ── */}
      <aside className="auth-branding" aria-hidden="true">
        <div className="auth-logo">
          <div className="auth-logo-badge">EA</div>
          <span className="auth-logo-name">EAIOS</span>
        </div>
        <h2 className="auth-branding-headline">
          Your Enterprise<br />
          <span>AI Operating System</span>
        </h2>
        <p className="auth-branding-sub">
          Unified RAG knowledge search, agentic workflows, and intelligent
          automation — all in one secure, governance-driven platform.
        </p>
        <div className="auth-features">
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><Search size={16} /></div>
            Semantic search across all enterprise knowledge bases
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><MessageSquare size={16} /></div>
            AI-powered RAG chatbot with source citations
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><Cpu size={16} /></div>
            Integrate Google Drive, GitHub, Slack, and Jira
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon"><ShieldCheck size={16} /></div>
            Role-based access control and audit trails
          </div>
        </div>
      </aside>

      {/* ── Right Form Panel ── */}
      <main className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h1>Sign in to EAIOS</h1>
            <p>Enter your credentials to access the platform.</p>
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
              icon={<Mail size={16} />}
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
              icon={<Lock size={16} />}
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
      </main>
    </div>
  );
}
