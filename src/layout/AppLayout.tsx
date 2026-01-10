import React, { ReactNode } from 'react';
import { Header } from '../components/Header';
import { ParticipantRole } from '../types/domain';

interface AppLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
  sessionCode?: string;
  userRole?: ParticipantRole;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, sidebar, sessionCode, userRole }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-900 text-gray-100">
      <Header sessionCode={sessionCode} userRole={userRole} />

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-grow p-6 overflow-y-auto bg-gray-900">
          <div className="max-w-5xl mx-auto h-full">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Participants */}
        {sidebar && (
          <aside className="w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700 font-semibold text-gray-300">
              Participants
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}
      </div>

      <footer className="md:hidden p-4 text-center text-xs text-gray-600 bg-gray-900 border-t border-gray-800">
        &copy; {new Date().getFullYear()} PlanPoker
      </footer>
    </div>
  );
};
