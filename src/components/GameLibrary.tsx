import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faGamepad, faClock, faUser, faChevronDown, faChevronRight, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Game } from '../utils/supabaseClient';

// Define the active player type
interface ActivePlayer {
  id: string;
  username: string;
  avatar?: string;
  gameId: string;
}

interface GameLibraryProps {
  userId: string;
  username: string;
  onSelectGame: (game: Game) => void;
  onCreateNew: () => void;
  onDeleteGame: (gameId: string) => Promise<void>;
  games: Game[];
  isLoading: boolean;
  activePlayers?: ActivePlayer[]; // This is optional to avoid breaking existing code
}

const GameLibrary: React.FC<GameLibraryProps> = ({ 
  userId, 
  username, 
  onSelectGame, 
  onCreateNew, 
  onDeleteGame, 
  games, 
  isLoading,
  activePlayers = [] // Default to empty array if not provided
}) => {
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<{[username: string]: boolean}>({});
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Add effect to auto-expand all sections when searching
  useEffect(() => {
    // Always keep all user sections expanded regardless of search state
    const usernames = [...new Set(games.map(game => game.author_username || 'Unknown User'))];
    const allExpanded = usernames.reduce((acc, username) => {
      acc[username] = true;
      return acc;
    }, {} as {[username: string]: boolean});
    
    setExpandedUsers(allExpanded);
  }, [searchTerm, games, username]);

  // Update filtered games when games prop changes or search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Ensure we have no duplicates in filtered games
      const uniqueGames = removeDuplicateGames(games);
      setFilteredGames(uniqueGames);
    } else {
      // Filter without duplicates
      const uniqueGames = removeDuplicateGames(games);
      const filtered = uniqueGames.filter(
        game => 
          game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGames(filtered);
    }
  }, [searchTerm, games]);

  // Helper function to remove duplicate games based on ID
  const removeDuplicateGames = (gamesList: Game[]): Game[] => {
    const uniqueGamesMap = new Map<string, Game>();
    
    // Keep only the last occurrence of each game ID
    gamesList.forEach(game => {
      if (game.id) {
        uniqueGamesMap.set(game.id, game);
      }
    });
    
    return Array.from(uniqueGamesMap.values());
  };

  // Group games by user for rendering
  const groupGamesByUser = (games: Game[]) => {
    const grouped: Record<string, Game[]> = {};
    
    games.forEach(game => {
      const authorUsername = game.author_username || 'Unknown User';
      if (!grouped[authorUsername]) {
        grouped[authorUsername] = [];
        // Always set new users to expanded state by default
        if (!expandedUsers.hasOwnProperty(authorUsername)) {
          setExpandedUsers(prev => ({
            ...prev,
            [authorUsername]: true
          }));
        }
      }
      grouped[authorUsername].push(game);
    });
    
    return grouped;
  };

  const toggleUserExpanded = (username: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation(); // Prevent card click from triggering
    setGameToDelete(game);
    setShowDeleteConfirm(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (gameToDelete?.id) {
      await onDeleteGame(gameToDelete.id);
      setShowDeleteConfirm(false);
      setGameToDelete(null);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setGameToDelete(null);
  };

  // Helper function to get active players for a specific game
  const getActivePlayersForGame = (gameId?: string): ActivePlayer[] => {
    if (!gameId) return [];
    return activePlayers.filter(player => player.gameId === gameId);
  };

  // Group games by user for UI rendering 
  const gamesByUser = groupGamesByUser(filteredGames);

  return (
    <div className="w-full h-full flex flex-col bg-[#28282E] text-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          <FontAwesomeIcon icon={faGamepad} className="mr-2" />
          My Game Library
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-lg flex items-center"
          onClick={onCreateNew}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Create New Game
        </motion.button>
      </div>

      <div className="relative mb-6">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#72767D]" />
        <input
          type="text"
          placeholder="Search games by title or description..."
          className="w-full bg-[#36373D] text-[#DCDDDE] border border-[#202225] rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865F2]"></div>
        </div>
      ) : error ? (
        <div className="text-[#ED4245] text-center p-4 bg-[#ED4245]/10 rounded-lg">
          {error}
        </div>
      ) : Object.keys(gamesByUser).length === 0 ? (
        <div className="text-center p-8 bg-[#2F3136] rounded-lg">
          {searchTerm ? (
            <p>No games found matching "{searchTerm}"</p>
          ) : (
            <div>
              <p className="mb-4">You haven't created any games yet.</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 rounded-lg"
                onClick={onCreateNew}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Your First Game
              </motion.button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-y-auto">
          {Object.entries(gamesByUser).map(([authorUsername, authorGames]) => (
            <div key={authorUsername} className="mb-6">
              <div 
                className="flex items-center bg-[#202225] p-3 rounded-t-lg cursor-pointer"
                onClick={() => toggleUserExpanded(authorUsername)}
              >
                <FontAwesomeIcon 
                  icon={expandedUsers[authorUsername] ? faChevronDown : faChevronRight} 
                  className="mr-3 text-[#5865F2]" 
                />
                <FontAwesomeIcon icon={faUser} className="mr-2 text-[#5865F2]" />
                <span className="font-bold">
                  {authorUsername} 
                  {authorUsername === username ? " (You)" : ""}
                </span>
                <span className="ml-2 text-sm text-[#B9BBBE]">
                  ({authorGames.length} {authorGames.length === 1 ? 'game' : 'games'})
                </span>
              </div>
              
              {expandedUsers[authorUsername] && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-3 bg-[#2F3136] rounded-b-lg">
                  {authorGames.map((game) => (
                    <motion.div
                      key={game.id}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 8px 15px -5px rgba(88, 101, 242, 0.2)"
                      }}
                      transition={{ duration: 0.2 }}
                      className="bg-gradient-to-br from-[#2F3136] to-[#36373D] rounded-lg overflow-hidden cursor-pointer border border-[#202225] hover:border-[#5865F2] transition-all shadow-md flex flex-col h-64 relative group"
                      onClick={() => onSelectGame(game)}
                    >
                      {/* Delete button - only show for the user's own games and only on hover */}
                      {game.author_username === username && (
                        <button
                          className="absolute top-2 right-2 z-10 bg-[#2F3136]/80 hover:bg-[#ED4245]/80 text-[#B9BBBE] hover:text-white w-8 h-8 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-[#202225] flex items-center justify-center"
                          onClick={(e) => handleDeleteClick(e, game)}
                          title="Delete game"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        </button>
                      )}
                      <div className="h-24 bg-[#5865F2]/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/20 to-[#7289DA]/20 flex items-center justify-center">
                          <FontAwesomeIcon icon={faGamepad} className="text-3xl text-white/30" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#36373D] to-transparent h-12"></div>
                        
                        {/* Active players indicator */}
                        {getActivePlayersForGame(game.id).length > 0 && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className="flex -space-x-2">
                              <AnimatePresence>
                                {getActivePlayersForGame(game.id).slice(0, 3).map((player) => (
                                  <motion.div
                                    key={`${game.id}-${player.id}`}
                                    initial={{ scale: 0, y: 10, opacity: 0 }}
                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                    exit={{ scale: 0, y: 10, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="relative"
                                    title={`${player.username} is playing this game`}
                                  >
                                    <img
                                      src={player.avatar 
                                        ? `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png`
                                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(player.id) % 5}.png`
                                      }
                                      alt={`${player.username} is playing`}
                                      className="w-7 h-7 rounded-full border-2 border-[#28282E]"
                                      onError={(e) => {
                                        e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(player.id) % 5}.png`;
                                      }}
                                    />
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#43B581] rounded-full border border-[#28282E]" />
                                  </motion.div>
                                ))}
                                {getActivePlayersForGame(game.id).length > 3 && (
                                  <motion.div
                                    key={`${game.id}-more`}
                                    initial={{ scale: 0, y: 10, opacity: 0 }}
                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                    className="w-7 h-7 rounded-full bg-[#36373D] border-2 border-[#28282E] flex items-center justify-center text-xs text-white"
                                    title={`${getActivePlayersForGame(game.id).length - 3} more players`}
                                  >
                                    +{getActivePlayersForGame(game.id).length - 3}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold mb-1 text-white truncate">{game.title}</h3>
                        <p className="text-[#B9BBBE] text-xs mb-2 line-clamp-2 flex-grow">{game.description || 'No description'}</p>
                        <div className="border-t border-[#202225] pt-2 mt-auto">
                          <div className="flex items-center text-xs text-[#B9BBBE] mb-1">
                            <FontAwesomeIcon icon={faUser} className="mr-1 text-[#5865F2]" />
                            <span className="truncate">{game.author_username}</span>
                          </div>
                          <div className="flex items-center text-xs text-[#B9BBBE]">
                            <FontAwesomeIcon icon={faClock} className="mr-1 text-[#5865F2]" />
                            <span className="truncate">Updated: {formatDate(game.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#36373D] rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4 text-white">Delete Game</h3>
            <p className="text-[#DCDDDE] mb-6">
              Are you sure you want to delete "{gameToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-[#4F545C] hover:bg-[#5D6269] text-white rounded-md transition-colors"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#ED4245] hover:bg-[#F04747] text-white rounded-md transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GameLibrary; 