'use client';

import { useState } from 'react';
import { Message } from '@/hooks/useChat';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileMessageProps {
  message: Message;
}

export default function FileMessage({ message }: FileMessageProps) {
  const [hasError, setHasError] = useState(false);
  const { formatFileSize, getFileIcon } = useFileUpload();

  if (!message.fileName || !message.fileData) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="text-red-500">
          ❌
        </div>
        <div className="flex-1">
          <p className="text-sm text-red-600 dark:text-red-400">Archivo no disponible</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    try {
      if (!message.fileData || !message.fileName) {
        setHasError(true);
        return;
      }

      let downloadUrl: string;
      
      if (message.fileData.startsWith('data:')) {
        // Es base64
        downloadUrl = message.fileData;
      } else if (message.fileData.startsWith('blob:')) {
        // Es blob URL
        downloadUrl = message.fileData;
      } else {
        setHasError(true);
        return;
      }

      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = message.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      setHasError(true);
    }
  };

  const handlePreview = () => {
    try {
      if (!message.fileData) {
        setHasError(true);
        return;
      }

      // Solo para imágenes y PDFs
      if (message.fileType?.startsWith('image/') || message.fileType?.includes('pdf')) {
        window.open(message.fileData, '_blank');
      }
    } catch (error) {
      console.error('Error previsualizando archivo:', error);
      setHasError(true);
    }
  };

  const canPreview = message.fileType?.startsWith('image/') || message.fileType?.includes('pdf');
  const fileIcon = getFileIcon(message.fileType || '');
  const fileSize = formatFileSize(message.fileSize || 0);

  if (hasError) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="text-red-500">
          ❌
        </div>
        <div className="flex-1">
          <p className="text-sm text-red-600 dark:text-red-400">Error al cargar el archivo</p>
          <p className="text-xs text-red-500 dark:text-red-500">{message.fileName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {/* Icono del archivo */}
      <div className="text-2xl flex-shrink-0">
        {fileIcon}
      </div>
      
      {/* Información del archivo */}
      <div className="flex-1 min-w-0 max-w-full">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate break-all">
          {message.fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {fileSize} • {message.fileType}
        </p>
      </div>
      
      {/* Botones de acción */}
      <div className="flex gap-2 flex-shrink-0">
        {canPreview && (
          <button
            onClick={handlePreview}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Previsualizar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
        
        <button
          onClick={handleDownload}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          title="Descargar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}