import React from 'react';
import { useSessionStore } from '../store/sessionStore';

export const WorkItemPanel: React.FC = () => {
  const { session, currentUser } = useSessionStore();
  
  if (!session) return null;

  const activeWorkItem = session.activeWorkItemId 
    ? session.workItems.find(wi => wi.id === session.activeWorkItemId)
    : null;

  // Check permissions (mock logic '|| true' again for testing)
  const isModerator = currentUser?.id === session.moderatorId || currentUser?.role === 'moderator' || true;

  if (!activeWorkItem) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center text-gray-400">
        No active work item selected.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-100 leading-tight">
              {activeWorkItem.title}
            </h2>
            {activeWorkItem.linkUrl && (
              <a 
                href={activeWorkItem.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Open external link"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          
          {activeWorkItem.description ? (
            <p className="text-gray-300 text-base leading-relaxed">
              {activeWorkItem.description}
            </p>
          ) : (
             <p className="text-gray-500 italic">No description provided.</p>
          )}
        </div>

        {/* Edit Action Placeholder */}
        {isModerator && (
          <button 
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Edit Work Item"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Agreed Estimate Badge - if set */}
      {activeWorkItem.agreedEstimate !== null && activeWorkItem.agreedEstimate !== undefined && (
         <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-2">
           <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Agreed Estimate:</span>
           <span className="px-3 py-1 bg-green-900/40 text-green-300 rounded border border-green-800 font-bold text-lg">
             {activeWorkItem.agreedEstimate}
           </span>
         </div>
      )}
    </div>
  );
};

