import React from 'react';
import { ParticipantRole } from '../types/domain';

interface HeaderProps {
  sessionCode?: string;
  userRole?: ParticipantRole;
}

export const Header: React.FC<HeaderProps> = ({ sessionCode, userRole }) => {
  return (
    <header className="h-16 px-6 bg-gray-800 shadow-md border-b border-gray-700 flex items-center justify-between z-10 w-full">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-blue-400 tracking-tight">Planning Poker</h1>
        {sessionCode && (
          <span className="bg-gray-700 px-3 py-1 rounded-full text-sm font-mono text-gray-300 border border-gray-600">
            Session: <span className="text-white font-bold">{sessionCode}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userRole && (
          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
            userRole === 'moderator' 
              ? 'bg-purple-900 text-purple-200 border border-purple-700' 
              : 'bg-blue-900 text-blue-200 border border-blue-700'
          }`}>
            {userRole}
          </span>
        )}
        
        {/* Placeholder for user menu or settings */}
        <div className="text-gray-400 hover:text-white cursor-pointer transition-colors p-1">
          <span className="sr-only">Settings</span>
          {/* Simple gear icon placeholder */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    </header>
  );
};

