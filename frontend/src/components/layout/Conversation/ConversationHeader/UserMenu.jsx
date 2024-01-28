import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { userShape } from '../../../../model/userPropType';
import "./UserMenu.scss";

const UserMenu = ({ user, setIsLoggedIn }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(); // Create a ref for the menu

  const handleUserClick = () => {
    setShowMenu((current) => !current);
  };

  const handleLogoff = () => {
    setIsLoggedIn(false);
  };

  const handleClickOutside = (event) => {
    // If click is outside menuRef, close the menu
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    // Add event listener when the component is mounted or when showMenu changes
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener when the component is unmounted or before adding a new one
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]); // Only re-run if showMenu changes

  return (
    <div className="user-menu" ref={menuRef}>
      <button onClick={handleUserClick} className="user-name-button">
        {user.name} ({user.settings.model})
      </button>
      {showMenu && (
        <div className="user-options">
          <button onClick={handleLogoff} className="logoff-button">
            Log off
          </button>
        </div>
      )}
    </div>
  );
};

UserMenu.propTypes = {
  user: userShape.isRequired,
  setIsLoggedIn: PropTypes.func.isRequired,
};

export default UserMenu;