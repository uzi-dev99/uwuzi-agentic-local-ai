'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import PageHeader from '@/components/ui/PageHeader';

export default function ConfigPage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // o un spinner/skeleton
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <PageHeader>
        <h1 className="text-lg font-bold">Configuración</h1>
      </PageHeader>
      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Apariencia</h2>
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <label htmlFor="darkModeToggle" className="font-medium">Modo Oscuro</label>
            <button
              id="darkModeToggle"
              onClick={toggleTheme}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-primary' : 'bg-muted'}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Cuenta</h2>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <label className="font-medium">Correo Electrónico</label>
            <p className="text-sm text-gray-600 dark:text-gray-400">usuario@ejemplo.com</p>
          </div>
          <button className="mt-4 w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
            Cerrar Sesión
          </button>
        </section>
      </div>
    </div>
  );
}