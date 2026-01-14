import React, { ReactNode } from 'react';
import { Header } from '../components/Header';
import { ParticipantRole } from '../types/domain';

interface AppLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
  sessionCode?: string;
  userRole?: ParticipantRole;
  userName?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, sidebar, sessionCode, userRole, userName }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-pastel-bg text-pastel-text">
      <Header sessionCode={sessionCode} userRole={userRole} userName={userName} />
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <main className="flex-grow p-6 overflow-y-auto bg-pastel-bg">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
        {sidebar && (
          <aside className="w-full md:w-80 bg-pastel-surface border-l border-pastel-border flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-pastel-border font-semibold text-pastel-text">
              Participants
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}
      </div>
      <footer className="md:hidden p-4 text-center text-xs text-pastel-muted bg-pastel-surface border-t border-pastel-border">
        &copy; {new Date().getFullYear()} PlanPoker
      </footer>
    </div>
  );
};
