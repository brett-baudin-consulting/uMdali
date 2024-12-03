import React, { useState, useRef, memo } from "react";
import PropTypes from "prop-types";
import { userShape } from '../../../../model/userPropType';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import "./UserMenu.scss";

const UserMenu = memo(({ user, setIsLoggedIn }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  useClickOutside(menuRef, () => {
    if (showMenu) setShowMenu(false);
  });

  const handleUserClick = () => {
    setShowMenu(prev => !prev);
  };

  const handleLogoff = () => {
    setIsLoggedIn(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setShowMenu(false);
    }
  };

  return (
    <div
      className="user-menu"
      ref={menuRef}
      onKeyDown={handleKeyDown}
    >
      <button
        onClick={handleUserClick}
        className="user-name-button"
        aria-expanded={showMenu}
        aria-haspopup="true"
      >
        {user.name} ({user.settings.model})
      </button>
      {showMenu && (
        <div
          className="user-options"
          role="menu"
          aria-label="User menu"
        >
          <button
            onClick={handleLogoff}
            className="logoff-button"
            role="menuitem"
          >
            Log off
          </button>
        </div>
      )}
    </div>
  );
});

UserMenu.propTypes = {
  user: userShape.isRequired,
  setIsLoggedIn: PropTypes.func.isRequired,
};

export default UserMenu;  