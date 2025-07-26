'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { useTheme } from '@/context/ThemeContext';

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

interface ImageThumbnailProps {
  src: string;
  alt: string;
}

function ImageThumbnail({ src, alt }: ImageThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
        <span>🖼️</span>
        <span className="text-gray-600 dark:text-gray-400">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <div className="inline-block my-2 max-w-full">
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[150px] sm:max-w-[200px] sm:max-h-[150px] rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow object-contain"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onClick={() => window.open(src, '_blank')}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      {isLoading && (
        <div className="w-full max-w-[200px] h-[150px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400">Cargando...</span>
        </div>
      )}
    </div>
  );
}

export default function MessageContent({ content, isUser }: MessageContentProps) {
  const { theme } = useTheme();
  
  // Detectar si el contenido contiene markdown
  const hasMarkdownSyntax = (
    content.includes('**') || 
    content.includes('*') || 
    content.includes('#') || 
    content.includes('```') || 
    content.includes('`') ||
    content.includes('[') && content.includes('](') ||
    content.includes('- ') ||
    content.includes('1. ')
  );

  // Detectar si el contenido es principalmente código
  const isCodeBlock = content.includes('```') || (
    (content.includes('def ') || content.includes('function ') || content.includes('class ') ||
     content.includes('import ') || content.includes('const ') || content.includes('let ') ||
     content.includes('var ') || content.includes('if (') || content.includes('for (') ||
     content.includes('{') && content.includes('}')) &&
    content.split('\n').length > 2
  );

  // Extraer URLs de imágenes del contenido
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
  const imageUrls = content.match(imageUrlRegex) || [];

  // Función para renderizar código con syntax highlighting
  const renderCodeBlock = (code: string, language?: string) => {
    const detectedLanguage = language || detectLanguage(code);
    
    return (
      <div className="max-w-full overflow-x-auto">
        <SyntaxHighlighter
          language={detectedLanguage}
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '100%',
            overflowX: 'auto'
          }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  // Detectar lenguaje de programación
  const detectLanguage = (code: string): string => {
    if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 'python';
    if (code.includes('function ') || code.includes('const ') || code.includes('console.log')) return 'javascript';
    if (code.includes('public class') || code.includes('System.out.println')) return 'java';
    if (code.includes('#include') || code.includes('int main')) return 'cpp';
    if (code.includes('SELECT') || code.includes('FROM') || code.includes('WHERE')) return 'sql';
    if (code.includes('<html>') || code.includes('<div>') || code.includes('<p>')) return 'html';
    if (code.includes('.class') || code.includes('display:') || code.includes('color:')) return 'css';
    if (code.includes('#!/bin/bash') || code.includes('echo ')) return 'bash';
    return 'text';
  };

  // Componente personalizado para renderizar código en markdown
  const CodeComponent = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    return !inline && match ? (
      renderCodeBlock(String(children).replace(/\n$/, ''), language)
    ) : (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono break-all" {...props}>
        {children}
      </code>
    );
  };

  // Si el contenido es principalmente código (sin markdown), renderizarlo directamente
  if (isCodeBlock && !content.includes('```')) {
    return (
      <div className="space-y-2 max-w-full overflow-hidden">
        {renderCodeBlock(content)}
        {imageUrls.map((url, index) => (
          <ImageThumbnail key={index} src={url} alt={`Imagen ${index + 1}`} />
        ))}
      </div>
    );
  }

  // Si tiene sintaxis de markdown, renderizarlo como markdown
  if (hasMarkdownSyntax) {
    return (
      <div className="prose prose-sm max-w-full dark:prose-invert overflow-hidden break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: CodeComponent,
            img: ({ src, alt }) => (
              <ImageThumbnail src={typeof src === 'string' ? src : ''} alt={alt || 'Imagen'} />
            ),
            pre: ({ children }) => (
              <div className="max-w-full overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">{children}</pre>
              </div>
            ),
            table: ({ children }) => (
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-full">{children}</table>
              </div>
            ),
            p: ({ children }) => {
              // Buscar URLs de imágenes en párrafos de texto
              const text = String(children);
              const hasImages = imageUrlRegex.test(text);
              
              if (hasImages) {
                const parts = text.split(imageUrlRegex);
                return (
                  <p className="text-sm break-words">
                    {parts.map((part, index) => {
                      if (imageUrlRegex.test(part)) {
                        return <ImageThumbnail key={index} src={part} alt={`Imagen ${index}`} />;
                      }
                      return part;
                    })}
                  </p>
                );
              }
              
              return <p className="text-sm break-words">{children}</p>;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Para texto plano, buscar URLs de imágenes y mostrar miniaturas
  if (imageUrls.length > 0) {
    const parts = content.split(imageUrlRegex);
    
    return (
      <div className="space-y-2 max-w-full overflow-hidden">
        <p className="text-sm break-words">
          {parts.map((part, index) => {
            if (imageUrlRegex.test(part)) {
              return <ImageThumbnail key={index} src={part} alt={`Imagen ${index + 1}`} />;
            }
            return part;
          })}
        </p>
      </div>
    );
  }

  // Texto plano sin formato especial
  return <p className="text-sm break-words">{content}</p>;
}