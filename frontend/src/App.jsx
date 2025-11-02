import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { PendingRequests } from './pages/PendingRequests';
import { ResolvedRequests } from './pages/ResolvedRequests';
import { KnowledgePage } from './pages/KnowledgeBase';
import { TestAI } from './pages/TestAI';

export default function App() {
  // Define handleRequestResolved before usage
  const handleRequestResolved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');
  const [currentPage, setCurrentPage] = useState('pending');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');


  // Define handleLoginSuccess before usage
  const handleLoginSuccess = (name) => {
    setSupervisorName(name);
    setIsAuthenticated(true);
  };

  // Define handleLogout before usage
  const handleLogout = () => {
    localStorage.removeItem('supervisorToken');
    localStorage.removeItem('supervisorName');
    setIsAuthenticated(false);
    setSupervisorName('');
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
      case 'learned':
        return <KnowledgePage initialFilter="learned" setErrorMessage={setErrorMessage} />;
      case 'test':
        return <TestAI setErrorMessage={setErrorMessage} />;
      default:
        return <PendingRequests key={refreshTrigger} onRequestResolved={handleRequestResolved} setErrorMessage={setErrorMessage} />;
    }
  };

  // Toast logic: support {type, text} for success, string for error
  const getToast = () => {
    if (!errorMessage) return null;
    if (typeof errorMessage === 'string') {
      return (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2">
            <span>{errorMessage}</span>
            <button
              className="ml-2 text-white hover:text-gray-200"
              onClick={() => setErrorMessage('')}
            >
              &times;
            </button>
          </div>
        </div>
      );
    }
    if (errorMessage.type === 'success') {
      return (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2">
            <span>{errorMessage.text}</span>
            <button
              className="ml-2 text-white hover:text-gray-200"
              onClick={() => setErrorMessage('')}
            >
              &times;
            </button>
          </div>
        </div>
      );
    }
    return null;
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
      {/* Toast */}
      {getToast()}
    </div>
  );
}
