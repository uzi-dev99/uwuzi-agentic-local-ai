import { useState, useRef } from 'react';

// Configuración de archivos permitidos
const ALLOWED_FILE_TYPES = {
  // Documentos
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  
  // Imágenes
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  
  // Otros
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/json': '.json',
  'text/html': '.html',
  'text/css': '.css',
  'text/javascript': '.js',
  'application/javascript': '.js'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_FOR_BASE64 = 1 * 1024 * 1024; // 1MB para base64

export interface FileUploadResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileData: string;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Validar tipo de archivo
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${Object.values(ALLOWED_FILE_TYPES).join(', ')}`
      };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${formatFileSize(MAX_FILE_SIZE)}`
      };
    }

    return { isValid: true };
  };

  const processFile = (file: File): Promise<FileUploadResult> => {
    return new Promise((resolve, reject) => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        reject(new Error(validation.error));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      reader.onload = () => {
        try {
          let fileData: string;

          if (file.size <= MAX_FILE_SIZE_FOR_BASE64) {
            // Para archivos pequeños, usar base64
            fileData = reader.result as string;
          } else {
            // Para archivos grandes, crear blob URL
            fileData = URL.createObjectURL(file);
          }

          const result: FileUploadResult = {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileData
          };

          setIsUploading(false);
          setUploadProgress(100);
          resolve(result);
        } catch (error) {
          setIsUploading(false);
          reject(new Error('Error procesando el archivo'));
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        reject(new Error('Error leyendo el archivo'));
      };

      // Leer como base64 para archivos pequeños, o como array buffer para grandes
      if (file.size <= MAX_FILE_SIZE_FOR_BASE64) {
        reader.readAsDataURL(file);
      } else {
        // Para archivos grandes, simplemente crear el blob URL sin leer el contenido
        setTimeout(() => {
          try {
            const fileData = URL.createObjectURL(file);
            const result: FileUploadResult = {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileData
            };
            setIsUploading(false);
            setUploadProgress(100);
            resolve(result);
          } catch (error) {
            setIsUploading(false);
            reject(new Error('Error creando URL del archivo'));
          }
        }, 100);
      }
    });
  };

  const selectFile = (): Promise<FileUploadResult> => {
    return new Promise((resolve, reject) => {
      if (!fileInputRef.current) {
        reject(new Error('Referencia del input no disponible'));
        return;
      }

      const handleFileSelect = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) {
          reject(new Error('No se seleccionó ningún archivo'));
          return;
        }

        processFile(file)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            // Remover el event listener para evitar duplicados
            fileInputRef.current?.removeEventListener('change', handleFileSelect);
          });
      };

      // Remover cualquier listener previo antes de añadir uno nuevo
      fileInputRef.current.removeEventListener('change', handleFileSelect);
      fileInputRef.current.addEventListener('change', handleFileSelect, { once: true });
      fileInputRef.current.click();
    });
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('json')) return '⚙️';
    if (fileType.includes('html') || fileType.includes('css') || fileType.includes('javascript')) return '💻';
    return '📎';
  };

  return {
    isUploading,
    uploadProgress,
    fileInputRef,
    selectFile,
    formatFileSize,
    getFileIcon,
    allowedTypes: Object.values(ALLOWED_FILE_TYPES).join(',')
  };
};