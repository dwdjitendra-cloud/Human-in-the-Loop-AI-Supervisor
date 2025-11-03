import React from 'react';

export const Navbar = ({ currentPage, onNavigate, supervisorName, onLogout }) => {
  return (
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">
              HI
            </div>
            <h1 className="text-xl font-bold">Human-in-the-Loop AI</h1>
          </div>

          <div className="hidden md:flex space-x-4">
            <button
              onClick={() => onNavigate('pending')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => onNavigate('resolved')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => onNavigate('knowledge')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'knowledge'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Knowledge Base
            </button>
            <button
              onClick={() => onNavigate('learned')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'learned'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Learned
            </button>
            <button
              onClick={() => onNavigate('test')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Test AI
            </button>
            <button
              onClick={() => onNavigate('voice')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'voice'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              Live Voice
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">{supervisorName}</span>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
