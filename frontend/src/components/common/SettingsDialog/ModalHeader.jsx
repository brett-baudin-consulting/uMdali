// ModalHeader.jsx  
import React from 'react';
import PropTypes from 'prop-types';

const ModalHeader = ({ onClose }) => (
    <div className="settings-modal-header">
        <h4>Settings</h4>
        <button onClick={onClose} aria-label="Close settings">✖</button>
    </div>
);

ModalHeader.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default ModalHeader;  