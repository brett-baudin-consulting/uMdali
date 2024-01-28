import React from "react";
import PropTypes from "prop-types";
import "./ModalDialog.scss";

const ModalDialog = ({ isOpen, onClose, onCancel, onConfirm, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {children}
        <div className="modal-button-container">
          <button className="modal-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

ModalDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default ModalDialog;
