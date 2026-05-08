"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";

interface MessageContentProps {
  content: string;
}

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  // Detect if this is an inline code or a block
  const isInline = !className;

  if (isInline) {
    return (
      <code
        style={{
          background: "var(--surface-2)",
          padding: "0.1em 0.35em",
          borderRadius: "4px",
          fontSize: "0.8rem",
          fontFamily: "var(--font-mono-ui), 'IBM Plex Mono', monospace",
        }}
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ position: "relative", margin: "0.75rem 0" }}>
      <button
        onClick={handleCopy}
        aria-label="Copiar código"
        style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "6px",
          fontSize: "0.7rem",
          fontFamily: "inherit",
          cursor: "pointer",
          background: "hsl(240 14% 20% / 0.9)",
          color: "hsl(240 5% 70%)",
          border: "1px solid hsl(240 10% 22%)",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 96%)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "hsl(240 5% 70%)";
        }}
      >
        {copied ? (
          <>
            <Check size={11} />
            Copiado
          </>
        ) : (
          <>
            <Copy size={11} />
            Copiar
          </>
        )}
      </button>
      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
}

export function MessageContent({ content }: MessageContentProps) {
  return (
    <div className="prose-dark text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock as React.ComponentType<React.HTMLAttributes<HTMLElement>>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
