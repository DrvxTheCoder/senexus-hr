import { useRegisterActions } from 'kbar';
import { useTheme } from 'next-themes';

const useThemeSwitching = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const themeAction = [
    {
      id: 'toggleTheme',
      name: 'Basculer le thème',
      shortcut: ['t', 't'],
      section: 'Thème',
      perform: toggleTheme
    },
    {
      id: 'setLightTheme',
      name: 'Mode Clair',
      section: 'Thème',
      perform: () => setTheme('light')
    },
    {
      id: 'setDarkTheme',
      name: 'Mode Sombre',
      section: 'Thème',
      perform: () => setTheme('dark')
    }
  ];

  useRegisterActions(themeAction, [theme]);
};

export default useThemeSwitching;
