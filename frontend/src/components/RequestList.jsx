import React, { useState } from 'react';

export const RequestList = ({ requests, onSelectRequest, onResolve }) => {
  const [selectedId, setSelectedId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Unresolved':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form className="space-y-3" onSubmit={e => e.preventDefault()}>
      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No requests found
        </div>
      ) : (
        requests.map((request) => (
          <div
            key={request._id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedId === request._id
                ? 'bg-blue-50 border-blue-400 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              setSelectedId(request._id);
              onSelectRequest(request);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">
                  {request.customerName}
                </h3>
                <p className="text-gray-600 text-sm mt-1">{request.question}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(request.createdAt).toLocaleString()}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
            </div>

            {selectedId === request._id && request.status === 'Pending' && (
              <div className="mt-3 pt-3 border-t">
                <textarea
                  placeholder="Type your response here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows="3"
                  id={`response-${request._id}`}
                />
                <div className="mt-2 flex gap-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      className="mr-2"
                      id={`knowledge-${request._id}`}
                    />
                    Save to Knowledge Base
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const answer = document.getElementById(`response-${request._id}`).value;
                    const saveToKnowledge = document.getElementById(`knowledge-${request._id}`).checked;
                    onResolve(request._id, answer, saveToKnowledge);
                  }}
                  className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Submit Response
                </button>
              </div>
            )}

            {request.answer && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">Answer:</p>
                <p className="text-sm text-green-900">{request.answer}</p>
              </div>
            )}
          </div>
        ))
      )}
    </form>
  );
};
