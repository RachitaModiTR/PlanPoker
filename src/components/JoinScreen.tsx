import React, { useState } from 'react';
import { JobRole } from '../types/domain';

interface JoinScreenProps {
  onJoin: (name: string, jobRole: JobRole) => void;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [jobRole, setJobRole] = useState<JobRole>('Developer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), jobRole);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-pastel-bg px-4">
      <div className="w-full max-w-md bg-pastel-surface rounded-xl shadow-lg p-8 border border-pastel-border">
        <h1 className="text-3xl font-bold text-center text-indigo-500 mb-2">PlanPoker</h1>
        <p className="text-center text-pastel-muted mb-8">Join the session to start estimating.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-pastel-text mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              required
              autoFocus
              className="w-full px-4 py-3 bg-pastel-surface border border-pastel-border rounded-lg text-pastel-text placeholder-pastel-muted focus:outline-none focus:ring-2 focus:ring-pastel-blue-hover focus:border-transparent transition-all shadow-sm"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-pastel-text mb-2">
              Your Role
            </label>
            <div className="relative">
              <select
                id="role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value as JobRole)}
                className="w-full px-4 py-3 bg-pastel-surface border border-pastel-border rounded-lg text-pastel-text appearance-none focus:outline-none focus:ring-2 focus:ring-pastel-blue-hover focus:border-transparent cursor-pointer shadow-sm"
              >
                <option value="Admin">Admin</option>
                <option value="Product">Product</option>
                <option value="Developer">Developer</option>
                <option value="QA">QA</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-pastel-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Session
          </button>
        </form>
      </div>
    </div>
  );
};
