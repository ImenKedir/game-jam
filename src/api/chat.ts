import { streamText } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { anthropic } from '@ai-sdk/anthropic';
import { createSystemPrompt } from '../utils/prompt';

import { RoboResponse } from '@robojs/server'
import type { RoboRequest } from '@robojs/server'

export default async (request: RoboRequest) => {
  try {
    // Extract the messages from the body of the request
    const { messages, codeState } = await request.json();

    // Get system prompt from the imported function
    const systemPrompt = createSystemPrompt(codeState);

    try {
      // Set up streaming response with optimized settings
      const result = streamText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        messages: messages.slice(-3),
        system: systemPrompt,
        temperature: 0.7,
        maxTokens: 16000
      });
      
      // Log that stream is ready
      console.log('Stream initialized, preparing response');
      
      // Return the stream response with optimized headers
      return result.toTextStreamResponse({
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=6000', // 10 minutes
          'X-Accel-Buffering': 'no', // Prevents proxy buffering
          'Transfer-Encoding': 'chunked'
        }
      });
    } catch (streamError) {
      console.error('Error in stream setup:', streamError);
      return RoboResponse.json(
        { error: 'An error occurred during stream setup' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    return RoboResponse.json(
      { error: 'An error occurred during the request' },
      { status: 500 }
    );
  }
}