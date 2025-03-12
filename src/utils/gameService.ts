import { Game } from './supabaseClient';

// Get games by author ID
export async function getGamesByAuthor(authorId: string): Promise<Game[]> {
  try {
    const response = await fetch(`/api/games?authorId=${authorId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch games');
    }
    
    const data = await response.json();
    return data.games;
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
}

// Get a specific game by ID
export async function getGameById(id: string): Promise<Game> {
  try {
    const response = await fetch(`/api/games/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch game');
    }
    
    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error('Error fetching game:', error);
    throw error;
  }
}

// Create a new game
export async function createGame(game: Partial<Game>): Promise<Game> {
  try {
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(game),
    });
    
    // Handle non-JSON responses
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('API endpoint not found. Check your server configuration.');
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create game: ${response.status}`);
      } catch (jsonError) {
        // If response is not JSON
        throw new Error(`Failed to create game: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}

// Update an existing game
export async function updateGame(id: string, updates: Partial<Game>): Promise<Game> {
  try {
    const response = await fetch(`/api/games/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update game');
    }
    
    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
}

// Delete a game by ID
export async function deleteGame(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/games/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete game');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
} 