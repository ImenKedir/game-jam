import type { RoboRequest } from '@robojs/server'
import { RoboResponse } from '@robojs/server'
import { getSupabaseClient, Game } from '../utils/supabaseClient';

export default async (request: RoboRequest) => {
  // Handle different HTTP methods
  const method = request.method.toUpperCase();
  
  try {
    // GET request - fetch games
    if (method === 'GET') {
      // Get authorId from query parameters
      const url = new URL(request.url);
      const authorId = url.searchParams.get('authorId');
      const supabase = getSupabaseClient();
      
      if (!authorId) {
        return RoboResponse.json({ error: 'Author ID is required' }, { status: 400 });
      }
      
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('author_id', authorId)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        return RoboResponse.json({ games: data });
      } catch (error) {
        console.error('Error fetching games:', error);
        return RoboResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
      }
    }
    
    // POST request - create a new game
    if (method === 'POST') {
      const supabase = getSupabaseClient();
      
      try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.title || !body.code || !body.author_id || !body.author_username) {
          return RoboResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        const game: Game = {
          title: body.title,
          description: body.description || '',
          code: body.code,
          author_id: body.author_id,
          author_username: body.author_username,
        };
        
        const { data, error } = await supabase
          .from('games')
          .insert([game])
          .select()
          .single();
        
        if (error) throw error;
        
        return RoboResponse.json({ game: data });
      } catch (error) {
        console.error('Error creating game:', error);
        return RoboResponse.json({ error: 'Failed to create game' }, { status: 500 });
      }
    }
    
    // Method not allowed
    return RoboResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error in games API:', error);
    return RoboResponse.json({ error: 'An error occurred during the request' }, { status: 500 });
  }
} 