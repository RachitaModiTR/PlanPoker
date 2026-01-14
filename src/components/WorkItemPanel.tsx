import React, { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { socketService } from '../services/socketService';
import { WorkItem, VoteValue } from '../types/domain';

export const WorkItemPanel: React.FC = () => {
  const { session, currentUser } = useSessionStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [estimateInput, setEstimateInput] = useState<string>('');

  if (!session) return null;

  const activeWorkItem = session.activeWorkItemId
    ? session.workItems.find(wi => wi.id === session.activeWorkItemId)
    : null;

  // Check permissions
  const myParticipant = session.participants.find(p => p.id === currentUser?.id);
  const isModerator = currentUser?.id === session.moderatorId || myParticipant?.role === 'moderator';

  // Group items
  const completedItems = session.workItems.filter(wi => wi.agreedEstimate !== null && wi.agreedEstimate !== undefined);
  const pendingItems = session.workItems.filter(wi => wi.agreedEstimate === null || wi.agreedEstimate === undefined);

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

  const handleFinalizeEstimate = () => {
    if (!activeWorkItem) return;
    const value = estimateInput.trim();
    if (!value) return;

    // Determine if numeric or string
    const num = parseFloat(value);
    const finalEstimate: VoteValue = isNaN(num) ? value : num;

    socketService.send('set_agreed_estimate', {
      workItemId: activeWorkItem.id,
      estimate: finalEstimate
    });
    setEstimateInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      {/* Sidebar with Tabs/Sections */}
      <div className="lg:col-span-1 bg-pastel-surface rounded-lg border border-pastel-border flex flex-col max-h-[500px] shadow-sm">
        
        {/* Header & Add Button */}
        <div className="p-3 border-b border-pastel-border flex justify-between items-center bg-pastel-bg rounded-t-lg">
          <h3 className="font-semibold text-pastel-text text-sm uppercase tracking-wide">Work Items</h3>
          {isModerator && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-indigo-500 hover:text-indigo-600 text-sm font-bold p-1"
            >
              {isAdding ? 'Cancel' : '+ Add'}
            </button>
          )}
        </div>
        
        {isAdding && (
          <form onSubmit={handleAddItem} className="p-3 bg-pastel-surface border-b border-pastel-border space-y-2">
            <input
              type="text"
              placeholder="Task Title..."
              className="w-full px-2 py-1 bg-pastel-surface border border-pastel-border rounded text-sm text-pastel-text focus:ring-1 focus:ring-indigo-500"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Description (opt)..."
              className="w-full px-2 py-1 bg-pastel-surface border border-pastel-border rounded text-sm text-pastel-text focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!newTitle.trim()}
              className="w-full py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded disabled:opacity-50"
            >
              Add Item
            </button>
          </form>
        )}

        <div className="overflow-y-auto flex-grow p-2 space-y-4">
          
          {/* Pending List */}
          <div>
            <div className="px-1 mb-1 text-xs font-bold text-pastel-muted uppercase">Pending ({pendingItems.length})</div>
            <div className="space-y-1">
              {pendingItems.length === 0 ? (
                <p className="text-pastel-muted text-[10px] italic px-2">No pending items.</p>
              ) : (
                pendingItems.map(item => (
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

          {/* Completed List */}
          <div>
            <div className="px-1 mb-1 text-xs font-bold text-pastel-muted uppercase">Completed ({completedItems.length})</div>
            <div className="space-y-1">
              {completedItems.length === 0 ? (
                <p className="text-pastel-muted text-[10px] italic px-2">No completed items.</p>
              ) : (
                completedItems.map(item => (
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

        </div>
      </div>

      {/* Active Item Detail */}
      <div className="lg:col-span-3 bg-pastel-surface rounded-lg p-6 border border-pastel-border shadow-sm min-h-[200px] flex flex-col justify-center">
        {!activeWorkItem ? (
          <div className="text-center text-pastel-muted">
            <p className="mb-2">No active work item selected.</p>
            {isModerator && <p className="text-sm">Select or add an item from the sidebar.</p>}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded border border-indigo-200 uppercase font-bold tracking-wider">
                Active
              </span>
              <h2 className="text-2xl font-bold text-pastel-text leading-tight">
                {activeWorkItem.title}
              </h2>
            </div>
            
            {activeWorkItem.description ? (
              <p className="text-pastel-text text-base leading-relaxed bg-pastel-bg p-4 rounded border border-pastel-border">
                {activeWorkItem.description}
              </p>
            ) : (
              <p className="text-pastel-muted italic">No description provided.</p>
            )}

            {activeWorkItem.linkUrl && (
              <a 
                href={activeWorkItem.linkUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-4 text-indigo-500 hover:text-indigo-600 transition-colors text-sm font-medium"
              >
                <span>View External Link</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Agreed Estimate Display or Input */}
            <div className="mt-6 pt-4 border-t border-pastel-border">
              {activeWorkItem.agreedEstimate !== null && activeWorkItem.agreedEstimate !== undefined ? (
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <span className="text-sm text-pastel-muted uppercase tracking-wide font-semibold">Final Estimate:</span>
                     <span className="px-3 py-1 bg-green-100 text-green-800 rounded border border-green-200 font-bold text-lg">
                       {activeWorkItem.agreedEstimate}
                     </span>
                   </div>
                   {isModerator && (
                     <button 
                       onClick={() => {
                         // Reset estimate logic if needed, currently overwrite via input below
                       }}
                       className="text-pastel-muted hover:text-pastel-text text-xs underline"
                     >
                       Edit
                     </button>
                   )}
                 </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                   <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                   Voting in progress...
                </div>
              )}

              {/* Moderator Finalize Controls */}
              {isModerator && (
                <div className="mt-4 flex items-end gap-2 bg-pastel-bg p-3 rounded border border-pastel-border w-full md:w-auto inline-flex">
                   <div>
                     <label className="block text-xs text-pastel-muted uppercase font-bold mb-1">Set Final Estimate</label>
                     <input 
                       type="text" 
                       placeholder="e.g. 5" 
                       className="w-24 px-2 py-1 bg-pastel-surface border border-pastel-border rounded text-pastel-text text-sm focus:ring-1 focus:ring-indigo-500"
                       value={estimateInput}
                       onChange={e => setEstimateInput(e.target.value)}
                     />
                   </div>
                   <button
                     onClick={handleFinalizeEstimate}
                     disabled={!estimateInput.trim()}
                     className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Save & Complete
                   </button>
                </div>
              )}
            </div>

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
  const isCompleted = item.agreedEstimate !== null && item.agreedEstimate !== undefined;
  
  return (
    <div 
      onClick={() => isModerator && !isActive ? onSelect(item.id) : null}
      className={`
        p-2 rounded border transition-all relative group flex items-center justify-between
        ${isActive 
          ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
          : isCompleted
            ? 'bg-pastel-bg border-pastel-border opacity-75 hover:opacity-100'
            : 'bg-pastel-surface border-transparent hover:bg-pastel-bg cursor-pointer'}
        ${!isModerator && !isActive ? 'cursor-default' : ''}
      `}
    >
      <div className="min-w-0 flex-1 mr-2">
         <div className={`font-medium text-xs truncate ${isActive ? 'text-indigo-700' : isCompleted ? 'text-pastel-muted line-through' : 'text-pastel-text'}`}>
          {item.title}
        </div>
      </div>
      
      <div className="flex-shrink-0">
        {isCompleted ? (
          <span className="text-[0.6rem] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-mono font-bold">
            {item.agreedEstimate}
          </span>
        ) : isActive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse block"></span>
        ) : null}
      </div>
    </div>
  );
};
