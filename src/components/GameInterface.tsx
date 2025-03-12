'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { P5Sketch } from './P5Sketch';
import ChatInterface, { EditorUpdateEvent } from './ChatInterface';
import CodeEditor, { CodeEditorRef } from './CodeEditor';
import ChatInputBar from './ChatInputBar';
import { useSyncState } from '@robojs/sync';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPlay, faSave, faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { bouncingShapeSketch, platformerGameSketch, shootingGameSketch } from '../app/example_games/example_sketches';
import { motion } from 'framer-motion';
import { useAIChat } from '../hooks/useAIChat';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { TypingIndicator } from './TypingIndicator';
import { PendingMessagesIndicator } from './PendingMessagesIndicator';
import type { PendingMessage } from '../hooks/useTypingIndicator';
import { Game } from '../utils/supabaseClient';
import { createGame, updateGame } from '../utils/gameService';

interface GameInterfaceProps {
  discordUser: {
    username: string;
    avatar?: string;
    id: string;
    channelName: string;
  };
  gameId: string;
  currentGame: Game | null;
  onReturnToLibrary: () => void;
}

export default function GameInterface({ discordUser, gameId, currentGame, onReturnToLibrary }: GameInterfaceProps) {
  const [currentCode, setCurrentCode] = useState<string>(currentGame?.code || bouncingShapeSketch);
  const [editedCode, setEditedCode] = useState<string>(currentGame?.code || bouncingShapeSketch);
  const [showCode, setShowCode] = useState(true);
  const [codeChanged, setCodeChanged] = useState(false);
  const [chatWidth, setChatWidth] = useState(33); // Default chat width percentage
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dependencies] = useState<string[]>([gameId]);
  const [isStreamingToEditor, setIsStreamingToEditor] = useState(false);
  
  // Refs for resizing
  const resizeDivRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  // Use RoboJS sync for shared game state
  const [restartCounter, setRestartCounter] = useSyncState(0, ['game-state', gameId]);
  const [syncedCode, setSyncedCode] = useSyncState('', ['game-code', gameId]);
  
  // Add this new state for the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'library' | null>(null);
  
  // Add this combined state
  const [showSaveBeforeExitModal, setShowSaveBeforeExitModal] = useState(false);
  
  // Ref for the code editor
  const codeEditorRef = useRef<CodeEditorRef>(null);
  
  // Sync code from RoboJS
  useEffect(() => {
    if (syncedCode && syncedCode !== currentCode) {
      setCurrentCode(syncedCode);
      setEditedCode(syncedCode);
      setCodeChanged(false);
    }
  }, [syncedCode, currentCode]);
  
  // Handle streaming code updates from ChatInterface
  const handleEditorUpdate = useCallback((event: EditorUpdateEvent) => {
    if (event.type === 'update_editor') {
      // Update streaming status - make sure it's updated immediately
      setIsStreamingToEditor(!event.isComplete);

      // Use the code editor's method to update code if ref is available
      if (codeEditorRef.current) {
        const cleanCode = codeEditorRef.current.updateWithStreamingCode(
          event.code,
          event.language,
          event.isComplete
        );
        
        // If streaming is complete, update the UI state and code
        if (event.isComplete) {
          // Explicitly ensure streaming is off
          setIsStreamingToEditor(false);
          
          // Only mark code as changed when streaming is complete to prevent button flashing
          setCodeChanged(cleanCode !== currentCode);
          
          // If in game view mode, apply code immediately
          if (!showCode) {
            setCurrentCode(cleanCode);
            setSyncedCode(cleanCode);
            setRestartCounter(prev => prev + 1);
          }
        }
      }
    }
  }, [currentCode, showCode, setSyncedCode, setRestartCounter]);
  
  // Handle example selection
  const handleExampleSelect = useCallback((exampleName: string) => {
    // Load the appropriate example game based on the selection
    let exampleCode = '';
    
    switch(exampleName) {
      case 'bouncingGame':
        exampleCode = bouncingShapeSketch;
        break;
      case 'platformerGame':
        exampleCode = platformerGameSketch;
        break;
      case 'shootingGame':
        exampleCode = shootingGameSketch;
        break;
      default:
        exampleCode = bouncingShapeSketch;
    }
    
    // Update the code editor with the selected example
    setEditedCode(exampleCode);
    setCurrentCode(exampleCode);
    setSyncedCode(exampleCode);
    setRestartCounter(prev => prev + 1);
    setCodeChanged(false);
    
    console.log(`Loaded example: ${exampleName}`);
  }, [setSyncedCode, setRestartCounter]);
  
  // When AI generates code, update both current and edited code
  const handleCodeGenerated = useCallback((code: string) => {
    // Fix double nested return function if present
    const fixedCode = code.replace(/return function\(p\) {\s*return function\(p\) {/, 'return function(p) {');
    setEditedCode(fixedCode);
    
    // Only update codeChanged after the full code has been generated
    setCodeChanged(fixedCode !== currentCode);
    
    // If in game view mode, apply code immediately
    if (!showCode) {
      setCurrentCode(fixedCode);
      setSyncedCode(fixedCode);
      setRestartCounter(prev => prev + 1);
    }
  }, [currentCode, showCode, setSyncedCode, setRestartCounter]);
  
  // Handle code editor changes
  const handleCodeChange = useCallback((value: string) => {
    setEditedCode(value);
    // Mark as changed if different from the currently running code
    const hasChanged = value !== currentCode;
    setCodeChanged(hasChanged);
  }, [currentCode]);
  
  // Apply edited code
  const handleApplyCode = useCallback(() => {
    setCurrentCode(editedCode);
    setSyncedCode(editedCode);
    setRestartCounter(prev => prev + 1);
    setCodeChanged(false);
  }, [editedCode, setSyncedCode, setRestartCounter]);
  
  const toggleCodeView = useCallback(() => {
    setShowCode(!showCode);
  }, [showCode]);

  // Get chat state from useAIChat hook with message batching support
  const { 
    messages, 
    input, 
    isLoading: aiLoading, 
    streamingMessageId,
    handleInputChange, 
    handleSubmit,
    sendBatchedMessages,
    setInput
  } = useAIChat({ 
    onCodeGenerated: handleCodeGenerated, 
    currentCode,
    dependencies: dependencies,
    currentUser: {
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar
    },
    onStreamComplete: () => {
      // Reset batch processing when AI response is complete
      resetBatchProcessing();
      // Also make sure to reset streaming state
      setIsStreamingToEditor(false);
    }
  });
  
  // Updated hook to get typing status and pending messages
  const { 
    typingUsers, 
    userPendingMessages,
    otherPendingMessages,
    hasUserPendingMessage,
    setUserTypingStatus, 
    addPendingMessage,
    checkAndProcessBatch,
    getAndClearPendingBatch,
    batchInProgress,
    processingBatch,
    resetBatchProcessing
  } = useTypingIndicator(discordUser.id, dependencies);
  
  // Handle chat input focus changes
  const handleFocusChange = useCallback((isFocused: boolean) => {
    // Only update typing status if user doesn't have pending messages
    if (!hasUserPendingMessage) {
      setUserTypingStatus(discordUser, isFocused, input);
    }
    
    // Check if we can process a batch when user stops typing
    if (!isFocused && !input.trim()) {
      checkAndProcessBatch();
    }
  }, [discordUser, hasUserPendingMessage, setUserTypingStatus, checkAndProcessBatch, input]);
  
  // Monitor input changes for typing status
  const monitoredHandleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e);
    
    // Update typing status when input content changes
    if (!hasUserPendingMessage) {
      setUserTypingStatus(discordUser, true, e.target.value);
    }
  }, [handleInputChange, discordUser, hasUserPendingMessage, setUserTypingStatus]);
  
  // Handle submitting messages - queue them for batching
  const handleMessageSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || aiLoading || processingBatch) return;
    
    // Add to pending queue
    addPendingMessage(discordUser, input);
    
    // Clear input
    setInput('');
    
    // Check if we should process batch now
    checkAndProcessBatch();
  }, [input, aiLoading, processingBatch, discordUser, addPendingMessage, setInput, checkAndProcessBatch]);
  
  // Process a batch of messages
  const processBatch = useCallback((batch: PendingMessage[]) => {
    if (batch.length === 0) return;
    
    if (batch.length === 1) {
      // If only one message, send it directly
      sendBatchedMessages(batch[0].message, {
        id: batch[0].userId,
        username: batch[0].username,
        avatar: batch[0].avatar
      });
    } else {
      // Combine multiple messages with context
      const combinedMessage = batch.map(msg => 
        `${msg.username}: ${msg.message}`
      ).join('\n\n');
      
      const prompt = `Everyone is contributing ideas to this game. Please consider all these inputs together:\n\n${combinedMessage}\n\nPlease combine these ideas in a creative way to make the best possible game!`;
      
      // Send the combined message but also include the original batch for UI display
      sendBatchedMessages(prompt, undefined, batch);
    }
  }, [sendBatchedMessages]);
  
  // Check for batches that can be processed when typing status changes
  useEffect(() => {
    if (checkAndProcessBatch()) {
      const batch = getAndClearPendingBatch();
      processBatch(batch);
    }
  }, [typingUsers, checkAndProcessBatch, getAndClearPendingBatch, processBatch]);
  
  // Handle saving game to Supabase
  const handleSaveGame = useCallback(async (title: string, description: string) => {
    setIsSaving(true);
    
    try {
      // Check if this is a remix (user doesn't own the game)
      const isRemixing = currentGame && currentGame.author_id !== discordUser.id;
      
      const gameData: Partial<Game> = {
        title: title.trim(),
        description: description.trim(),
        code: currentCode,
        author_id: discordUser.id,
        author_username: discordUser.username,
      };
      
      // Only update if user owns the game, otherwise create a new game (remix)
      if (currentGame?.id && !isRemixing) {
        // Update existing game
        gameData.id = currentGame.id;
        const result = await updateGame(currentGame.id, gameData);
        console.log("Updated game:", result.id);
      } else {
        // Create new game (either new or remix)
        const result = await createGame(gameData);
        console.log(isRemixing ? "Remixed game:" : "Created game:", result.id);
      }
      
      setShowSaveModal(false);
      setCodeChanged(false);
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [currentCode, currentGame, discordUser.id, discordUser.username]);

  // Handle resize functionality
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Limit the chat width between 20% and 80%
    if (newWidth >= 20 && newWidth <= 80) {
      setChatWidth(newWidth);
    }
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Handle library navigation with unsaved changes check
  const handleLibraryNavigation = useCallback(() => {
    console.log("handleLibraryNavigation called, codeChanged:", codeChanged);
    if (codeChanged) {
      // If there are unsaved changes, show the save confirmation
      setShowSaveBeforeExitModal(true);
    } else {
      // If no unsaved changes, go directly to library
      // Clear the synced code state to ensure it reloads from DB next time
      setSyncedCode('');
      onReturnToLibrary();
    }
  }, [codeChanged, onReturnToLibrary, setSyncedCode]);

  // Handle confirmation result
  const handleConfirmAction = useCallback((confirmed: boolean) => {
    setShowConfirmModal(false);
    
    if (confirmed) {
      if (pendingAction === 'library') {
        // Clear the synced code state to ensure it reloads from DB next time
        setSyncedCode('');
        onReturnToLibrary();
        setShowCode(true);
      }
    }
    
    setPendingAction(null);
  }, [pendingAction, onReturnToLibrary, syncedCode]);

  // Effect to reset streaming state if needed
  useEffect(() => {
    // If there's no active streaming message, make sure streaming state is reset
    if (!streamingMessageId) {
      setIsStreamingToEditor(false);
    }
  }, [streamingMessageId]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#28282E]">
      {showCode ? (
        // Code editing mode - show chat and code editor side by side
        <div className="h-full w-full flex overflow-hidden" ref={containerRef}>
          {/* Chat section */}
          <div className="overflow-hidden" style={{ width: `${chatWidth}%` }}>
            <div className="h-full">
              <ChatInterface 
                discordUser={discordUser}
                messages={messages}
                streamingMessageId={streamingMessageId}
                onUpdateEditor={handleEditorUpdate}
                onExampleSelect={handleExampleSelect}
              />
            </div>
          </div>
          
          {/* Resize handle */}
          <div 
            ref={resizeDivRef}
            className="w-1 h-full bg-[#1e1e24] hover:bg-indigo-500 cursor-col-resize"
            onMouseDown={handleResizeStart}
          />
          
          {/* Code editor section */}
          <div className="flex flex-col overflow-hidden" style={{ width: `${100 - chatWidth}%` }}>
            <div className="flex justify-between items-center p-2 bg-[#222226] border-b border-[#1e1e24]">
              <h2 className="text-white text-lg font-semibold">
                {currentGame ? currentGame.title : 'Untitled Game'}
              </h2>
            </div>
            <div className="flex-grow overflow-auto">
              <CodeEditor
                ref={codeEditorRef}
                initialCode={editedCode}
                onChange={handleCodeChange}
                onApply={codeChanged ? handleApplyCode : undefined}
                height="100%"
                isStreaming={isStreamingToEditor}
              />
            </div>
          </div>
        </div>
      ) : (
        // Game view mode - show only the game canvas with minimal controls
        <div className="h-full w-full flex flex-col">
          <div className="flex justify-between items-center p-2 bg-[#222226] border-b border-[#1e1e24]">
            <h2 className="text-white text-lg font-semibold">
              {currentGame ? currentGame.title : 'Untitled Game'}
            </h2>
          </div>
          <div className="flex-grow">
            <P5Sketch 
              sketch={currentCode} 
              key={`sketch-${restartCounter}`}
            />
          </div>
        </div>
      )}
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-4 z-50">
        {/* Play/Edit Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md ${
            // Don't change button color during streaming
            isStreamingToEditor
              ? 'bg-[#5865F2]/80 hover:bg-[#4752C4]/80 cursor-not-allowed'
              : codeChanged && showCode 
                ? 'bg-green-500/80 hover:bg-green-600/80' 
                : 'bg-[#5865F2]/80 hover:bg-[#4752C4]/80'
          }`}
          onClick={() => {
            // Disable button functionality during streaming
            if (isStreamingToEditor) return;
            
            if (showCode && codeChanged) {
              // If in code mode with changes, apply code and switch to play mode
              try {
                handleApplyCode();
              } catch (error) {
                console.error('Error applying code:', error);
              }
            }
            setShowCode(!showCode);
          }}
        >
          <FontAwesomeIcon 
            icon={showCode ? faPlay : faCode} 
            className={`text-white text-xl ${isStreamingToEditor ? 'opacity-50' : ''}`} 
          />
        </motion.button>

        {/* Library/Save Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 rounded-full bg-[#36373D]/80 hover:bg-[#424349]/80 flex items-center justify-center shadow-lg backdrop-blur-md"
          onClick={() => {
            // Show the combined save/exit modal
            setShowSaveBeforeExitModal(true);
          }}
        >
          <FontAwesomeIcon 
            icon={faBookOpen} 
            className="text-white text-xl" 
          />
        </motion.button>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveBeforeExitModal && (
        <div 
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            // Close the modal when clicking the backdrop (outside the modal)
            if (e.target === e.currentTarget) {
              setShowSaveBeforeExitModal(false);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-b from-[#2a2a30] to-[#222226] rounded-xl w-full max-w-md p-6 text-white shadow-xl border border-[#1e1e24]"
            // Prevent clicks inside the modal from closing it
            onClick={(e) => e.stopPropagation()}
          >
            {/* Check if current user owns the game */}
            {!currentGame || currentGame.author_id === discordUser.id ? (
              // User owns the game or it's a new game - normal save flow
              <>
                <h3 className="text-xl font-bold mb-4">Save Your Game?</h3>
                <p className="mb-4">Would you like to save your game before returning to the library?</p>
              </>
            ) : (
              // User doesn't own the game - remix flow
              <>
                <h3 className="text-xl font-bold mb-4">Remix This Game?</h3>
                <p className="mb-4">
                  This game was created by {currentGame.author_username}. 
                  Would you like to create your own copy of this game before returning to the library?
                </p>
              </>
            )}
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const titleInput = form.elements.namedItem('title') as HTMLInputElement;
              const descriptionInput = form.elements.namedItem('description') as HTMLTextAreaElement;
              
              // Always create a new game when remixing someone else's game
              const isRemixing = currentGame && currentGame.author_id !== discordUser.id;
              
              // Prepare the game data
              const gameData: Partial<Game> = {
                title: titleInput.value.trim(),
                description: descriptionInput.value.trim(),
                code: currentCode,
                author_id: discordUser.id,
                author_username: discordUser.username,
              };
              
              // Only include the ID if updating own game, not when remixing
              if (currentGame?.id && !isRemixing) {
                gameData.id = currentGame.id;
              }
              
              // Handle the save/remix action
              handleSaveGame(titleInput.value, descriptionInput.value)
                .then(() => {
                  setShowSaveBeforeExitModal(false);
                  onReturnToLibrary();
                })
                .catch(error => {
                  console.error("Error saving game:", error);
                });
            }}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-1 text-[#B9BBBE]">
                  Game Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={currentGame ? (currentGame.author_id !== discordUser.id ? `${currentGame.title} (Remix)` : currentGame.title) : ''}
                  className="w-full bg-[#36373D]/50 border border-[#202225] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-[#5865F2] transition-all"
                  placeholder="Enter a title for your game"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium mb-1 text-[#B9BBBE]">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={currentGame?.description || ''}
                  className="w-full bg-[#36373D]/50 border border-[#202225] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-[#5865F2] transition-all min-h-[100px] resize-none"
                  placeholder="Describe your game (optional)"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="px-4 py-2 bg-[#ED4245]/80 hover:bg-[#ED4245] rounded-lg"
                  onClick={() => {
                    setShowSaveBeforeExitModal(false);
                    // Clear the synced code state to ensure it reloads from DB next time
                    setSyncedCode('');
                    onReturnToLibrary();
                  }}
                >
                  Leave Without Saving
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-4 py-2 bg-[#5865F2]/80 hover:bg-[#5865F2] rounded-lg flex items-center"
                >
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {!currentGame || currentGame.author_id === discordUser.id ? 'Save & Exit' : 'Remix & Exit'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* Floating chat input */}
      {showCode && !showSaveBeforeExitModal && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-1/2 min-w-[300px] max-w-[600px]">
          {/* Position the typing indicator directly above the chat input */}
          <div className="absolute -top-10 left-4">
            <TypingIndicator typingUsers={typingUsers} />
          </div>
          
          {/* Show pending messages */}
          {!processingBatch && (
            <PendingMessagesIndicator 
              pendingMessages={[...userPendingMessages, ...otherPendingMessages]} 
            />
          )}
          
          <ChatInputBar
            input={input}
            isLoading={aiLoading || processingBatch}
            waitingForOthers={typingUsers.length > 0}
            hasPendingMessages={hasUserPendingMessage}
            onInputChange={monitoredHandleInputChange}
            onSubmit={handleMessageSubmit}
            onFocusChange={handleFocusChange}
          />
        </div>
      )}
    </div>
  );
}