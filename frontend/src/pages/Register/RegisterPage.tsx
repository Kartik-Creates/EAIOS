import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Cpu, Search, MessageSquare, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { authService } from '@/services/authService';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formValues, setFormValues] = useState<RegisterFormState>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<RegisterFormErrors>({});

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
      {/* ── Left Branding Panel ── */}
      <aside className="auth-branding" aria-hidden="true">
        <div className="auth-logo">
          <div className="auth-logo-badge">EA</div>
          <span className="auth-logo-name">EAIOS</span>
        </div>
        <h2 className="auth-branding-headline">
          Join the Enterprise<br />
          <span>AI Revolution</span>
        </h2>
        <p className="auth-branding-sub">
          Create your account and gain access to the most powerful
          enterprise knowledge platform — built for teams who demand
          precision, speed, and security.
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
            <h1>Create your account</h1>
            <p>Get started with EAIOS in seconds.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
          </form>

          <p className="auth-form-footer">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
