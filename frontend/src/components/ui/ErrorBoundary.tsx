import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const stack = this.state.error?.stack || '';

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px' }}>⚠️</div>
          <h2 style={{ color: 'var(--text-primary, #f1f5f9)', margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', maxWidth: '480px', margin: 0 }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          {stack && (
            <pre style={{
              maxWidth: '700px',
              maxHeight: '200px',
              overflow: 'auto',
              fontSize: '11px',
              textAlign: 'left',
              background: 'rgba(0,0,0,0.3)',
              color: '#f87171',
              padding: '12px',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {stack}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary, #6366f1)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
