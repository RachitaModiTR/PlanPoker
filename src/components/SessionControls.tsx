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

  const handleResetSession = () => {
    if (window.confirm('Are you sure you want to reset the entire session? This will clear all votes and estimates.')) {
      socketService.send('reset_session', {});
    }
  };

  const isVoting = session.phase === 'voting';
  const isRevealed = session.phase === 'revealing' || session.phase === 'results';
  
  // Disable reveal if no one has voted yet? Or allow it anyway? 
  // Let's allow it but maybe style differently if empty.
  const hasVotes = session.participants.some(p => p.hasVoted);

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-pastel-surface rounded-lg border border-pastel-border items-center justify-between shadow-sm">
      <div className="text-sm font-medium text-pastel-muted uppercase tracking-wider">
        Moderator Controls
      </div>
      
      <div className="flex gap-3">
        {isVoting && (
          <button
            onClick={handleReveal}
            disabled={!hasVotes}
            className={`px-4 py-2 rounded font-semibold text-white transition-colors
              ${hasVotes 
                ? 'bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-200' 
                : 'bg-slate-300 text-slate-100 cursor-not-allowed'}
            `}
          >
            Reveal Votes
          </button>
        )}

        {(isRevealed) && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-pastel-surface hover:bg-pastel-bg text-pastel-text rounded font-semibold transition-colors border border-pastel-border shadow-sm"
          >
            Start New Round
          </button>
        )}
        
        {/* 'Restart Voting' can be same as 'Start New Round' or a specific reset for current item without changing item */}
        {isVoting && hasVotes && (
           <button
             onClick={handleClear}
             className="px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded font-medium transition-colors text-sm"
           >
             Reset Round
           </button>
        )}
        
        <button
          onClick={handleResetSession}
          className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded font-medium transition-colors text-sm ml-2"
          title="Clears all estimates and votes"
        >
          Reset Session
        </button>
      </div>
    </div>
  );
};

