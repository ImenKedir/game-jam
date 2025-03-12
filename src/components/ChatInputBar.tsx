'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputBarProps {
  input: string;
  isLoading: boolean;
  waitingForOthers: boolean;
  hasPendingMessages: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

export default function ChatInputBar({ 
  input, 
  isLoading, 
  waitingForOthers,
  hasPendingMessages,
  onInputChange, 
  onSubmit,
  onFocusChange
}: ChatInputBarProps) {
  const [showInput, setShowInput] = useState(true);
  const [animatingMessage, setAnimatingMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle focus and blur events
  const handleFocus = () => {
    if (onFocusChange) onFocusChange(true);
  };

  const handleBlur = () => {
    if (onFocusChange) onFocusChange(false);
  };

  // Handle message animation
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (input.trim()) {
      setAnimatingMessage(input);
      
      // Don't do the animation hide/show cycle when in batch mode
      if (!waitingForOthers && !hasPendingMessages) {
        setShowInput(false);
        // After animation completes, reset and show input again
        setTimeout(() => {
          setAnimatingMessage(null);
          setShowInput(true);
          
          // Re-focus the input after submission
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
        }, 600); // Animation duration
      } else {
        // Just clear animation after a moment for batch mode
        setTimeout(() => {
          setAnimatingMessage(null);
        }, 600);
      }
    }
    
    onSubmit(e);
  };

  // Hide input for everyone when AI is responding
  useEffect(() => {
    setShowInput(!isLoading);
  }, [isLoading]);

  // Get placeholder text based on state
  const getPlaceholderText = () => {
    if (hasPendingMessages) {
      return "Waiting for others to finish typing...";
    } else if (isLoading) {
      return "AI is responding...";
    } else {
      return "Ask the AI to create a game...";
    }
  };

  return (
    <>
      {/* Animating message */}
      <AnimatePresence>
        {animatingMessage && (
          <motion.div
            initial={{ opacity: 1, y: 0, x: 0 }}
            animate={{ opacity: 0, y: -20, x: 20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-16 right-8 p-3 bg-blue-600 text-white rounded-full px-5 max-w-[80%] truncate"
          >
            {animatingMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Show loading animation or chat input */}
      {isLoading ? (
        <div className="flex justify-center py-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <form onSubmit={handleFormSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={hasPendingMessages ? "" : input}
              onChange={onInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={getPlaceholderText()}
              className={`w-full py-3 px-5 rounded-full bg-gray-800/30 backdrop-blur-md 
                        border border-white/10 text-gray-100 focus:outline-none focus:ring-2 
                        focus:ring-blue-500/50 placeholder-gray-500 shadow-lg
                        ${hasPendingMessages ? 'text-blue-300 italic' : ''}`}
              disabled={hasPendingMessages}
            />
            
            {!hasPendingMessages && (
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-blue-600/80 text-white rounded-full disabled:opacity-50 disabled:pointer-events-none hover:bg-blue-500 transition-colors"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
} 