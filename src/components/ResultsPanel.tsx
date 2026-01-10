import React, { useMemo } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { VoteValue, JobRole } from '../types/domain';
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

    const allVoteEntries: { userId: string; name: string; value: VoteValue; jobRole: JobRole }[] = [];
    
    // Group votes by role
    const devVotes: VoteValue[] = [];
    const qaVotes: VoteValue[] = [];
    const allVotes: VoteValue[] = [];

    Object.values(session.votes).forEach(vote => {
      const participant = session.participants.find(p => p.id === vote.userId);
      const name = participant ? participant.name : 'Unknown';
      const role = participant ? participant.jobRole : 'Developer'; // Default
      
      allVoteEntries.push({ userId: vote.userId, name, value: vote.value, jobRole: role });
      allVotes.push(vote.value);

      if (role === 'Developer') devVotes.push(vote.value);
      if (role === 'QA') qaVotes.push(vote.value);
    });

    if (allVotes.length === 0) return null;

    // Calculate Global Stats
    const globalStats = {
      average: calculateAverage(allVotes),
      median: calculateMedian(allVotes),
      consensus: detectConsensus(allVotes),
      ...detectOutliers(allVotes)
    };

    // Calculate Role Stats
    const devStats = {
      average: calculateAverage(devVotes),
      median: calculateMedian(devVotes),
      consensus: detectConsensus(devVotes),
      count: devVotes.length
    };

    const qaStats = {
      average: calculateAverage(qaVotes),
      median: calculateMedian(qaVotes),
      consensus: detectConsensus(qaVotes),
      count: qaVotes.length
    };

    return {
      allVoteEntries,
      globalStats,
      devStats,
      qaStats
    };
  }, [session]);

  if (!session || (session.phase !== 'revealing' && session.phase !== 'results')) {
    return null;
  }

  if (!results) return null;

  return (
    <div className="w-full bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <span>Results</span>
          {results.globalStats.consensus && (
            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded border border-green-800 uppercase tracking-wider">
              Consensus!
            </span>
          )}
        </h2>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Overall</h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold text-gray-100">{results.globalStats.average ?? '-'}</div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">{results.globalStats.median ?? '-'}</div>
              <div className="text-xs text-gray-500">Median</div>
            </div>
          </div>
        </div>

        {/* Developers */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Developers <span className="text-gray-600">({results.devStats.count})</span>
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-gray-200">{results.devStats.average ?? '-'}</div>
              <div className="text-xs text-gray-500">Avg</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-200">{results.devStats.median ?? '-'}</div>
              <div className="text-xs text-gray-500">Median</div>
            </div>
          </div>
        </div>

        {/* QA */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            QA <span className="text-gray-600">({results.qaStats.count})</span>
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-gray-200">{results.qaStats.average ?? '-'}</div>
              <div className="text-xs text-gray-500">Avg</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-200">{results.qaStats.median ?? '-'}</div>
              <div className="text-xs text-gray-500">Median</div>
            </div>
          </div>
        </div>
      </div>

      {/* Votes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {results.allVoteEntries.map((entry) => {
          const isNumber = typeof entry.value === 'number';
          const isMin = isNumber && entry.value === results.globalStats.min && results.globalStats.min !== results.globalStats.max;
          const isMax = isNumber && entry.value === results.globalStats.max && results.globalStats.min !== results.globalStats.max;
          
          let highlightClass = "bg-gray-700 border-gray-600";
          if (isMin) highlightClass = "bg-yellow-900/30 border-yellow-700/50 text-yellow-200";
          if (isMax) highlightClass = "bg-red-900/30 border-red-700/50 text-red-200";
          if (results.globalStats.consensus) highlightClass = "bg-green-900/30 border-green-700/50 text-green-200";

          return (
            <div 
              key={entry.userId} 
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border ${highlightClass} transition-colors`}
            >
              {/* Role Badge */}
              <span className={`absolute top-1 right-1 text-[0.6rem] px-1.5 py-0.5 rounded font-bold uppercase
                ${entry.jobRole === 'Developer' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                {entry.jobRole === 'Developer' ? 'Dev' : 'QA'}
              </span>

              <div className="text-2xl font-bold mb-1 mt-2">
                {entry.value ?? '-'}
              </div>
              <div className="text-xs text-gray-400 text-center truncate w-full px-1">
                {entry.name}
              </div>
              
              {/* Outlier Labels */}
              {(isMin || isMax) && !results.globalStats.consensus && (
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
