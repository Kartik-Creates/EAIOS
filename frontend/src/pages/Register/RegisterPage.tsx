import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

import { authService } from '@/services/authService';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AnimatedShaderBackground from '@/components/background/AnimatedShaderBackground';
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
      <AnimatedShaderBackground />

      <div className="auth-form-card">
        <div className="auth-logo">
          <div className="auth-logo-badge">EA</div>
          <span className="auth-logo-text">EAIOS</span>
        </div>

        <div className="auth-form-header">
          <h1>Create your account</h1>
          <p>Join EAIOS to start managing enterprise knowledge with AI.</p>
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
    </div>
  );
}
