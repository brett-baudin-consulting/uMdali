// DropdownMenu.jsx  
import React from 'react';
import PropTypes from 'prop-types';

const DropdownMenu = ({ items, onSelect }) => (
    <ul className="new-conversation-options">
        {items.map(({ id, label }) => (
            <li
                key={id}
                onClick={() => onSelect(id)}
                role="button"
                tabIndex={0}
            >
                {label}
            </li>
        ))}
    </ul>
);

DropdownMenu.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
    })).isRequired,
    onSelect: PropTypes.func.isRequired
};

export default React.memo(DropdownMenu);  