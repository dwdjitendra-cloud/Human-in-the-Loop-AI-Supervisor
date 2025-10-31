import React, { useEffect, useState } from 'react';
import { KnowledgeBaseList } from '../components/KnowledgeBaseList';
import { knowledgeBaseAPI } from '../services/api';

export const KnowledgePage = () => {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await knowledgeBaseAPI.getAll();
      setKnowledge(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch knowledge base');
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
      setKnowledge(knowledge.filter((k) => k._id !== id));
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const handleAddNew = async (data) => {
    try {
      const response = await knowledgeBaseAPI.create(data);
      setKnowledge([response.data.data, ...knowledge]);
      alert('Entry added successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Knowledge Base
        </h2>
        <p className="text-gray-600 mb-6">
          Total entries: <span className="font-bold text-blue-600">{knowledge.length}</span>
        </p>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        ) : (
          <KnowledgeBaseList
            knowledge={knowledge}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
          />
        )}
      </div>
    </div>
  );
};
