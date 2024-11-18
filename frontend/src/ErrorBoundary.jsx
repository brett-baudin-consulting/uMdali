// ErrorBoundary.jsx  
import React from 'react';
import './ErrorBoundary.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo: errorInfo
    });

    // Log error to your preferred error monitoring service  
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    // Implement your error logging logic here  
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1 className="error-boundary__title">Something went wrong</h1>
          <div className="error-boundary__details">
            <p className="error-boundary__message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.errorInfo && (
              <details className="error-boundary__stack">
                <summary>Error Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
          <button
            className="error-boundary__button"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;  