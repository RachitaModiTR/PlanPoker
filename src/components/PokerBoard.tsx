import React from 'react';
import { VoteValue } from '../types/domain';
import { PokerCard } from './PokerCard';
import { CONFIG } from '../constants';

interface PokerBoardProps {
  cards?: readonly string[]; // Allow overriding the deck
  selectedValue: VoteValue;
  onVote: (value: VoteValue) => void;
  disabled?: boolean;
}

export const PokerBoard: React.FC<PokerBoardProps> = ({ 
  cards = CONFIG.DEFAULT_DECK, 
  selectedValue, 
  onVote, 
  disabled = false 
}) => {
  return (
    <div className="w-full py-6">
      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((cardValue) => {
          // Parse number if it looks like one, otherwise keep string
          // This ensures '5' (string from deck) matches 5 (number from selectedValue) loosely if needed,
          // but strict types prefer consistent usage.
          // For simplicity in UI rendering, we treat deck values as strings primarily.
          // When clicking, we might need to convert numeric strings to numbers.
          
          const isNumeric = !isNaN(Number(cardValue));
          const actualValue: VoteValue = isNumeric ? Number(cardValue) : cardValue;
          
          // Check selection. Handle type mismatch (string vs number) loosely or strictly.
          // Here assuming selectedValue might be number or string.
          const isSelected = selectedValue === actualValue || String(selectedValue) === cardValue;

          return (
            <PokerCard
              key={cardValue}
              value={actualValue}
              selected={isSelected}
              disabled={disabled}
              onClick={() => onVote(actualValue)}
            />
          );
        })}
      </div>
    </div>
  );
};

