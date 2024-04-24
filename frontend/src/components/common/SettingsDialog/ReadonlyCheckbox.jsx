import React from "react";
import PropTypes from "prop-types";
import "./ReadonlyCheckbox.scss";

const ReadonlyCheckbox = ({ isChecked, label }) => (
    <div className="readonly-checkbox-container">
        <label className="readonly-label">
            <span>{label}:</span>
            <input
                type="checkbox"
                checked={isChecked}
                disabled
                className="readonly-input"
            />
        </label>
    </div>
);

ReadonlyCheckbox.propTypes = {
    isChecked: PropTypes.bool,
    label: PropTypes.string.isRequired,
};

ReadonlyCheckbox.defaultProps = {
    isChecked: false
};

export default ReadonlyCheckbox;