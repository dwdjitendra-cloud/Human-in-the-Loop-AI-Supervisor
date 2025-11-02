import React, { useEffect, useMemo, useState } from 'react';
import { KnowledgeBaseList } from '../components/KnowledgeBaseList';
import { knowledgeBaseAPI } from '../services/api';

export const KnowledgePage = ({ setErrorMessage, initialFilter = 'all' }) => {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(initialFilter); // all | learned | general

  useEffect(() => {
    fetchKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await knowledgeBaseAPI.getAll();
      setKnowledge(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch knowledge base');
      setErrorMessage?.('Failed to fetch knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await knowledgeBaseAPI.delete(id);
      setKnowledge((prev) => prev.filter((k) => k._id !== id));
      setErrorMessage?.({ type: 'success', text: 'Entry deleted.' });
    } catch (err) {
      setErrorMessage?.('Failed to delete entry');
    }
  };

  const handleAddNew = async (data) => {
    try {
      const response = await knowledgeBaseAPI.create(data);
      setKnowledge((prev) => [response.data.data, ...prev]);
      setErrorMessage?.({ type: 'success', text: 'Entry added successfully!' });
    } catch (err) {
      setErrorMessage?.(err.response?.data?.message || 'Failed to add entry');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'learned') return knowledge.filter((k) => (k.category || '').toLowerCase() === 'learned');
    if (filter === 'general') return knowledge.filter((k) => (k.category || '').toLowerCase() === 'general');
    return knowledge;
  }, [knowledge, filter]);

  const learnedCount = useMemo(() => knowledge.filter((k) => (k.category || '').toLowerCase() === 'learned').length, [knowledge]);
  const generalCount = useMemo(() => knowledge.filter((k) => (k.category || '').toLowerCase() === 'general').length, [knowledge]);

  const title = filter === 'learned' ? 'Learned Answers' : 'Knowledge Base';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">
          Total entries: <span className="font-bold text-blue-600">{knowledge.length}</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setFilter('all')}
          >
            All ({knowledge.length})
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === 'learned' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setFilter('learned')}
          >
            Learned ({learnedCount})
          </button>
          <button
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === 'general' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setFilter('general')}
          >
            General ({generalCount})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        ) : (
          <KnowledgeBaseList knowledge={filtered} onDelete={handleDelete} onAddNew={handleAddNew} />
        )}
      </div>
    </div>
  );
};
