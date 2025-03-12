import React, { useState, useEffect } from 'react';
import GameInterface from './GameInterface';
import GameLibrary from './GameLibrary';
import { Game } from '../utils/supabaseClient';
import { getGamesByAuthor, deleteGame } from '../utils/gameService';
import { useSyncState } from '@robojs/sync';

// Define the ActivePlayer type
interface ActivePlayer {
  id: string;
  username: string;
  avatar?: string;
  gameId: string;
}

interface GameContainerProps {
  discordUser: {
    username: string;
    avatar?: string;
    id: string;
    channelName: string;
  };
}

export default function GameContainer({ discordUser }: GameContainerProps) {
  // State to track whether to show the library or the game interface
  const [showLibrary, setShowLibrary] = useState(true);
  
  // State to store the selected game
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // State to store all user games - use RoboJS sync state for shared games
  const [games, setGames] = useSyncState<Game[]>([], ['GameJam-games']);
  
  // State to track active players in each game
  const [activePlayers, setActivePlayers] = useSyncState<ActivePlayer[]>([], ['GameJam-active-players']);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if we've attempted to fetch games
  const [hasFetchedGames, setHasFetchedGames] = useState(false);

  // Fetch user's games on component mount
  useEffect(() => {
    const fetchUserGames = async () => {
      // Don't attempt to fetch if author ID is not available
      if (!discordUser?.id) {
        console.log('Waiting for Discord user ID to be available');
        return;
      }
      
      // Only fetch when we haven't fetched before, or we're specifically returning to the library
      if (hasFetchedGames) {
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching games for user:', discordUser.id);
        const fetchedGames = await getGamesByAuthor(discordUser.id);
        
        // Update games, replacing any existing games with updated versions
        setGames(currentGames => {
          // Create a map from current games for easy lookup
          const currentGamesMap = new Map<string, Game>();
          currentGames.forEach(game => {
            if (game.id) {
              currentGamesMap.set(game.id, game);
            }
          });
          
          // For each fetched game, either add it as new or update existing
          fetchedGames.forEach(fetchedGame => {
            if (fetchedGame.id) {
              currentGamesMap.set(fetchedGame.id, fetchedGame);
            }
          });
          
          // Convert map back to array
          return Array.from(currentGamesMap.values());
        });
        
        setHasFetchedGames(true);
      } catch (error) {
        console.error('Failed to fetch user games:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserGames();
  }, [discordUser?.id, hasFetchedGames, setGames]);

  // Handle selecting a game from the library
  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    console.log("Selected game:", game.id);
    setShowLibrary(false);
    
    // Add the current user to active players for this game
    if (game.id) {
      const newActivePlayer: ActivePlayer = {
        id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
        gameId: game.id
      };
      
      // Add to active players, avoiding duplicates
      setActivePlayers(current => {
        // Remove this user from any other games they might be in
        const filtered = current.filter(player => player.id !== discordUser.id);
        return [...filtered, newActivePlayer];
      });
    }
  };

  // Handle creating a new game
  const handleCreateNew = () => {
    setSelectedGame(null);
    console.log("Created new game");
    setShowLibrary(false);
  };

  // Handle returning to the library
  const handleReturnToLibrary = () => {
    // If the user was in a game, remove them from active players
    if (selectedGame?.id) {
      setActivePlayers(current => 
        current.filter(player => !(player.id === discordUser.id && player.gameId === selectedGame.id))
      );
    }
    
    // Reset the selected game to force reloading from database next time
    setSelectedGame(null);
    setShowLibrary(true);
    
    // When returning to library, refetch games to ensure we have the latest data
    setHasFetchedGames(false);
  };

  // Handle deleting a game
  const handleDeleteGame = async (gameId: string) => {
    if (!gameId) return;
    
    setIsLoading(true);
    try {
      await deleteGame(gameId);
      
      // Remove the deleted game from state
      setGames(currentGames => {
        // Filter out the deleted game
        return currentGames.filter(game => game.id !== gameId);
      });
      console.log("Deleted game:", gameId);
    } catch (error) {
      console.error('Failed to delete game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If Discord user ID is not available, show loading state
  if (!discordUser?.id) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#36393f]">
        <div className="relative z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865F2] mb-4"></div>
            <div className="text-white text-xl">Waiting for Discord user information...</div>
          </div>
        </div>
        {/* Discord-style background with blurred shapes */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-[#5865F2] blur-[80px]"></div>
          <div className="absolute top-[60%] -right-[5%] w-[35%] h-[40%] rounded-full bg-[#5865F2] blur-[80px]"></div>
          <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-[#5865F2] blur-[80px]"></div>
        </div>
      </div>
    );
  }

  // Render either the library or the game interface based on state
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {showLibrary ? (
        <GameLibrary 
          userId={discordUser.id}
          username={discordUser.username}
          onSelectGame={handleSelectGame}
          onCreateNew={handleCreateNew}
          onDeleteGame={handleDeleteGame}
          games={games}
          isLoading={isLoading}
          activePlayers={activePlayers}
        />
      ) : (
        <GameInterface 
          discordUser={discordUser}
          gameId={selectedGame?.id || discordUser.id + Date.now()}
          currentGame={selectedGame}
          onReturnToLibrary={handleReturnToLibrary}
        />
      )}
    </div>
  );
} 