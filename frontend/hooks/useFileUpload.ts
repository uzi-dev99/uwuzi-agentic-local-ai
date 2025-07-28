import React, { useState, useCallback } from 'react';

export interface FileData {
    name: string;
    content: string;
    type: 'image' | 'text' | 'other';
    readable: boolean;
}

export const useFileUpload = (onFileSelect: (fileData: FileData, file: File) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File is too large. Please select a file smaller than 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
        const result = e.target?.result as string;
        let fileData: FileData;

        // Check for text files by type or extension
        const isTextFile = file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt');
        
        if (file.type.startsWith('image/')) {
            fileData = { name: file.name, content: result, type: 'image', readable: true };
        } else if (isTextFile) {
            fileData = { name: file.name, content: result, type: 'text', readable: true };
        } else {
            // For other file types like PDF, we don't read content but pass the name.
            fileData = { name: file.name, content: file.name, type: 'other', readable: false };
        }
        
        onFileSelect(fileData, file);
        setIsUploading(false);
    };

    reader.onerror = () => {
      setError('Failed to read file.');
      setIsUploading(false);
    };
    
    const isTextFile = file.type === 'text/plain' || file.type === 'text/markdown' || file.name.endsWith('.md') || file.name.endsWith('.txt');

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else if (isTextFile) {
      reader.readAsText(file);
    } else {
      // For unreadable files, we trigger onload directly without reading the content
      onFileSelect({ name: file.name, content: file.name, type: 'other', readable: false }, file);
      setIsUploading(false);
    }

    event.target.value = '';
  }, [onFileSelect]);

  return { isUploading, error, handleFileChange };
};