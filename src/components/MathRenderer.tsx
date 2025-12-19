import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  inline?: boolean;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ 
  content, 
  inline = false, 
  className = "" 
}) => {
  // Clean up the content - remove $ symbols if present
  const cleanContent = content.replace(/^\$+|\$+$/g, '');
  
  try {
    if (inline) {
      return (
        <span className={`inline-math ${className}`}>
          <InlineMath math={cleanContent} />
        </span>
      );
    } else {
      return (
        <div className={`block-math ${className}`}>
          <BlockMath math={cleanContent} />
        </div>
      );
    }
  } catch (error) {
    console.error('Math rendering error:', error);
    // Fallback to plain text if rendering fails
    return (
      <span className={`math-error text-red-500 ${className}`} title="Math rendering error">
        {content}
      </span>
    );
  }
};

// Component to process text with mixed math and regular content
interface MathTextProps {
  children: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ children, className = "" }) => {
  // Split text by math expressions (both inline $...$ and block $$...$$)
  const parts = children.split(/(\$\$[^$]*\$\$|\$[^$\n]*\$)/g);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Block math
          return (
            <MathRenderer 
              key={index} 
              content={part.slice(2, -2)} 
              inline={false} 
            />
          );
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline math
          return (
            <MathRenderer 
              key={index} 
              content={part.slice(1, -1)} 
              inline={true} 
            />
          );
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
};

export default MathRenderer;