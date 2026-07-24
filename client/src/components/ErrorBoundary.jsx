import { Component } from 'react';

// Catches any rendering error anywhere below it in the tree and shows a
// friendly message instead of leaving the user staring at a blank white
// page (which is what React does by default when a component throws during
// render and nothing catches it).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Something went wrong loading this page.</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Please try refreshing. If this keeps happening, let the admin know what page you were on.
          </p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
