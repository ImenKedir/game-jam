import { useCallback, useState, useEffect } from 'react';
import { useSyncState } from '@robojs/sync';

interface TypingUser {
  id: string;
  username: string;
  avatar?: string;
  timestamp: number;
}

export interface PendingMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: number;
}

export function useTypingIndicator(currentUserId: string, dependencies: string[]) {
  // Use RoboJS sync to share typing and pending message state across clients
  const [typingUsers, setTypingUsers] = useSyncState<TypingUser[]>([], ['GameJam-typing-users', ...dependencies]);
  const [pendingMessages, setPendingMessages] = useSyncState<PendingMessage[]>([], ['GameJam-pending-messages', ...dependencies]);
  const [batchInProgress, setBatchInProgress] = useSyncState(false, ['GameJam-batch-in-progress', ...dependencies]);
  const [processingBatch, setProcessingBatch] = useState(false);
  
  // Local state to track if current user has pending message
  const [hasUserPendingMessage, setHasUserPendingMessage] = useState(false);
  
  // Update local pending state when sync state changes
  useEffect(() => {
    setHasUserPendingMessage(pendingMessages.some(msg => msg.userId === currentUserId));
  }, [pendingMessages, currentUserId]);
  
  // Set the current user's typing status based on focus and input content
  const setUserTypingStatus = useCallback((
    user: { id: string; username: string; avatar?: string },
    isFocused: boolean,
    inputContent: string = ""
  ) => {
    if (!user?.id) return;
    
    // Don't add to typing if user has pending message
    if (pendingMessages.some(msg => msg.userId === user.id)) {
      return;
    }
    
    // Consider user typing if focused OR has text content
    const isTyping = isFocused || inputContent.trim().length > 0;
    
    setTypingUsers(current => {
      // Find if this user is already in the typing list
      const index = current.findIndex(u => u.id === user.id);
      
      if (isTyping) {
        // Add or update user as typing
        if (index >= 0) {
          // Update existing user timestamp
          return [
            ...current.slice(0, index),
            { ...current[index], timestamp: Date.now() },
            ...current.slice(index + 1)
          ];
        } else {
          // Add new typing user
          return [...current, { ...user, timestamp: Date.now() }];
        }
      } else {
        // Remove user from typing list
        if (index >= 0) {
          return [
            ...current.slice(0, index),
            ...current.slice(index + 1)
          ];
        }
        return current;
      }
    });
  }, [pendingMessages, setTypingUsers]);
  
  // Add a message to the pending queue
  const addPendingMessage = useCallback((
    user: { id: string; username: string; avatar?: string },
    message: string
  ) => {
    if (!user?.id || !message.trim()) return false;
    
    // Always add to pending queue in the new flow
    setPendingMessages(current => [
      ...current,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        message,
        timestamp: Date.now()
      }
    ]);
    
    // Remove this user from typing list since they've submitted a message
    setTypingUsers(current => current.filter(u => u.id !== user.id));
    
    // Immediately check if we should process the batch
    setTimeout(() => {
      checkAndProcessBatch();
    }, 100);
    
    // Return true to indicate the message was queued
    return true;
  }, [setTypingUsers, setPendingMessages]);
  
  // Check if we should process the batch now
  const checkAndProcessBatch = useCallback(() => {
    // If no one is typing and we have pending messages, we should process
    if (typingUsers.length === 0 && pendingMessages.length > 0 && !batchInProgress) {
      setBatchInProgress(true);
      setProcessingBatch(true);
      // Return true to indicate a batch should be processed
      return true;
    }
    return false;
  }, [typingUsers, pendingMessages, batchInProgress, setBatchInProgress]);
  
  // Get the pending messages batch and clear it
  const getAndClearPendingBatch = useCallback(() => {
    const batch = [...pendingMessages];
    setPendingMessages([]);
    setBatchInProgress(false);
    // Keep processingBatch true until AI responds
    return batch;
  }, [pendingMessages, setPendingMessages, setBatchInProgress]);
  
  // Reset processing state (call when AI response is complete)
  const resetBatchProcessing = useCallback(() => {
    setProcessingBatch(false);
  }, []);
  
  // Filter out the current user from the typing list
  const filteredTypingUsers = typingUsers.filter(user => user.id !== currentUserId);
  
  // Get pending messages for the current user
  const userPendingMessages = pendingMessages.filter(msg => msg.userId === currentUserId);
  
  // Get pending messages from other users
  const otherPendingMessages = pendingMessages.filter(msg => msg.userId !== currentUserId);
  
  return {
    typingUsers: filteredTypingUsers,
    pendingMessages: pendingMessages,
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
  };
} 