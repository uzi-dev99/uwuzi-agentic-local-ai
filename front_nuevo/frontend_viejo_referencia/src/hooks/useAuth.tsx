import * as React from 'react';
import type { User } from '@/types/chat';

// A single admin user, retrieved from localStorage or created if not present.
const getAdminUser = (): User => {
  try {
    const user = localStorage.getItem('wuzi-admin-user');
    if (user) {
      return JSON.parse(user);
    }
    const defaultAdmin: User = { 
      id: 'admin-1', 
      username: 'Administrador', 
      role: 'admin', 
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f' 
    };
    localStorage.setItem('wuzi-admin-user', JSON.stringify(defaultAdmin));
    return defaultAdmin;
  } catch (error) {
    console.error("Failed to parse admin user from localStorage", error);
    const defaultAdmin: User = { id: 'admin-1', username: 'Administrador', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f' };
    localStorage.setItem('wuzi-admin-user', JSON.stringify(defaultAdmin));
    return defaultAdmin;
  }
};

interface AuthContextType {
  currentUser: User | null;
  login: () => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  appLogo: string | null;
  setAppLogo: (logo: string | null) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const AuthContext = React.createContext<AuthContextType>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  appLogo: null,
  setAppLogo: () => {},
  theme: 'dark',
  setTheme: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(() => {
    try {
      const isLoggedIn = localStorage.getItem('wuzi-assist-logged-in');
      if (isLoggedIn === 'true') {
        return getAdminUser();
      }
    } catch (error) {
      console.error("Failed to parse current user from localStorage", error);
    }
    return null;
  });
  const [appLogo, _setAppLogo] = React.useState<string | null>(() => {
    try {
      return localStorage.getItem('wuzi-app-logo');
    } catch (error) {
      console.error("Failed to get app logo from localStorage", error);
      return null;
    }
  });

  const [theme, _setTheme] = React.useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('wuzi-theme');
      return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    } catch (error) {
      console.error("Failed to get theme from localStorage", error);
      return 'dark';
    }
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('wuzi-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: 'dark' | 'light') => {
    _setTheme(newTheme);
  };

  const setAppLogo = (logo: string | null) => {
    _setAppLogo(logo);
    if (logo) {
      localStorage.setItem('wuzi-app-logo', logo);
    } else {
      localStorage.removeItem('wuzi-app-logo');
    }
  };

  const login = () => {
    const adminUser = getAdminUser();
    localStorage.setItem('wuzi-assist-logged-in', 'true');
    setCurrentUser(adminUser);
  };

  const logout = () => {
    localStorage.removeItem('wuzi-assist-logged-in');
    localStorage.removeItem('wuzi-assist-currentUser');
    setCurrentUser(null);
  };
  
  const updateUser = (updatedUser: User) => {
    localStorage.setItem('wuzi-admin-user', JSON.stringify(updatedUser));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser, appLogo, setAppLogo, theme, setTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
