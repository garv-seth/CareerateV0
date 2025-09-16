import { useEffect, useState } from "react";
import { CursorPosition } from "@/hooks/useCollaboration";

interface LiveCursorsProps {
  cursors: CursorPosition[];
  currentFileName: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  getUserDisplayName: (userId: string) => string;
}

interface CursorElement {
  id: string;
  element: HTMLDivElement;
  labelElement: HTMLDivElement;
}

export default function LiveCursors({ cursors, currentFileName, textareaRef, getUserDisplayName }: LiveCursorsProps) {
  const [cursorElements, setCursorElements] = useState<Map<string, CursorElement>>(new Map());

  // Calculate cursor position in pixels based on line and column
  const calculateCursorPosition = (line: number, column: number, textarea: HTMLTextAreaElement) => {
    const value = textarea.value;
    const lines = value.split('\n');
    
    // Calculate character index
    let charIndex = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }
    charIndex += Math.min(column, lines[line]?.length || 0);

    // Create a temporary element to measure text dimensions
    const tempTextarea = document.createElement('textarea');
    tempTextarea.style.cssText = window.getComputedStyle(textarea).cssText;
    tempTextarea.style.position = 'absolute';
    tempTextarea.style.visibility = 'hidden';
    tempTextarea.style.height = 'auto';
    tempTextarea.style.overflow = 'hidden';
    tempTextarea.value = value.substring(0, charIndex);
    
    document.body.appendChild(tempTextarea);
    
    // Get the computed styles
    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = parseInt(computedStyle.fontSize);
    const lineHeight = parseInt(computedStyle.lineHeight) || fontSize * 1.2;
    
    // Calculate position
    const textareaRect = textarea.getBoundingClientRect();
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    
    // Approximate calculation (simplified)
    const x = column * (fontSize * 0.6) - scrollLeft + 4; // 4px padding
    const y = line * lineHeight - scrollTop + 4; // 4px padding
    
    document.body.removeChild(tempTextarea);
    
    return { x, y };
  };

  // Update cursor positions
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textareaRect = textarea.getBoundingClientRect();
    const activeCursors = cursors.filter(cursor => 
      cursor.fileName === currentFileName && 
      cursor.isVisible
    );

    // Remove cursors that are no longer active
    const newCursorElements = new Map(cursorElements);
    for (const [cursorId, cursorElement] of cursorElements) {
      const isActive = activeCursors.some(cursor => 
        `${cursor.userId}-${cursor.fileName}` === cursorId
      );
      
      if (!isActive) {
        cursorElement.element.remove();
        cursorElement.labelElement.remove();
        newCursorElements.delete(cursorId);
      }
    }

    // Add or update active cursors
    activeCursors.forEach(cursor => {
      const cursorId = `${cursor.userId}-${cursor.fileName}`;
      const position = calculateCursorPosition(cursor.line, cursor.column, textarea);
      
      let cursorElement = newCursorElements.get(cursorId);
      
      if (!cursorElement) {
        // Create new cursor element
        const element = document.createElement('div');
        element.className = 'absolute pointer-events-none z-10 transition-all duration-100';
        element.style.cssText = `
          width: 2px;
          height: 20px;
          background-color: ${cursor.cursorColor};
          border-radius: 1px;
          animation: blink 1s infinite;
        `;

        // Create cursor label
        const labelElement = document.createElement('div');
        labelElement.className = 'absolute pointer-events-none z-20 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap transform -translate-y-full';
        labelElement.style.cssText = `
          background-color: ${cursor.cursorColor};
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin-bottom: 4px;
        `;
        labelElement.textContent = getUserDisplayName(cursor.userId);

        // Add CSS for blink animation if not already added
        if (!document.getElementById('cursor-blink-style')) {
          const style = document.createElement('style');
          style.id = 'cursor-blink-style';
          style.textContent = `
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0.3; }
            }
          `;
          document.head.appendChild(style);
        }

        cursorElement = {
          id: cursorId,
          element,
          labelElement
        };

        newCursorElements.set(cursorId, cursorElement);
      }

      // Position the cursor
      const containerRect = textarea.getBoundingClientRect();
      cursorElement.element.style.left = `${position.x}px`;
      cursorElement.element.style.top = `${position.y}px`;
      cursorElement.labelElement.style.left = `${position.x}px`;
      cursorElement.labelElement.style.top = `${position.y}px`;

      // Add to DOM if not already there
      if (!cursorElement.element.parentNode) {
        textarea.parentElement?.appendChild(cursorElement.element);
      }
      if (!cursorElement.labelElement.parentNode) {
        textarea.parentElement?.appendChild(cursorElement.labelElement);
      }

      // Handle selection
      if (cursor.selectionStart && cursor.selectionEnd) {
        // TODO: Implement selection highlighting
        // This would require more complex positioning calculations
      }
    });

    setCursorElements(newCursorElements);
  }, [cursors, currentFileName, textareaRef, getUserDisplayName, cursorElements]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cursorElements.forEach(({ element, labelElement }) => {
        element.remove();
        labelElement.remove();
      });
    };
  }, []);

  // This component doesn't render anything directly as it manipulates DOM elements
  return null;
}