'use client';

import { useEffect } from 'react';
import { cleanupObsoleteBlobUrls, exposeCleanupFunctions } from '@/utils/cleanupStorage';

/**
 * Componente que se ejecuta en el cliente para inicializar funciones de limpieza
 * y limpiar automáticamente URLs de blob obsoletas
 */
export default function ClientInitializer() {
  useEffect(() => {
    // Ejecutar limpieza automática de URLs obsoletas al cargar la app
    const timer = setTimeout(() => {
      try {
        cleanupObsoleteBlobUrls();
        
        // Exponer funciones de limpieza en desarrollo
        if (process.env.NODE_ENV === 'development') {
          exposeCleanupFunctions();
        }
      } catch (error) {
        console.error('Error durante la inicialización de limpieza:', error);
      }
    }, 1000); // Esperar 1 segundo para que la app se cargue completamente
    
    return () => clearTimeout(timer);
  }, []);
  
  // Este componente no renderiza nada visible
  return null;
}