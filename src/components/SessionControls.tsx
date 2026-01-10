import React from 'react';
import { useSessionStore } from '../store/sessionStore';
import { socketService } from '../services/socketService';

export const SessionControls: React.FC = () => {
  const { currentUser, session } = useSessionStore();

  if (!session || !currentUser) return null;

  const myParticipant = session.participants.find(p => p.id === currentUser.id);
  const isModerator = currentUser.id === session.moderatorId || myParticipant?.role === 'moderator' || true; 
  // Note: '|| true' is temporary to allow testing as any user since we mock user ID. 
  // In real app, remove '|| true'.
  
  if (!isModerator) return null;

  const handleReveal = () => {
    socketService.send('reveal_votes', {});
  };

  const handleClear = () => {
    socketService.send('clear_votes', {});
  };

  const isVoting = session.phase === 'voting';
  const isRevealed = session.phase === 'revealing' || session.phase === 'results';
  
  // Disable reveal if no one has voted yet? Or allow it anyway? 
  // Let's allow it but maybe style differently if empty.
  const hasVotes = session.participants.some(p => p.hasVoted);

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 items-center justify-between shadow-sm">
      <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        Moderator Controls
      </div>
      
      <div className="flex gap-3">
        {isVoting && (
          <button
            onClick={handleReveal}
            disabled={!hasVotes}
            className={`px-4 py-2 rounded font-semibold text-white transition-colors
              ${hasVotes 
                ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
            `}
          >
            Reveal Votes
          </button>
        )}

        {(isRevealed) && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded font-semibold transition-colors border border-gray-600"
          >
            Start New Round
          </button>
        )}
        
        {/* 'Restart Voting' can be same as 'Start New Round' or a specific reset for current item without changing item */}
        {isVoting && hasVotes && (
           <button
             onClick={handleClear}
             className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded font-medium transition-colors text-sm"
           >
             Reset Round
           </button>
        )}
      </div>
    </div>
  );
};

