import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingUser {
  id: string;
  username: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      <AnimatePresence>
        {typingUsers.map((user) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
            title={`${user.username} is typing...`}
          >
            <img
              src={user.avatar 
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`
              }
              alt={`${user.username} is typing`}
              className="w-8 h-8 rounded-full border-2 border-[#28282E]"
              onError={(e) => {
                e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
              }}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#5865F2] rounded-full border border-[#28282E]">
              <motion.div
                className="typing-dot"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 