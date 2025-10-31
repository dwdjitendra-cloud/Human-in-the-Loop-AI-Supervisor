import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { PendingRequests } from './pages/PendingRequests';
import { ResolvedRequests } from './pages/ResolvedRequests';
import { KnowledgePage } from './pages/KnowledgeBase';
import { TestAI } from './pages/TestAI';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');
  const [currentPage, setCurrentPage] = useState('pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('supervisorToken');
    const name = localStorage.getItem('supervisorName');
    if (token && name) {
      setIsAuthenticated(true);
      setSupervisorName(name);
    }
  }, []);

  const handleLoginSuccess = (name) => {
    setSupervisorName(name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('supervisorToken');
    localStorage.removeItem('supervisorName');
    setIsAuthenticated(false);
    setSupervisorName('');
  };

  const handleRequestResolved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'pending':
        return (
          <PendingRequests
            key={refreshTrigger}
            onRequestResolved={handleRequestResolved}
            setErrorMessage={setErrorMessage}
          />
        );
      case 'resolved':
        return <ResolvedRequests setErrorMessage={setErrorMessage} />;
      case 'knowledge':
        return <KnowledgePage setErrorMessage={setErrorMessage} />;
      case 'test':
        return <TestAI setErrorMessage={setErrorMessage} />;
      default:
        return <PendingRequests key={refreshTrigger} onRequestResolved={handleRequestResolved} setErrorMessage={setErrorMessage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        supervisorName={supervisorName}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
            <span className="font-semibold">Error:</span>
            <span>{errorMessage}</span>
            <button
              className="ml-4 text-white hover:text-gray-200 font-bold"
              onClick={() => setErrorMessage('')}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
