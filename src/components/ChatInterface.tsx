'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCode, faGamepad, faLightbulb, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Message } from '../hooks/useAIChat';

// Interface for updating the code editor
export interface EditorUpdateEvent {
  type: 'update_editor';
  code: string;
  language?: string;
  isComplete: boolean;
}

interface ChatInterfaceProps {
  discordUser?: {
    username: string;
    avatar?: string;
    id: string;
  };
  messages: Message[];
  streamingMessageId: string;
  onExampleSelect?: (exampleName: string) => void;
  // Callback to update the editor
  onUpdateEditor?: (event: EditorUpdateEvent) => void;
}

export default function ChatInterface({ 
  discordUser, 
  messages, 
  streamingMessageId, 
  onExampleSelect,
  onUpdateEditor 
}: ChatInterfaceProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isNearBottomRef = useRef(true);
  const [streamingCodeBlock, setStreamingCodeBlock] = useState<{
    messageId: string;
    codeContent: string;
    isComplete: boolean;
  } | null>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  // Enhanced loading messages with fun game development themes
  const loadingTexts = [
    "Generating magical code... ✨",
    "Crafting your game mechanics... 🎮",
    "Summoning digital entities... 👾",
    "Mining for algorithmic gold... 💰",
    "Compiling imagination circuits... 🧠",
    "Rendering your dreams into reality... 🌈",
    "Building virtual worlds... 🌎",
    "Rolling initiative on your code... 🎲",
    "Charging creative energy... ⚡",
    "Spawning game objects... 🎯",
    "Unleashing pixel wizardry... 🧙‍♂️",
    "Constructing fun engines... 🚂",
    "Optimizing fun factors... 😄",
    "Translating ideas to code... 💭",
    "Weaving interactive experiences... 🕸️",
    "Calculating player engagement... 📈",
    "Debugging the fun-o-meter... 🐛",
    "Leveling up your concept... 🆙",
  ];

  // Function to check if scrolled near bottom
  const checkIfNearBottom = useCallback(() => {
    if (!chatContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const scrolledPosition = scrollTop + clientHeight;
    const isNearBottom = scrollHeight - scrolledPosition < 100;
    
    return isNearBottom;
  }, []);
  
  // Handle scroll events to detect if user has scrolled away from bottom
  const handleScroll = useCallback(() => {
    const isNearBottom = checkIfNearBottom();
    isNearBottomRef.current = isNearBottom;
    
    // Only change auto-scroll setting when user manually scrolls
    // (not when auto-scrolling happens)
    if (shouldAutoScroll !== isNearBottom) {
      setShouldAutoScroll(isNearBottom);
    }
  }, [checkIfNearBottom, shouldAutoScroll]);
  
  // Handle example selection
  const handleExampleSelect = useCallback((exampleName: string) => {
    if (onExampleSelect) {
      onExampleSelect(exampleName);
    }
  }, [onExampleSelect]);

  // Effect for scrolling when messages change
  useEffect(() => {
    // If new messages arrive and we're near bottom, scroll to bottom
    if (messages.length > 0 && shouldAutoScroll) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, shouldAutoScroll]);
  
  // Effect for handling streaming content updates
  useEffect(() => {
    // If currently streaming a message and we're at the bottom,
    // keep scrolling to the bottom as content is added
    if (streamingMessageId && isNearBottomRef.current) {
      // Use requestAnimationFrame to smooth out scrolling during streaming
      requestAnimationFrame(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, [streamingMessageId, messages]);

  // Helper functions for code block detection
  const hasCodeBlockStart = (content: string): boolean => {
    return content.includes('```');
  };
  
  const getCodeBlockContent = (content: string): string | null => {
    const codeBlockMatch = content.match(/```[\s\S]*?```/);
    return codeBlockMatch ? codeBlockMatch[0] : null;
  };
  
  const isCodeBlockComplete = (content: string): boolean => {
    // Count number of backtick sequences
    const matches = content.match(/```/g);
    // Basic check: if we have at least two sets (opening and closing), code block markers are complete
    const hasCompleteMarkers = Boolean(matches && matches.length >= 2 && matches.length % 2 === 0);
    
    if (!hasCompleteMarkers) return false;
    
    // Advanced validation: check if code content is structurally complete
    // Extract the code content to check for proper structure
    const codeBlockMatch = content.match(/```js|javascript\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const codeContent = codeBlockMatch[1];
      
      // Check for p5.js structure with balanced braces
      const hasProperStart = codeContent.includes('return function(p)');
      
      // Count braces to verify balanced structure
      const openBraces = (codeContent.match(/\{/g) || []).length;
      const closeBraces = (codeContent.match(/\}/g) || []).length;
      const hasBalancedBraces = openBraces === closeBraces;
      
      // Check if code ends with closing brace
      const endsWithBrace = codeContent.trim().endsWith('}');
      
      return hasProperStart && hasBalancedBraces && endsWithBrace;
    }
    
    return hasCompleteMarkers;
  };

  // Process language from code block
  const getLanguageFromCodeBlock = (content: string): string | undefined => {
    if (!content.includes('```')) return undefined;
    
    const langMatch = content.match(/```([a-z]+)/i);
    return langMatch && langMatch[1] ? langMatch[1].toLowerCase() : undefined;
  };

  // Check for streaming code blocks and update editor if callback exists
  useEffect(() => {
    if (streamingMessageId) {
      const streamingMessage = messages.find(m => m.id === streamingMessageId);
      
      if (streamingMessage && streamingMessage.content) {
        const content = streamingMessage.content;
        
        // If we detect a code block start
        if (hasCodeBlockStart(content)) {
          // Extract the code content
          const codeContent = content.substring(content.indexOf('```'));
          const isComplete = isCodeBlockComplete(content);
          const language = getLanguageFromCodeBlock(content);
          
          // Set the streaming code block state
          setStreamingCodeBlock({
            messageId: streamingMessageId,
            codeContent,
            isComplete
          });
          
          // Update the editor if the callback exists
          if (onUpdateEditor) {
            onUpdateEditor({
              type: 'update_editor',
              code: codeContent,
              language,
              isComplete
            });
          }
        } else {
          setStreamingCodeBlock(null);
        }
      }
    } else {
      setStreamingCodeBlock(null);
    }
  }, [messages, streamingMessageId, onUpdateEditor]);

  // Effect for rotating loading text - slower cycle (10 seconds)
  useEffect(() => {
    if (streamingMessageId) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
      }, 10000); // 10 seconds interval
      
      return () => clearInterval(interval);
    }
  }, [streamingMessageId, loadingTexts.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Add styles for the ellipsis animation */}
      <style>{`
        @keyframes ellipsis {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }
        
        .animate-ellipsis::after {
          content: '.';
          animation: ellipsis 1.5s infinite;
          display: inline-block;
          width: 1em;
          text-align: left;
        }
        
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 5px 0px rgba(88, 101, 242, 0.4); }
          50% { box-shadow: 0 0 10px 2px rgba(88, 101, 242, 0.6); }
          100% { box-shadow: 0 0 5px 0px rgba(88, 101, 242, 0.4); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        
        @keyframes color-cycle {
          0% { color: #5865F2; }
          50% { color: #EB459E; }
          100% { color: #5865F2; }
        }
        
        .animate-color-cycle {
          animation: color-cycle 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* Chat header */}
      <div className="p-2.5 border-b border-[#202225] bg-[#222226] flex items-center">
        <FontAwesomeIcon icon={faGamepad} className="text-[#B9BBBE] mr-2" />
        <h2 className="text-[#FFFFFF] font-medium">Chat</h2>
      </div>
      
      {/* Messages container */}
      <div 
        className="flex-grow p-4 overflow-y-auto bg-[#36393F] space-y-4"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center h-full text-center p-6"
          >
            <div className="w-16 h-16 mb-4 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-[#5865F2] text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-[#FFFFFF] mb-2">Welcome to GameJam!</h3>
            <p className="text-[#B9BBBE] mb-6 max-w-md">
              Collaborate with others to create amazing games. Ask the AI to help you build your game ideas!
            </p>
            
            <div className="grid grid-cols-1 gap-3 mt-4 text-left">
              <div 
                className="p-3 bg-[#2F3136]/40 rounded-lg border border-[#202225]/30 backdrop-blur-sm flex items-start hover:bg-[#36373D]/40 transition-colors cursor-pointer"
                onClick={() => handleExampleSelect('bouncingGame')}
              >
                <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-[#5865F2]">"Create a simple bouncing game"</p>
                </div>
              </div>
              <div 
                className="p-3 bg-[#2F3136]/40 rounded-lg border border-[#202225]/30 backdrop-blur-sm flex items-start hover:bg-[#36373D]/40 transition-colors cursor-pointer"
                onClick={() => handleExampleSelect('platformerGame')}
              >
                <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-[#5865F2]">"Make a 3D platformer game"</p>
                </div>
              </div>
              <div 
                className="p-3 bg-[#2F3136]/40 rounded-lg border border-[#202225]/30 backdrop-blur-sm flex items-start hover:bg-[#36373D]/40 transition-colors cursor-pointer"
                onClick={() => handleExampleSelect('shootingGame')}
              >
                <FontAwesomeIcon icon={faLightbulb} className="text-yellow-400 mt-1 mr-3" />
                <div>
                  <p className="font-medium text-[#5865F2]">"Make a shooting game"</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) :
          messages.map((message, index) => {
            // Determine if this is the current user's message
            let isCurrentUser = false;
            if (message.role === 'user' && message.sender && discordUser) {
              isCurrentUser = message.sender.id === discordUser.id;
            }
            
            // Determine message alignment and styling
            const messageAlignment = message.role === 'user' 
              ? (isCurrentUser ? 'ml-auto' : 'mr-auto') 
              : '';
            
            // Determine message background color
            const messageBgColor = message.role === 'user'
              ? (isCurrentUser 
                  ? 'bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white'
                  : 'bg-gradient-to-r from-[#36373D] to-[#2F3136] text-[#DCDDDE] border-l-4 border-[#ED4245]')
              : message.id === streamingMessageId
                ? 'bg-[#36373D] border-l-4 border-[#5865F2] text-[#DCDDDE] transition-all duration-300 ease-in-out'
                : 'bg-gradient-to-r from-[#36373D] to-[#2F3136] text-[#DCDDDE]';
            
            // Determine if this message is streaming code
            const isStreamingCode = streamingCodeBlock && message.id === streamingCodeBlock.messageId;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.2
                }}
                className={`p-4 rounded-lg max-w-[95%] shadow-md ${messageAlignment} ${messageBgColor} ${message.id === streamingMessageId ? 'animate-pulse-glow' : ''}`}
              >
                {/* Message header with user info */}
                <div className="font-bold mb-2 flex items-center">
                  {message.role === 'user' ? (
                    <>
                      {message.sender ? (
                        <>
                          <img 
                            src={message.sender?.avatar 
                              ? `https://cdn.discordapp.com/avatars/${message.sender?.id}/${message.sender?.avatar}.png`
                              : `https://cdn.discordapp.com/embed/avatars/${parseInt(message.sender?.id || '0') % 5}.png`
                            }
                            alt={message.sender?.username || 'User'}
                            className="w-6 h-6 rounded-full mr-2 border border-gray-700/50"
                            onError={(e) => {
                              e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(message.sender?.id || '0') % 5}.png`;
                            }}
                          />
                          <span>{message.sender?.username || 'User'}</span>
                        </>
                      ) : discordUser && (
                        <>
                          <img 
                            src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
                            alt={discordUser.username}
                            className="w-6 h-6 rounded-full mr-2 border border-gray-700/50"
                            onError={(e) => {
                              e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.id) % 5}.png`;
                            }}
                          />
                          <span>{discordUser.username}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full mr-2 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <FontAwesomeIcon icon={faRobot} className="text-white/90 text-xs" />
                      </div>
                      <span>AI Assistant</span>
                    </>
                  )}
                </div>
                
                {/* Message content */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                  {/* If message has content */}
                  {message.content ? (
                    // For messages with code blocks being streamed
                    isStreamingCode ? (
                      <div className="py-2 flex flex-col">
                        {/* Show non-code content before the code block */}
                        {message.content.substring(0, message.content.indexOf('```')).trim() && (
                          <div className="mb-3">
                            {message.content.substring(0, message.content.indexOf('```'))}
                          </div>
                        )}
                        
                        {/* Code streaming indicator */}
                        <div className="bg-[#2b2d31]/50 p-3 rounded-md flex items-center space-x-3">
                          <FontAwesomeIcon icon={faSpinner} className="text-[#5865F2] animate-spin" />
                          <span className="animate-color-cycle font-medium">
                            {loadingTexts[loadingTextIndex]}
                          </span>
                        </div>
                        
                      </div>
                    ) : (
                      // For regular messages or completed code blocks
                      <>
                        {/* Regular message content - hide code blocks as they're in the editor */}
                        {message.content.includes('```') ? (
                          <>
                            {/* Display text before code block */}
                            {message.content.split('```')[0]}
                            
                            {/* Code block reference */}
                            <div className="mt-2 mb-2 bg-[#2b2d31]/50 p-3 rounded-md">
                              <div className="flex items-center text-[#B9BBBE]">
                                <FontAwesomeIcon icon={faCode} className="mr-2 text-[#5865F2]" />
                                <span>Code has been sent to the editor</span>
                              </div>
                            </div>
                            
                            {/* Display text after code block */}
                            {message.content.split('```').length > 2 && message.content.split('```').slice(2).join('```')}
                          </>
                        ) : (
                          message.content
                        )}
                      </>
                    )
                  ) : (
                    // For empty messages that are streaming (loading indicator)
                    message.id === streamingMessageId && (
                      <div className="py-2 flex items-center space-x-3">
                        <FontAwesomeIcon icon={faSpinner} className="text-[#5865F2] animate-spin" />
                        <span className="animate-color-cycle">
                          {loadingTexts[loadingTextIndex]}
                        </span>
                      </div>
                    )
                  )}
                  
                  {/* Add invisible zero-width space characters to help break very long strings */}
                  {message.content && message.content.length > 100 && !message.content.includes('\n') && 
                    Array.from({ length: Math.floor(message.content.length / 100) }).map((_, i) => (
                      <span key={i} className="invisible">&#8203;</span>
                    ))
                  }
                </div>
                
                {/* "Code added to editor" badge */}
                {message.role === 'assistant' && message.content && message.content.includes('[Code has been added to the editor]') && (
                  <div className="mt-2 text-xs bg-blue-900 bg-opacity-50 p-2 rounded flex items-center">
                    <FontAwesomeIcon icon={faCode} className="mr-2 text-blue-300" />
                    <span>Code has been added to the editor</span>
                  </div>
                )}
              </motion.div>
            );
          })
        }
        <div ref={messageEndRef} />
      </div>
    </div>
  );
}