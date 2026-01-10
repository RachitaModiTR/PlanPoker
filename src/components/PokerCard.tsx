import React from 'react';
import { VoteValue } from '../types/domain';

interface PokerCardProps {
  value: VoteValue;
  selected?: boolean;
  disabled?: boolean;
  onClick?: (value: VoteValue) => void;
}

export const PokerCard: React.FC<PokerCardProps> = ({ 
  value, 
  selected = false, 
  disabled = false, 
  onClick 
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(value);
    }
  };

  // Base classes for the card
  const baseClasses = "relative flex items-center justify-center w-16 h-24 rounded-lg border-2 shadow-sm transition-all duration-200 select-none font-bold text-xl";
  
  // Interactive states (only when not disabled)
  const interactiveClasses = !disabled 
    ? "cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-blue-400 active:translate-y-0 active:shadow-sm" 
    : "cursor-not-allowed opacity-50";

  // Selected state
  const selectedClasses = selected 
    ? "bg-blue-600 border-blue-500 text-white shadow-blue-900/50 shadow-lg -translate-y-2" 
    : "bg-gray-800 border-gray-600 text-gray-200";

  return (
    <div 
      onClick={handleClick}
      className={`${baseClasses} ${interactiveClasses} ${selectedClasses}`}
    >
      {/* Center Value */}
      <span>{value}</span>

      {/* Decorative corner values for card-like look */}
      <span className="absolute top-1 left-1 text-[0.6rem] opacity-60 leading-none">
        {value}
      </span>
      <span className="absolute bottom-1 right-1 text-[0.6rem] opacity-60 leading-none rotate-180">
        {value}
      </span>
    </div>
  );
};

