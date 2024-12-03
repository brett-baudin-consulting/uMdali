import React from 'react';
import PropTypes from 'prop-types';

class MessageErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Message Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div className="message-item__error">Error loading message</div>;
        }

        return this.props.children;
    }
}

MessageErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
};

export default MessageErrorBoundary;  