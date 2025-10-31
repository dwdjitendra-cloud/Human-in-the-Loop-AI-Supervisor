import React, { useEffect, useState } from 'react';
import { RequestList } from '../components/RequestList';
import { helpRequestsAPI } from '../services/api';

export const PendingRequests = ({ onRequestResolved, setErrorMessage }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchRequests(page);
  }, [page]);

  const fetchRequests = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await helpRequestsAPI.getPending(pageNum, limit);
      setRequests(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
      setError('');
    } catch (err) {
      setError('Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, answer, saveToKnowledge) => {
    const supervisorId = localStorage.getItem('supervisorId') || '';
    console.log('Fetched supervisorId from localStorage:', supervisorId);
    if (!answer || !answer.trim()) {
      setErrorMessage('Answer is required.');
      return;
    }
    if (!supervisorId) {
      setErrorMessage('Supervisor ID is missing. Please log in again.');
      return;
    }
    try {
      console.log('Resolving request:', { id, answer, supervisorId, saveToKnowledge });
      await helpRequestsAPI.resolve(id, {
        answer,
        supervisorId,
        saveToKnowledgeBase: saveToKnowledge,
      });
      fetchRequests();
      onRequestResolved?.();
      setErrorMessage('Request resolved successfully!');
    } catch (err) {
      setErrorMessage('Failed to resolve request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Pending Requests
        </h2>
        <p className="text-gray-600 mb-4">
          Total pending: <span className="font-bold text-yellow-600">{totalItems}</span>
        </p>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? null : (
          <>
            <RequestList
              requests={requests}
              onSelectRequest={() => {}}
              onResolve={handleResolve}
            />
            <div className="flex justify-center mt-6 space-x-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Prev
              </button>
              <span className="px-3 py-1">Page {page} of {totalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
