import React, { useEffect } from 'react';

export const ErrorToast = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
        <span className="font-semibold">Error:</span>
        <span>{message}</span>
        <button
          className="ml-4 text-white hover:text-gray-200 font-bold"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Add this CSS to your global styles or index.css for fade-in effect:
// @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
// .animate-fade-in { animation: fade-in 0.3s ease; }
