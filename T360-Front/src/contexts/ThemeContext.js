import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(true);

  const toggleTheme = (checked) => {
    setIsLightMode(checked);
    document.body.setAttribute('data-theme', checked ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
