
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  theme: string | undefined;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, theme }) => {
  const isDark = theme === 'dark';

  // Tema personalizado para syntax highlighting con colores garantizados
  const syntaxTheme = isDark ? {
    'pre[class*="language-"]': {
      backgroundColor: '#1a1a1a !important',
      color: '#e5e5e5 !important',
      borderRadius: '0.5rem',
      padding: '1rem',
      overflowX: 'auto',
      border: '1px solid hsl(var(--border))',
    },
    'code[class*="language-"]': {
      backgroundColor: 'transparent !important',
      color: '#e5e5e5 !important',
    },
    'token.comment': { color: '#7c7c7c !important' },
    'token.punctuation': { color: '#e5e5e5 !important' },
    'token.property': { color: '#79c0ff !important' },
    'token.selector': { color: '#7ee787 !important' },
    'token.operator': { color: '#ff7b72 !important' },
    'token.keyword': { color: '#ff7b72 !important' },
    'token.function': { color: '#d2a8ff !important' },
    'token.variable': { color: '#79c0ff !important' },
    'token.string': { color: '#a5d6ff !important' },
    'token.number': { color: '#79c0ff !important' },
    'token.boolean': { color: '#79c0ff !important' },
  } : {
    'pre[class*="language-"]': {
      backgroundColor: '#f6f8fa !important',
      color: '#24292f !important',
      borderRadius: '0.5rem',
      padding: '1rem',
      overflowX: 'auto',
      border: '1px solid hsl(var(--border))',
    },
    'code[class*="language-"]': {
      backgroundColor: 'transparent !important',
      color: '#24292f !important',
    },
    'token.comment': { color: '#6a737d !important' },
    'token.punctuation': { color: '#24292f !important' },
    'token.property': { color: '#005cc5 !important' },
    'token.selector': { color: '#22863a !important' },
    'token.operator': { color: '#d73a49 !important' },
    'token.keyword': { color: '#d73a49 !important' },
    'token.function': { color: '#6f42c1 !important' },
    'token.variable': { color: '#005cc5 !important' },
    'token.string': { color: '#032f62 !important' },
    'token.number': { color: '#005cc5 !important' },
    'token.boolean': { color: '#005cc5 !important' },
  };

  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="my-4">
          <SyntaxHighlighter
            style={syntaxTheme}
            language={match[1]}
            PreTag="div"
            className="text-sm"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code 
          className={cn(
            'rounded px-2 py-1 text-sm font-mono',
            isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p({ children, ...props }: any) {
      return (
        <p 
          className="mb-4 last:mb-0"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </p>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h1({ children, ...props }: any) {
      return (
        <h1 
          className="text-2xl font-bold mb-4"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </h1>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h2({ children, ...props }: any) {
      return (
        <h2 
          className="text-xl font-bold mb-3"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </h2>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h3({ children, ...props }: any) {
      return (
        <h3 
          className="text-lg font-bold mb-2"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </h3>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ul({ children, ...props }: any) {
      return (
        <ul 
          className="list-disc list-inside mb-4 space-y-1"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </ul>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ol({ children, ...props }: any) {
      return (
        <ol 
          className="list-decimal list-inside mb-4 space-y-1"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </ol>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    li({ children, ...props }: any) {
      return (
        <li 
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </li>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    strong({ children, ...props }: any) {
      return (
        <strong 
          className="font-bold"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </strong>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    em({ children, ...props }: any) {
      return (
        <em 
          className="italic"
          style={{ color: isDark ? '#ffffff !important' : '#000000 !important' }}
          {...props}
        >
          {children}
        </em>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a({ children, href, ...props }: any) {
      return (
        <a 
          href={href}
          className="underline hover:no-underline transition-all duration-200"
          style={{ color: isDark ? '#60a5fa !important' : '#2563eb !important' }}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div
      className="max-w-none break-words"
      style={{ 
        color: isDark ? '#ffffff !important' : '#000000 !important',
        fontSize: '0.875rem',
        lineHeight: '1.6'
      }}
    >
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
