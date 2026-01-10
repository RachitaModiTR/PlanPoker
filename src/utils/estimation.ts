import { VoteValue } from '../types/domain';
import { CONFIG } from '../constants';

/**
 * Filter and extract valid numeric votes.
 */
export const getNumericVotes = (votes: VoteValue[]): number[] => {
  return votes
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);
};

/**
 * Calculate the arithmetic mean of votes.
 * Returns null if no valid numeric votes.
 */
export const calculateAverage = (votes: VoteValue[]): number | null => {
  const numericVotes = getNumericVotes(votes);
  if (numericVotes.length === 0) return null;

  const sum = numericVotes.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / numericVotes.length;
  // Round to 1 decimal place
  return Math.round(avg * 10) / 10;
};

/**
 * Calculate the median of votes.
 * Returns null if no valid numeric votes.
 */
export const calculateMedian = (votes: VoteValue[]): number | null => {
  const numericVotes = getNumericVotes(votes);
  if (numericVotes.length === 0) return null;

  const mid = Math.floor(numericVotes.length / 2);
  
  if (numericVotes.length % 2 !== 0) {
    return numericVotes[mid];
  } else {
    // Average of two middle numbers
    return (numericVotes[mid - 1] + numericVotes[mid]) / 2;
  }
};

/**
 * Detect consensus among votes.
 * Returns true if the most common vote constitutes > threshold (default 70%) of all valid votes.
 */
export const detectConsensus = (votes: VoteValue[], thresholdPercent: number = CONFIG.CONSENSUS_THRESHOLD_PERCENT): boolean => {
  const numericVotes = getNumericVotes(votes);
  if (numericVotes.length === 0) return false;

  const counts: Record<number, number> = {};
  let maxCount = 0;

  for (const vote of numericVotes) {
    counts[vote] = (counts[vote] || 0) + 1;
    if (counts[vote] > maxCount) {
      maxCount = counts[vote];
    }
  }

  const percentage = (maxCount / numericVotes.length) * 100;
  return percentage > thresholdPercent;
};

interface Outliers {
  min: number | null;
  max: number | null;
  hasOutliers: boolean;
}

/**
 * Detect simple outliers (Min and Max) if there is disagreement.
 * If all votes are the same, no outliers.
 */
export const detectOutliers = (votes: VoteValue[]): Outliers => {
  const numericVotes = getNumericVotes(votes);
  if (numericVotes.length < 2) {
    return { min: null, max: null, hasOutliers: false };
  }

  const min = numericVotes[0];
  const max = numericVotes[numericVotes.length - 1];

  if (min === max) {
    return { min: null, max: null, hasOutliers: false };
  }

  return { min, max, hasOutliers: true };
};

