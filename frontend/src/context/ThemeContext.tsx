import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'purple' | 'green' | 'red' | 'orange';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  accentColor: 'blue',
  toggleTheme: () => {},
  setAccentColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('accentColor');
    return (saved as AccentColor) || 'blue';
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

  const getAccentColorValue = (color: AccentColor): string => {
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
