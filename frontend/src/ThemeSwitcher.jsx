// ThemeSwitcher.js
import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

const ThemeSwitcher = () => {
  const { toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme}>Toggle Theme</button>
  );
};

export default ThemeSwitcher;