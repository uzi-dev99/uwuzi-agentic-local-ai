import React, { useState, useCallback } from 'react';

export interface FileData {
    name: string;
    content: string;
    type: 'image' | 'text' | 'audio' | 'pdf-small' | 'pdf-large' | 'other';
    readable: boolean;
}

export const useFileUpload = (onFileSelect: (fileData: FileData) => void) => {
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
        const isTextFile = file.type === 'text/plain' || file.type === 'text/markdown' || 
                          file.name.endsWith('.md') || file.name.endsWith('.txt') ||
                          file.name.endsWith('.csv') || file.name.endsWith('.json') ||
                          file.type === 'text/csv' || file.type === 'application/json';
        
        console.log('📁 File selected:', { 
          name: file.name, 
          type: file.type, 
          size: file.size,
          sizeKB: Math.round(file.size / 1024),
          sizeMB: Math.round(file.size / (1024 * 1024) * 100) / 100
        });
        
        if (file.type.startsWith('image/')) {
            fileData = { name: file.name, content: result, type: 'image', readable: true };
        } else if (file.type.startsWith('audio/')) {
            fileData = { name: file.name, content: result, type: 'audio', readable: false };
        } else if (file.type === 'application/pdf') {
            // Smart PDF processing based on size
            if (file.size < 1024 * 1024) { // <1MB → treat as small PDF (could convert to image)
                fileData = { name: file.name, content: result, type: 'pdf-small', readable: false };
                console.log('📄 Small PDF detected - suitable for image conversion');
            } else { // >1MB → treat as large PDF (extract text)
                fileData = { name: file.name, content: file.name, type: 'pdf-large', readable: false };
                console.log('📄 Large PDF detected - will extract text');
            }
        } else if (isTextFile) {
            fileData = { name: file.name, content: result, type: 'text', readable: true };
        } else {
            // For other file types
            fileData = { name: file.name, content: file.name, type: 'other', readable: false };
        }
        
        console.log('✅ File processed:', { 
          name: fileData.name, 
          type: fileData.type, 
          readable: fileData.readable,
          contentLength: fileData.content.length 
        });
        
        onFileSelect(fileData);
        setIsUploading(false);
    };

    reader.onerror = () => {
      setError('Failed to read file.');
      setIsUploading(false);
    };
    
    const isTextFile = file.type === 'text/plain' || file.type === 'text/markdown' || 
                      file.name.endsWith('.md') || file.name.endsWith('.txt') ||
                      file.name.endsWith('.csv') || file.name.endsWith('.json') ||
                      file.type === 'text/csv' || file.type === 'application/json';

    if (file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else if (isTextFile) {
      reader.readAsText(file);
    } else {
      // For unreadable files, we trigger onload directly without reading the content
      console.log('❓ Unknown file type - processing as other');
      onFileSelect({ name: file.name, content: file.name, type: 'other', readable: false });
      setIsUploading(false);
    }

    event.target.value = '';
  }, [onFileSelect]);

  return { isUploading, error, handleFileChange };
};