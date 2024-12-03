// components/SelectField/SelectField.jsx  
import React from 'react';
import PropTypes from 'prop-types';
import './SelectField.scss';

const SelectField = ({ label, value, onChange, options }) => (
    <div className="select-field">
        <label>
            <span className="select-label">{label}</span>
            <select value={value} onChange={onChange}>
                {options}
            </select>
        </label>
    </div>
);

SelectField.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.node.isRequired,
};

export default SelectField;  