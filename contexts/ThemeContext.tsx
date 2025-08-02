import React, { createContext, useContext, useEffect, useState } from 'react';
import { profileService } from '../services/profileService';
import { supabase } from '../services/dbService';
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from profile on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Try to get theme from user profile
          try {
            const profile = await profileService.getProfile();
            if (profile?.theme_preference) {
              setTheme(profile.theme_preference);
            } else {
              // Fallback to localStorage
              const stored = localStorage.getItem('theme') as Theme;
              setTheme(stored || 'system');
            }
          } catch (error) {
            console.log('Profile not yet available, using localStorage');
            // Fallback to localStorage if profile doesn't exist yet
            const stored = localStorage.getItem('theme') as Theme;
            setTheme(stored || 'system');
          }
        } else {
          // User not authenticated, use localStorage
          const stored = localStorage.getItem('theme') as Theme;
          setTheme(stored || 'system');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('theme') as Theme;
        setTheme(stored || 'system');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Update theme in DOM
  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        setActualTheme(theme);
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  // Custom setTheme function that persists to both localStorage and profile
  const handleSetTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    
    // Save to localStorage immediately
    localStorage.setItem('theme', newTheme);
    
    // Try to save to user profile if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await profileService.updateThemePreference(newTheme);
      }
    } catch (error) {
      console.log('Could not save theme to profile:', error);
      // This is not critical, theme is still saved in localStorage
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
