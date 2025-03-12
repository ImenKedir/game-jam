import { useSyncState } from '@robojs/sync';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { PendingMessage } from './useTypingIndicator';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  complete?: boolean;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
  };
  isBatchedMessage?: boolean;
}

export interface CodeArtifact {
  id: string;
  code: string;
}

// Add MessageSender interface
export interface MessageSender {
  id: string;
  username: string;
  avatar?: string;
}

interface UseAIChatOptions {
  onCodeGenerated?: (code: string) => void;
  currentCode?: string;
  onStreamComplete?: () => void;
  dependencies?: string[];
  currentUser?: MessageSender;
}

// Function to extract code from a message with code blocks
function extractCodeFromMessage(message: string): { response: string; code: string | null } {
  const codeBlockRegex = /```(?:js|javascript)\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let modifiedMessage = message;

  // Extract all code blocks
  let match;
  while ((match = codeBlockRegex.exec(message)) !== null) {
    codeBlocks.push(match[1]);
    // Replace code blocks with placeholders in the response
    modifiedMessage = modifiedMessage.replace(match[0], '[Code has been added to the editor]');
  }

  // Return the message without code blocks and the combined code
  const combinedCode = codeBlocks.length > 0 ? codeBlocks.join('\n\n') : null;
  
  // Validate code completeness if there's code
  if (combinedCode) {
    // Check if code has the required structure with closing braces
    const isComplete = 
      combinedCode.includes('return function(p)') && 
      combinedCode.trim().endsWith('}');
      
    // If incomplete, add a console warning
    if (!isComplete) {
      console.warn('Potentially incomplete code detected - missing closing braces');
    }
  }

  return {
    response: modifiedMessage,
    code: combinedCode,
  };
}

export function useAIChat({ onCodeGenerated, currentCode, onStreamComplete, dependencies = [], currentUser }: UseAIChatOptions = {}) {
  // Use RoboJS sync to synchronize chat state and code artifacts across clients
  const [syncMessages, setSyncMessages] = useSyncState([] as Message[], ['GameJam-chat', ...(dependencies || [])]);
  const [codeArtifacts, setCodeArtifacts] = useSyncState([] as CodeArtifact[], ['GameJam-artifacts', ...(dependencies || [])]);
  const [activeArtifactId, setActiveArtifactId] = useSyncState('', ['GameJam-active-artifact', ...(dependencies || [])]);
  const [streamingMessageId, setStreamingMessageId] = useSyncState('', ['GameJam-streaming', ...(dependencies || [])]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const sendMessage = useCallback(
    async (messageText: string, sender?: MessageSender) => {
      if (!messageText.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setInput(''); // Clear input right away

      // Create a placeholder for the streaming response
      const streamingId = Date.now().toString() + '-streaming';
      setStreamingMessageId(streamingId);

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: messageText,
        sender: sender || currentUser // Use provided sender or default to current user
      };

      // Update sync state directly
      const newMessages = [...syncMessages, userMessage];
      setSyncMessages(newMessages);

      const assistantMessage = {
        id: streamingId,
        role: 'assistant' as const,
        content: '',
        complete: false,
      };

      setSyncMessages([...newMessages, assistantMessage]);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5-minute timeout
  
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=600', // 10 minutes
          },
          body: JSON.stringify({
            messages: [
              ...syncMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              // Add the new message to the end of the array
              {
                role: 'user',
                content: messageText
              }
            ],
            codeState: currentCode,
          }),
          signal: controller.signal,
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
  
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to get response reader');
  
        let accumulatedText = '';
        let lastExtractedCode: string | null = null;
        let updateTimeout: NodeJS.Timeout | null = null;
        
        // Fix: Increase the debounce time to reduce UI updates
        const DEBOUNCE_TIME = 0; // set to 0 for instant updates
  
        const updateState = () => {
          const { response, code } = extractCodeFromMessage(accumulatedText);
          
          // Fix: Update directly to syncMessages to avoid React state conflicts
          setSyncMessages((current) => {
            return current.map((msg) =>
              msg.id === streamingId ? { ...msg, content: response } : msg
            );
          });
          
          if (code && code !== lastExtractedCode) {
            lastExtractedCode = code;
            const fixedCode = code.replace(
              /return function\(p\) {\s*return function\(p\) {/,
              'return function(p) {'
            );
            if (onCodeGenerated) onCodeGenerated(fixedCode);
          }
          updateTimeout = null;
        };
  
        while (true) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              if (!accumulatedText.trim()) {
                setSyncMessages((current) =>
                  current.map((msg) =>
                    msg.id === streamingId
                      ? { ...msg, content: 'Stream ended unexpectedly', complete: false }
                      : msg
                  )
                );
              } else {
                // Ensure final update happens
                if (updateTimeout) {
                  clearTimeout(updateTimeout);
                  updateState();
                } else {
                  updateState();
                }
                
                setSyncMessages((current) =>
                  current.map((msg) =>
                    msg.id === streamingId ? { ...msg, complete: true } : msg
                  )
                );
              }
              break;
            }
  
            const chunk = new TextDecoder().decode(value);
            accumulatedText += chunk;
  
            // Fix: Use a longer debounce to avoid too many updates
            if (!updateTimeout) {
              updateTimeout = setTimeout(updateState, DEBOUNCE_TIME);
            }
          } catch (error) {
            console.error('Error reading stream:', error);
            setSyncMessages((current) =>
              current.map((msg) =>
                msg.id === streamingId
                  ? { ...msg, content: `Stream interrupted: ${error instanceof Error ? error.message : 'Unknown error'}`, complete: true }
                  : msg
              )
            );
            break;
          }
        }
  
        setStreamingMessageId('');
        if (onStreamComplete) {
          onStreamComplete();
        }
        
        if (lastExtractedCode) {
          const artifactId = Date.now().toString();
          setCodeArtifacts((current) => [
            ...current,
            { id: artifactId, code: lastExtractedCode || '' },
          ]);
          setActiveArtifactId(artifactId);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setSyncMessages((current) =>
          current.map((msg) =>
            msg.id === streamingId
              ? {
                  ...msg,
                  content: 'Sorry, there was an error processing your request. Please try again.',
                  complete: true,
                }
              : msg
          )
        );
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setStreamingMessageId('');
        
        if (onStreamComplete) {
          onStreamComplete();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [syncMessages, isLoading, currentCode, onCodeGenerated, setSyncMessages, setStreamingMessageId, setCodeArtifacts, setActiveArtifactId, onStreamComplete, currentUser]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  // Add a new method for sending batched messages
  const sendBatchedMessages = useCallback(
    async (messageText: string, sender?: MessageSender, originalBatch?: PendingMessage[]) => {
      if (!messageText.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setInput(''); // Clear input right away

      // Declare streamingId variable here so it's available throughout the function scope
      const streamingId = Date.now().toString() + '-streaming';
      setStreamingMessageId(streamingId);

      // If we have an original batch, add each message individually with proper attribution
      if (originalBatch && originalBatch.length > 1) {
        // Add each user message separately with proper attribution
        const userMessages: Message[] = originalBatch.map(msg => ({
          id: `batch-${Date.now()}-${msg.id}`,
          role: 'user' as const,
          content: msg.message,
          sender: {
            id: msg.userId,
            username: msg.username,
            avatar: msg.avatar
          },
          isBatchedMessage: true
        }));

        // Add all user messages to the chat
        const newMessages = [...syncMessages, ...userMessages];
        setSyncMessages(newMessages);

        const assistantMessage = {
          id: streamingId,
          role: 'assistant' as const,
          content: '',
          complete: false,
        };

        setSyncMessages([...newMessages, assistantMessage]);
      } else {
        // Single message flow - same as before
        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user' as const,
          content: messageText,
          sender: sender || currentUser // Use provided sender or default to current user
        };

        // Update sync state directly
        const newMessages = [...syncMessages, userMessage];
        setSyncMessages(newMessages);

        const assistantMessage = {
          id: streamingId,
          role: 'assistant' as const,
          content: '',
          complete: false,
        };

        setSyncMessages([...newMessages, assistantMessage]);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5-minute timeout
  
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=600', // 10 minutes
          },
          body: JSON.stringify({
            messages: [
              ...syncMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              // Add the new message at the end of the array instead of as a separate field
              {
                role: 'user',
                content: messageText
              }
            ],
            codeState: currentCode,
          }),
          signal: controller.signal,
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }
  
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to get response reader');
  
        let accumulatedText = '';
        let lastExtractedCode: string | null = null;
        let updateTimeout: NodeJS.Timeout | null = null;
        
        // Fix: Increase the debounce time to reduce UI updates
        const DEBOUNCE_TIME = 0; // set to 0 for instant updates
  
        const updateState = () => {
          const { response, code } = extractCodeFromMessage(accumulatedText);
          
          // Fix: Update directly to syncMessages to avoid React state conflicts
          setSyncMessages((current) => {
            return current.map((msg) =>
              msg.id === streamingId ? { ...msg, content: response } : msg
            );
          });
          
          if (code && code !== lastExtractedCode) {
            lastExtractedCode = code;
            const fixedCode = code.replace(
              /return function\(p\) {\s*return function\(p\) {/,
              'return function(p) {'
            );
            if (onCodeGenerated) onCodeGenerated(fixedCode);
          }
          updateTimeout = null;
        };
  
        while (true) {
          try {
            const { done, value } = await reader.read();
            if (done) {
              if (!accumulatedText.trim()) {
                setSyncMessages((current) =>
                  current.map((msg) =>
                    msg.id === streamingId
                      ? { ...msg, content: 'Stream ended unexpectedly', complete: false }
                      : msg
                  )
                );
              } else {
                // Ensure final update happens
                if (updateTimeout) {
                  clearTimeout(updateTimeout);
                  updateState();
                } else {
                  updateState();
                }
                
                setSyncMessages((current) =>
                  current.map((msg) =>
                    msg.id === streamingId ? { ...msg, complete: true } : msg
                  )
                );
              }
              break;
            }
  
            const chunk = new TextDecoder().decode(value);
            accumulatedText += chunk;
  
            // Fix: Use a longer debounce to avoid too many updates
            if (!updateTimeout) {
              updateTimeout = setTimeout(updateState, DEBOUNCE_TIME);
            }
          } catch (error) {
            console.error('Error reading stream:', error);
            setSyncMessages((current) =>
              current.map((msg) =>
                msg.id === streamingId
                  ? { ...msg, content: `Stream interrupted: ${error instanceof Error ? error.message : 'Unknown error'}`, complete: true }
                  : msg
              )
            );
            break;
          }
        }
  
        setStreamingMessageId('');
        if (onStreamComplete) {
          onStreamComplete();
        }
        
        if (lastExtractedCode) {
          const artifactId = Date.now().toString();
          setCodeArtifacts((current) => [
            ...current,
            { id: artifactId, code: lastExtractedCode || '' },
          ]);
          setActiveArtifactId(artifactId);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setSyncMessages((current) =>
          current.map((msg) =>
            msg.id === streamingId
              ? {
                  ...msg,
                  content: 'Sorry, there was an error processing your request. Please try again.',
                  complete: true,
                }
              : msg
          )
        );
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setStreamingMessageId('');
        
        if (onStreamComplete) {
          onStreamComplete();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [syncMessages, isLoading, currentCode, onCodeGenerated, setSyncMessages, setStreamingMessageId, setCodeArtifacts, setActiveArtifactId, onStreamComplete, currentUser]
  );

  return {
    messages: syncMessages,
    input,
    isLoading,
    streamingMessageId,
    error,
    handleInputChange,
    handleSubmit,
    sendMessage,
    sendBatchedMessages,
    setInput
  };
}