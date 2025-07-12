import React, { createContext, useContext, ReactNode } from 'react';
import { DefaultTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  cardBackgroundColor: string;
  errorColor: string;
  successColor: string;
  warningColor: string;
  infoColor: string;
  borderColor: string;
  logoUrl?: string;
  fontFamily?: string;
}

export const defaultTheme: Theme = {
  primaryColor: '#007AFF',
  secondaryColor: '#FF9500',
  backgroundColor: '#F9F9F9',
  textColor: '#333333',
  cardBackgroundColor: '#FFFFFF',
  errorColor: '#FF3B30',
  successColor: '#34C759',
  warningColor: '#FFCC00',
  infoColor: '#5AC8FA',
  borderColor: '#E0E0E0',
  logoUrl: undefined,
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const useTheme = (): Theme => useContext(ThemeContext);

export function ThemeProvider({ theme, children }: { theme?: Partial<Theme>; children: ReactNode }) {
  const merged = { ...defaultTheme, ...theme };
  
  // Log the platform and theme for debugging
  console.log('Platform in ThemeProvider:', Platform.OS);
  console.log('Theme:', merged);
  
  // Use React.createElement instead of JSX since this is a .ts file
  return React.createElement(ThemeContext.Provider, { value: merged }, children);
}