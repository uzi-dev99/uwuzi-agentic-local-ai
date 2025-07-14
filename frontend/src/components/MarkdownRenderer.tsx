
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarkdownRendererProps {
  content: string;
  theme: string | undefined;
}

const CodeBlock: React.FC<{ children: string; language: string; isDark: boolean }> = ({ children, language, isDark }) => {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    if (isCopied) return;
    try {
      await navigator.clipboard.writeText(children);
      toast.success('Código copiado al portapapeles');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('No se pudo copiar el código');
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={isDark ? materialDark : prism}
          language={language}
          PreTag="pre"
          className="!bg-transparent !p-4 !m-0 text-sm rounded-lg border"
          customStyle={{
            backgroundColor: isDark ? 'rgb(30, 30, 30)' : 'rgb(248, 250, 252)',
            border: `1px solid ${isDark ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}`,
            borderRadius: '0.5rem',
            margin: 0,
            padding: '1rem'
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 hover:bg-background"
        onClick={handleCopy}
        aria-label="Copiar código"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, theme }) => {
  const isDark = theme === 'dark';



  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock 
          language={match[1]} 
          isDark={isDark}
        >
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      ) : (
        <code 
          className={cn(
            'rounded px-1.5 py-0.5 text-sm font-mono break-all',
            isDark ? 'bg-gray-800 text-gray-50' : 'bg-gray-200 text-gray-900'
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table({ children, ...props }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table 
            className={cn(
              'min-w-full border-collapse border rounded-lg',
              'xs:min-w-[300px] sm:min-w-full',
              isDark ? 'border-gray-600' : 'border-gray-400'
            )}
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thead({ children, ...props }: any) {
      return (
        <thead 
          className={cn(
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          )}
          {...props}
        >
          {children}
        </thead>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    th({ children, ...props }: any) {
      return (
        <th 
          className={cn(
            'border px-4 py-2 text-left font-semibold',
            isDark ? 'border-gray-600 text-gray-50' : 'border-gray-400 text-gray-900'
          )}
          {...props}
        >
          {children}
        </th>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    td({ children, ...props }: any) {
      return (
        <td 
          className={cn(
            'border px-4 py-2',
            isDark ? 'border-gray-600 text-gray-50' : 'border-gray-400 text-gray-900'
          )}
          {...props}
        >
          {children}
        </td>
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
    <div className={cn(
      "prose max-w-none break-words",
      isDark ? "prose-invert" : "",
      "prose-sm prose-gray",
      "prose-headings:font-semibold",
      "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
      "prose-code:text-sm prose-code:font-mono",
      "prose-pre:p-0 prose-pre:bg-transparent"
    )}>
      <ReactMarkdown 
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
