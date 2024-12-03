import PropTypes from "prop-types";  

function ContextListItem({ context, isActive, onClick }) {
    return (
        <li
            className={`list-item ${isActive ? "active" : ""}`}
            onClick={onClick}
        >
            {context.name}
        </li>
    );
}

ContextListItem.propTypes = {
    context: PropTypes.shape({
        name: PropTypes.string.isRequired,
        contextId: PropTypes.string.isRequired
    }).isRequired,
    isActive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired
};  

export default ContextListItem;