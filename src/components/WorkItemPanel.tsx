import React, { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { socketService } from '../services/socketService';
import { WorkItem } from '../types/domain';

export const WorkItemPanel: React.FC = () => {
  const { session, currentUser } = useSessionStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  if (!session) return null;

  const activeWorkItem = session.activeWorkItemId
    ? session.workItems.find(wi => wi.id === session.activeWorkItemId)
    : null;

  // Check permissions
  const myParticipant = session.participants.find(p => p.id === currentUser?.id);
  const isModerator = currentUser?.id === session.moderatorId || myParticipant?.role === 'moderator';

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    socketService.send('add_work_item', {
      title: newTitle,
      description: newDesc
    });

    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleSelectActive = (id: string) => {
    if (!isModerator) return;
    if (confirm("Switching work items will reset current votes. Continue?")) {
      socketService.send('set_active_work_item', { workItemId: id });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      {/* List Sidebar */}
      <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col max-h-[400px]">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-lg">
          <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">Work Items</h3>
          {isModerator && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-blue-400 hover:text-blue-300 text-sm font-bold p-1"
            >
              {isAdding ? 'Cancel' : '+ Add'}
            </button>
          )}
        </div>
        
        {isAdding && (
          <form onSubmit={handleAddItem} className="p-3 bg-gray-700/30 border-b border-gray-700 space-y-2">
            <input
              type="text"
              placeholder="Task Title..."
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:ring-1 focus:ring-blue-500"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Description (opt)..."
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:ring-1 focus:ring-blue-500 h-16 resize-none"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!newTitle.trim()}
              className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded disabled:opacity-50"
            >
              Add Item
            </button>
          </form>
        )}

        <div className="overflow-y-auto flex-grow p-2 space-y-2">
          {session.workItems.length === 0 ? (
            <p className="text-gray-500 text-xs text-center italic py-4">No items yet.</p>
          ) : (
            session.workItems.map(item => (
              <WorkItemListItem 
                key={item.id}
                item={item}
                isActive={item.id === session.activeWorkItemId}
                isModerator={isModerator}
                onSelect={handleSelectActive}
              />
            ))
          )}
        </div>
      </div>

      {/* Active Item Detail */}
      <div className="lg:col-span-3 bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm min-h-[200px] flex flex-col justify-center">
        {!activeWorkItem ? (
          <div className="text-center text-gray-500">
            <p className="mb-2">No active work item selected.</p>
            {isModerator && <p className="text-sm">Add an item from the sidebar to start.</p>}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded border border-blue-800 uppercase font-bold tracking-wider">
                Active
              </span>
              <h2 className="text-2xl font-bold text-gray-100 leading-tight">
                {activeWorkItem.title}
              </h2>
            </div>
            
            {activeWorkItem.description ? (
              <p className="text-gray-300 text-base leading-relaxed bg-gray-900/30 p-4 rounded border border-gray-700/50">
                {activeWorkItem.description}
              </p>
            ) : (
              <p className="text-gray-500 italic">No description provided.</p>
            )}

            {activeWorkItem.linkUrl && (
              <a 
                href={activeWorkItem.linkUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-4 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
              >
                <span>View External Link</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {activeWorkItem.agreedEstimate && (
               <div className="mt-6 pt-4 border-t border-gray-700 flex items-center gap-2">
                 <span className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Final Estimate:</span>
                 <span className="px-3 py-1 bg-green-900/40 text-green-300 rounded border border-green-800 font-bold text-lg">
                   {activeWorkItem.agreedEstimate}
                 </span>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WorkItemListItem: React.FC<{
  item: WorkItem;
  isActive: boolean;
  isModerator: boolean;
  onSelect: (id: string) => void;
}> = ({ item, isActive, isModerator, onSelect }) => {
  return (
    <div 
      onClick={() => isModerator && !isActive ? onSelect(item.id) : null}
      className={`
        p-3 rounded border transition-all relative group
        ${isActive 
          ? 'bg-blue-900/20 border-blue-500/50 shadow-sm' 
          : 'bg-gray-700/20 border-transparent hover:bg-gray-700/50 cursor-pointer'}
        ${!isModerator && !isActive ? 'cursor-default' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-1">
        <span className={`font-medium text-sm truncate w-full ${isActive ? 'text-blue-200' : 'text-gray-300'}`}>
          {item.title}
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        {item.agreedEstimate ? (
          <span className="text-[0.65rem] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-800/50 font-mono">
            {item.agreedEstimate} pts
          </span>
        ) : (
          <span className="text-[0.65rem] text-gray-600 italic">Pending</span>
        )}
        
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        )}
      </div>
    </div>
  );
};
