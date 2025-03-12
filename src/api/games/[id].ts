import type { RoboRequest } from '@robojs/server'
import { RoboResponse } from '@robojs/server'
import { getSupabaseClient } from '../../utils/supabaseClient';

export default async (request: RoboRequest) => {
  // Get the game ID from the URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  const method = request.method.toUpperCase();
  const supabase = getSupabaseClient();
  
  try {
    // GET request - fetch a specific game
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        return RoboResponse.json({ error: 'Game not found' }, { status: 404 });
      }
      
      return RoboResponse.json({ game: data });
    }
    
    // PATCH request - update a game
    if (method === 'PATCH') {
      const body = await request.json();
      
      const { data, error } = await supabase
        .from('games')
        .update(body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return RoboResponse.json({ game: data });
    }
    
    // DELETE request - delete a game
    if (method === 'DELETE') {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return RoboResponse.json({ success: true });
    }
    
    // Method not allowed
    return RoboResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error(`Error handling game ID ${id}:`, error);
    return RoboResponse.json({ error: 'An error occurred during the request' }, { status: 500 });
  }
} 