import React from 'react';
import { PolaroidImage } from './PolaroidImage';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  // Parse markdown lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-4 ml-6 space-y-1.5 list-disc text-coklat-tua font-lora">
          {currentList.map((item, i) => (
            <li key={i} className="pl-1">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Replace **bold** and *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern for bold: **word** and italic: *word*
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(remaining.substring(lastIndex, match.index));
      }

      const matchStr = match[0];
      if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        parts.push(
          <strong key={`b-${keyIdx++}`} className="font-semibold text-coklat-tua">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith('*') && matchStr.endsWith('*')) {
        parts.push(
          <em key={`i-${keyIdx++}`} className="italic font-lora text-coklat-sedang">
            {matchStr.slice(1, -1)}
          </em>
        );
      } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        parts.push(
          <code key={`c-${keyIdx++}`} className="px-1.5 py-0.5 rounded bg-garis/30 font-elite text-xs text-coklat-tua">
            {matchStr.slice(1, -1)}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < remaining.length) {
      parts.push(remaining.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for list item
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      currentList.push(trimmed.slice(2));
      return;
    } else {
      flushList();
    }

    // Empty line
    if (trimmed === '') {
      elements.push(<div key={`spacer-${index}`} className="h-3" />);
      return;
    }

    // Image markdown: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      elements.push(
        <div key={`img-${index}`} className="my-6 flex justify-center">
          <PolaroidImage src={src} alt={alt} caption={alt || undefined} />
        </div>
      );
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="font-playfair text-xl font-bold text-coklat-tua mt-6 mb-2">
          {formatInlineText(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="font-playfair text-2xl font-bold text-coklat-tua mt-8 mb-3 pb-1 border-b border-garis/50">
          {formatInlineText(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="font-playfair text-3xl font-bold text-coklat-tua mt-8 mb-4">
          {formatInlineText(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-5 pl-4 py-2 border-l-4 border-terracotta bg-garis/15 rounded-r-md font-playfair italic text-lg text-coklat-sedang"
        >
          {formatInlineText(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${index}`} className="font-lora text-base sm:text-lg leading-relaxed text-coklat-tua/90 my-2">
        {formatInlineText(line)}
      </p>
    );
  });

  flushList();

  return <div className={`prose-journal max-w-none ${className}`}>{elements}</div>;
};
