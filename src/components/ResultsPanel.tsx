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
    <div className="w-full bg-pastel-surface rounded-lg p-6 border border-pastel-border shadow-sm mt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-pastel-text flex items-center gap-2">
          <span>Results</span>
          {results.globalStats.consensus && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded border border-green-200 uppercase tracking-wider">
              Consensus!
            </span>
          )}
        </h2>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall */}
        <div className="bg-pastel-bg p-4 rounded-lg border border-pastel-border">
          <h3 className="text-sm font-semibold text-pastel-muted uppercase tracking-wider mb-3">Overall</h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold text-pastel-text">{results.globalStats.average ?? '-'}</div>
              <div className="text-xs text-pastel-muted">Average</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-500">{results.globalStats.median ?? '-'}</div>
              <div className="text-xs text-pastel-muted">Median</div>
            </div>
          </div>
        </div>

        {/* Developers */}
        <div className="bg-pastel-bg p-4 rounded-lg border border-pastel-border">
          <h3 className="text-sm font-semibold text-pastel-muted uppercase tracking-wider mb-3">
            Developers <span className="text-gray-500">({results.devStats.count})</span>
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-pastel-text">{results.devStats.average ?? '-'}</div>
              <div className="text-xs text-pastel-muted">Avg</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pastel-text">{results.devStats.median ?? '-'}</div>
              <div className="text-xs text-pastel-muted">Median</div>
            </div>
          </div>
        </div>

        {/* QA */}
        <div className="bg-pastel-bg p-4 rounded-lg border border-pastel-border">
          <h3 className="text-sm font-semibold text-pastel-muted uppercase tracking-wider mb-3">
            QA <span className="text-gray-500">({results.qaStats.count})</span>
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-pastel-text">{results.qaStats.average ?? '-'}</div>
              <div className="text-xs text-pastel-muted">Avg</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pastel-text">{results.qaStats.median ?? '-'}</div>
              <div className="text-xs text-pastel-muted">Median</div>
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
          
          let highlightClass = "bg-pastel-surface border-pastel-border text-pastel-text";
          if (isMin) highlightClass = "bg-yellow-50 border-yellow-200 text-yellow-800";
          if (isMax) highlightClass = "bg-red-50 border-red-200 text-red-800";
          if (results.globalStats.consensus) highlightClass = "bg-green-50 border-green-200 text-green-800";

          return (
            <div 
              key={entry.userId} 
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border ${highlightClass} transition-colors shadow-sm`}
            >
              {/* Role Badge */}
              <span className={`absolute top-1 right-1 text-[0.6rem] px-1.5 py-0.5 rounded font-bold uppercase
                ${entry.jobRole === 'Developer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {entry.jobRole === 'Developer' ? 'Dev' : 'QA'}
              </span>

              <div className="text-2xl font-bold mb-1 mt-2">
                {entry.value ?? '-'}
              </div>
              <div className="text-xs text-pastel-muted text-center truncate w-full px-1">
                {entry.name}
              </div>
              
              {/* Outlier Labels */}
              {(isMin || isMax) && !results.globalStats.consensus && (
                <span className={`text-[0.6rem] uppercase tracking-wider font-bold mt-1 ${isMin ? 'text-yellow-600' : 'text-red-600'}`}>
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
