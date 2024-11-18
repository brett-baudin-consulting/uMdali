// ModalDialog.jsx  
import React, { useEffect, useCallback } from 'react';  
import PropTypes from 'prop-types';  
import { createPortal } from 'react-dom';  
import './ModalDialog.scss';

const ModalDialog = ({   
  isOpen,   
  onClose,   
  onCancel,   
  onConfirm,   
  children,  
  confirmText = 'Delete',  
  cancelText = 'Cancel'   
}) => {  
  const handleEscapeKey = useCallback((e) => {  
    if (e.key === 'Escape' && isOpen) {  
      onClose();  
    }  
  }, [isOpen, onClose]);

  useEffect(() => {  
    if (isOpen) {  
      document.addEventListener('keydown', handleEscapeKey);  
      document.body.style.overflow = 'hidden';  
    }  
      
    return () => {  
      document.removeEventListener('keydown', handleEscapeKey);  
      document.body.style.overflow = 'unset';  
    };  
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return createPortal(  
    <div   
      className="modal-overlay"   
      onClick={onClose}  
      role="dialog"  
      aria-modal="true"  
    >  
      <div   
        className="modal-container"   
        onClick={(e) => e.stopPropagation()}  
      >  
        <div className="modal-content">  
          {children}  
        </div>  
        <div className="modal-button-container">  
          <button   
            className="modal-button modal-button--secondary"  
            onClick={onCancel}  
            type="button"  
          >  
            {cancelText}  
          </button>  
          <button   
            className="modal-button modal-button--primary"  
            onClick={onConfirm}  
            type="button"  
          >  
            {confirmText}  
          </button>  
        </div>  
      </div>  
    </div>,  
    document.body  
  );  
};

ModalDialog.propTypes = {  
  isOpen: PropTypes.bool.isRequired,  
  onClose: PropTypes.func.isRequired,  
  onCancel: PropTypes.func.isRequired,  
  onConfirm: PropTypes.func.isRequired,  
  children: PropTypes.node,  
  confirmText: PropTypes.string,  
  cancelText: PropTypes.string  
};

export default ModalDialog;  