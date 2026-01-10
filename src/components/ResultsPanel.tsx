import React, { useMemo } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { VoteValue } from '../types/domain';
import { 
  calculateAverage, 
  calculateMedian, 
  detectConsensus, 
  detectOutliers 
} from '../utils/estimation';

export const ResultsPanel: React.FC = () => {
  const { session } = useSessionStore();

  const results = useMemo(() => {
    if (!session || !session.votes) return null;

    const allVoteEntries: { userId: string; name: string; value: VoteValue }[] = [];
    const voteValues: VoteValue[] = [];

    // Process votes
    Object.values(session.votes).forEach(vote => {
      const participant = session.participants.find(p => p.id === vote.userId);
      const name = participant ? participant.name : 'Unknown';
      
      allVoteEntries.push({ userId: vote.userId, name, value: vote.value });
      voteValues.push(vote.value);
    });

    if (voteValues.length === 0) return { allVoteEntries, average: null, median: null, consensus: false, min: null, max: null };

    // Use shared utility functions
    const average = calculateAverage(voteValues);
    const median = calculateMedian(voteValues);
    const consensus = detectConsensus(voteValues);
    const { min, max } = detectOutliers(voteValues);

    return {
      allVoteEntries,
      average,
      median,
      consensus,
      min,
      max
    };
  }, [session]);

  if (!session || (session.phase !== 'revealing' && session.phase !== 'results')) {
    return null;
  }

  if (!results) return null;

  return (
    <div className="w-full bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm mt-6">
      <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
        <span>Results</span>
        {results.consensus && (
          <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded border border-green-800 uppercase tracking-wider">
            Consensus!
          </span>
        )}
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Average" value={results.average} />
        <StatCard label="Median" value={results.median} />
        <StatCard label="Votes" value={results.allVoteEntries.filter(v => v.value !== null).length} />
        <StatCard label="Participants" value={session.participants.length} />
      </div>

      {/* Votes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {results.allVoteEntries.map((entry) => {
          const isNumber = typeof entry.value === 'number';
          const isMin = isNumber && entry.value === results.min && results.min !== results.max;
          const isMax = isNumber && entry.value === results.max && results.min !== results.max;
          
          let highlightClass = "bg-gray-700 border-gray-600";
          if (isMin) highlightClass = "bg-yellow-900/30 border-yellow-700/50 text-yellow-200";
          if (isMax) highlightClass = "bg-red-900/30 border-red-700/50 text-red-200";
          if (results.consensus) highlightClass = "bg-green-900/30 border-green-700/50 text-green-200";

          return (
            <div 
              key={entry.userId} 
              className={`flex flex-col items-center justify-center p-3 rounded-lg border ${highlightClass} transition-colors`}
            >
              <div className="text-2xl font-bold mb-1">
                {entry.value ?? '-'}
              </div>
              <div className="text-xs text-gray-400 text-center truncate w-full px-1">
                {entry.name}
              </div>
              
              {/* Labels for outliers */}
              {(isMin || isMax) && !results.consensus && (
                <span className={`text-[0.6rem] uppercase tracking-wider font-bold mt-1 ${isMin ? 'text-yellow-500' : 'text-red-400'}`}>
                  {isMin ? 'Low' : 'High'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex flex-col items-center justify-center">
    <span className="text-2xl font-bold text-gray-100">{value ?? '-'}</span>
    <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
  </div>
);
