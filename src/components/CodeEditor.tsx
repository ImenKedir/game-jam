'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode } from '@fortawesome/free-solid-svg-icons';

interface CodeEditorProps {
  initialCode: string;
  onChange?: (code: string) => void;
  onApply?: (code: string) => void;
  className?: string;
  height?: string;
  isStreaming?: boolean;
}

// Define a public API for the component
export interface CodeEditorRef {
  updateWithStreamingCode: (streamingCode: string, language?: string, isComplete?: boolean) => string;
}

// Export a public method for streaming updates that can be called from ChatInterface
export interface EditorUpdateEvent {
  type: 'update_editor';
  code: string;
  language?: string;
  isComplete: boolean;
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({
  initialCode, 
  onChange, 
  onApply,
  className = '',
  height = '100%',
  isStreaming = false
}, ref) => {
  const [code, setCode] = useState(initialCode || '');
  const [isReceivingStream, setIsReceivingStream] = useState(isStreaming);
  
  // Apply streaming updates
  const updateWithStreamingCode = useCallback((streamingCode: string, language?: string, isComplete?: boolean) => {
    // Explicitly set streaming state based on completion status
    setIsReceivingStream(!isComplete);
    
    // Clean the streaming code by removing the backticks and language indicator
    let cleanCode = streamingCode;
    if (cleanCode.startsWith('```')) {
      // Extract language if present
      const langMatch = cleanCode.match(/```([a-z]+)?/i);
      const lang = langMatch && langMatch[1] ? langMatch[1] : language;
      
      // Remove opening ```language
      cleanCode = cleanCode.replace(/```([a-z]+)?\n/i, '');
      
      // Remove closing ```
      if (isComplete) {
        cleanCode = cleanCode.replace(/```\s*$/m, '');
      }
    }
    
    // Update code in editor
    setCode(cleanCode);
    
    // Notify parent component
    if (onChange) {
      onChange(cleanCode);
    }
    
    return cleanCode;
  }, [onChange]);
  
  // Force update the receiving stream state when isStreaming prop changes
  useEffect(() => {
    // This effect ensures we sync with the parent component's streaming state
    setIsReceivingStream(isStreaming);
  }, [isStreaming]);
  
  // Expose the updateWithStreamingCode method to parent components
  useImperativeHandle(ref, () => ({
    updateWithStreamingCode
  }), [updateWithStreamingCode]);
  
  // Apply changes when streaming is complete
  useEffect(() => {
    if (!isReceivingStream && onApply && code !== initialCode) {
      onApply(code);
    }
  }, [isReceivingStream, code, initialCode, onApply]);
  
  // Handle internal code changes from editor
  const handleEditorChange = useCallback((value: string) => {
    if (!isReceivingStream) { // Only allow edits when not streaming
      setCode(value);
      if (onChange) {
        onChange(value);
      }
    }
  }, [isReceivingStream, onChange]);
  
  // Reset when initial code changes from parent
  useEffect(() => {
    if (initialCode !== code && !isReceivingStream) {
      setCode(initialCode);
    }
  }, [initialCode, code, isReceivingStream]);
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative h-full">
        <CodeMirror
          value={code}
          height={height}
          extensions={[javascript({ jsx: true })]}
          onChange={handleEditorChange}
          theme="dark"
          editable={!isReceivingStream}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            autocompletion: true,
          }}
        />
        
        {/* Streaming indicator overlay */}
        {isReceivingStream && (
          <div className="absolute top-2 right-2 bg-[#5865F2]/90 text-white px-3 py-1 rounded-full text-xs flex items-center">
            <FontAwesomeIcon icon={faCode} className="mr-2 animate-pulse" />
            Receiving code...
          </div>
        )}
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';

export default CodeEditor; 