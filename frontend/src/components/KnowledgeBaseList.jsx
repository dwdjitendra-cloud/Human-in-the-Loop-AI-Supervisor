import React, { useState } from 'react';

export const KnowledgeBaseList = ({ knowledge, onDelete, onAddNew, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'General' });
  const [editingId, setEditingId] = useState(null);
  const [editAnswer, setEditAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddNew(formData);
    setFormData({ question: '', answer: '', category: 'General' });
    setShowForm(false);
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditAnswer(entry.answer || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAnswer('');
  };

  const saveEdit = (id) => {
    const data = { answer: editAnswer };
    onUpdate?.(id, data);
    setEditingId(null);
    setEditAnswer('');
  };

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        {showForm ? 'Cancel' : 'Add New Entry'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the question"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter category"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {knowledge.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No entries in knowledge base yet
          </div>
        ) : (
          knowledge.map((entry) => (
            <div key={entry._id} className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{entry.question}</h3>
                  {editingId === entry._id ? (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Edit Answer</label>
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => saveEdit(entry._id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm mt-2">{entry.answer}</p>
                  )}
                  <div className="mt-3 flex gap-2 items-center text-xs">
                    <span
                      className={
                        (entry.category || '').toLowerCase() === 'learned'
                          ? 'bg-green-100 text-green-800 px-2 py-1 rounded'
                          : 'bg-gray-100 text-gray-700 px-2 py-1 rounded'
                      }
                    >
                      {entry.category || 'General'}
                    </span>
                    <span className="text-gray-500">Used {entry.usageCount} times</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-2">
                  {editingId === entry._id ? null : (
                    <button
                      onClick={() => startEdit(entry)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(entry._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
