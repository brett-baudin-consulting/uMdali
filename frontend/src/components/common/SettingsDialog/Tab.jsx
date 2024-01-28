import React from 'react';
import PropTypes from 'prop-types';

const Tab = ({ label, isActive, onClick }) => (
  <button className={`button ${isActive ? 'active' : ''}`} onClick={onClick}>
    {label}
  </button>
);

Tab.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default Tab;
