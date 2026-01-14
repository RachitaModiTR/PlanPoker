import React from 'react';
import { ParticipantRole } from '../types/domain';
import { useSessionStore } from '../store/sessionStore';

interface HeaderProps {
  userName?: string;
  userRole?: ParticipantRole;
  sessionCode?: string; // Kept as optional if we want to show it elsewhere or smaller
}

export const Header: React.FC<HeaderProps> = ({ userName, userRole }) => {
  const { themeMode, toggleTheme } = useSessionStore();

  return (
    <header className="h-16 px-6 bg-pastel-surface shadow-sm border-b border-pastel-border flex items-center justify-between z-10 w-full transition-colors duration-200">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-indigo-500 dark:text-indigo-400 tracking-tight">Planning Poker</h1>
        {userName && (
          <span className="bg-pastel-bg px-3 py-1 rounded-full text-sm font-medium text-pastel-text border border-pastel-border flex items-center gap-2">
            <svg className="w-4 h-4 text-pastel-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-pastel-text">{userName}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userRole && (
          <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
            userRole === 'moderator' 
              ? 'bg-pastel-purple text-pastel-purple-text border border-pastel-purple' 
              : 'bg-pastel-blue text-pastel-blue-text border border-pastel-blue'
          }`}>
            {userRole}
          </span>
        )}
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="text-pastel-muted hover:text-pastel-text cursor-pointer transition-colors p-2 rounded-full hover:bg-pastel-bg"
          title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {themeMode === 'light' ? (
             // Moon icon for dark mode
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
             </svg>
          ) : (
             // Sun icon for light mode
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
          )}
        </button>
      </div>
    </header>
  );
};
