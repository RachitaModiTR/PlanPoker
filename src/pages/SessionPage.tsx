import React, { useEffect, useState } from 'react';
import { AppLayout } from '../layout/AppLayout';
import { ParticipantsPanel } from '../components/ParticipantsPanel';
import { WorkItemPanel } from '../components/WorkItemPanel';
import { PokerBoard } from '../components/PokerBoard';
import { SessionControls } from '../components/SessionControls';
import { ResultsPanel } from '../components/ResultsPanel';
import { JoinScreen } from '../components/JoinScreen';
import { useSessionStore } from '../store/sessionStore';
import { useSocket } from '../hooks/useSocket';
import { VoteValue, JobRole } from '../types/domain';
import { STORAGE_KEY } from '../constants';

// Hardcoded for demo purposes; normally from URL params
const DEMO_SESSION_ID = 'demo-123';

export const SessionPage: React.FC = () => {
  const { session, currentUser, joinSession, castVote } = useSessionStore();
  const [selectedCard, setSelectedCard] = useState<VoteValue>(null);
  const [isJoinScreenVisible, setIsJoinScreenVisible] = useState(true);

  // Check for persisted user on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      joinSession(user, DEMO_SESSION_ID);
      setIsJoinScreenVisible(false);
    }
  }, [joinSession]);

  const handleJoin = (name: string, jobRole: JobRole) => {
    const randomId = Math.floor(Math.random() * 10000);
    const newUser = { 
      id: `user-${randomId}`, 
      name: name, 
      avatarUrl: '',
      jobRole: jobRole
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    joinSession(newUser, DEMO_SESSION_ID);
    setIsJoinScreenVisible(false);
  };

  // Connect Socket (Only when currentUser is set)
  const { isConnected, socketService } = useSocket(DEMO_SESSION_ID, currentUser);

  const handleVote = (value: VoteValue) => {
    const newValue = selectedCard === value ? null : value;
    setSelectedCard(newValue);
    castVote(newValue);
    socketService.send('cast_vote', { userId: currentUser?.id, value: newValue });
  };

  // Reset local selection when session phase changes to voting (new round)
  useEffect(() => {
    if (session?.phase === 'voting' && !session.participants.find(p => p.id === currentUser?.id)?.hasVoted) {
      setSelectedCard(null);
    }
  }, [session?.phase, session?.participants, currentUser?.id]);

  // Show Join Screen if no user
  if (isJoinScreenVisible) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-400">
        Loading Session...
      </div>
    );
  }

  const isVoting = session.phase === 'voting';
  const showResults = session.phase === 'revealing' || session.phase === 'results';
  const myRole = session.participants.find(p => p.id === currentUser?.id)?.role;

  return (
    <AppLayout 
      sessionCode={session.id} 
      userRole={myRole}
      userName={currentUser?.name}
      sidebar={<ParticipantsPanel />}
    >
      <div className="space-y-6">
        <WorkItemPanel />
        
        <SessionControls />

        {isVoting && myRole !== 'observer' && (
          <div className="animate-in fade-in duration-500">
            <PokerBoard 
              selectedValue={selectedCard} 
              onVote={handleVote} 
              disabled={!isConnected}
            />
            {!isConnected && (
               <p className="text-center text-red-400 text-sm mt-2">
                 Disconnected. Reconnecting...
               </p>
            )}
          </div>
        )}

        {showResults && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <ResultsPanel />
          </div>
        )}
      </div>
    </AppLayout>
  );
};
