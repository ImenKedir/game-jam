import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PendingMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: number;
}

interface PendingMessagesIndicatorProps {
  pendingMessages: PendingMessage[];
}

export const PendingMessagesIndicator: React.FC<PendingMessagesIndicatorProps> = ({ pendingMessages }) => {
  if (pendingMessages.length === 0) return null;

  // Animation variants for floating motion
  const floatingVariants = {
    initial: (i: number) => ({
      x: 0,
      y: 0
    }),
    animate: (i: number) => ({
      x: Math.sin(i * 0.5) * 15,
      y: Math.cos(i * 0.5) * 10,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 2 + i * 0.5,
        ease: "easeInOut"
      }
    })
  };

  return (
    <div className="absolute bottom-20 right-4 flex flex-col items-end space-y-2">
      <div className="bg-[#36373D]/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-[#5865F2] shadow-lg">
        Waiting for others to finish typing...
      </div>
      
      <div className="flex flex-wrap justify-end gap-2 max-w-[200px]">
        <AnimatePresence>
          {pendingMessages.map((msg, index) => (
            <motion.div
              key={msg.id}
              custom={index}
              variants={floatingVariants}
              initial="initial"
              animate="animate"
              exit={{ scale: 0, opacity: 0 }}
              className="relative group"
              title={msg.message}
            >
              {/* Avatar */}
              <img
                src={msg.avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(msg.userId) % 5}.png`}
                alt={`${msg.username}'s message`}
                className="w-10 h-10 rounded-full border-2 border-[#28282E]"
                onError={(e) => {
                  e.currentTarget.src = `https://cdn.discordapp.com/embed/avatars/${parseInt(msg.userId) % 5}.png`;
                }}
              />
              
              {/* Floating preview of message on hover */}
              <div className="absolute bottom-full mb-2 p-2 bg-[#36373D] rounded shadow-lg invisible group-hover:visible 
                             text-xs text-white max-w-[150px] truncate whitespace-normal z-10">
                <div className="font-semibold mb-1">{msg.username}</div>
                <div>{msg.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}; 