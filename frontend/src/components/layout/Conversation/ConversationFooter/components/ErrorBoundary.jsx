// ErrorBoundary.jsx  
import { Component } from 'react';
import PropTypes from 'prop-types';
import './ErrorBoundary.scss';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        const { hasError, error } = this.state;
        const { fallback, children } = this.props;

        if (hasError) {
            return fallback || (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>{error?.message}</p>
                </div>
            );
        }

        return children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.element
};

export default ErrorBoundary;  