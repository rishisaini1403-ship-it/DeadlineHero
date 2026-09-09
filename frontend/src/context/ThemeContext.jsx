import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  accentColor: 'blue',
  toggleTheme: () => {},
  setAccentColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  const [accentColor, setAccentColor] = useState(() => {
    const saved = localStorage.getItem('accentColor');
    return saved || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('accentColor', accentColor);
    // Apply accent color to CSS variable
    document.documentElement.style.setProperty('--accent-color', getAccentColorValue(accentColor));
  }, [accentColor]);

  const getAccentColorValue = (color) => {
    const colors = {
      blue: '#2563eb',
      purple: '#9333ea',
      green: '#16a34a',
      red: '#dc2626',
      orange: '#ea580c',
    };
    return colors[color];
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, toggleTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};
