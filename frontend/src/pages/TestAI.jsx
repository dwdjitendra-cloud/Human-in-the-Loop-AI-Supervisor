import React, { useState } from 'react';
import { aiAgentAPI, helpRequestsAPI } from '../services/api';

export const TestAI = ({ onNewRequest }) => {
  const [customerName, setCustomerName] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [useLivekitSim, setUseLivekitSim] = useState(true);

  const handleTestCall = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = useLivekitSim
        ? await helpRequestsAPI.simulateLivekitCall({ customerName, question })
        : await aiAgentAPI.simulateCall({ customerName, question });

      const callData = {
        id: Date.now(),
        customerName,
        question,
        response: response.data.data,
        timestamp: new Date(),
      };

      setResult(callData);
      setCallHistory([callData, ...callHistory]);
      onNewRequest?.();

      setCustomerName('');
      setQuestion('');
    } catch (err) {
      alert('Failed to process call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Test Automated Agent
        </h2>

        <form onSubmit={handleTestCall} className="space-y-4 mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g., Jitendra"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              className="mr-2"
              checked={useLivekitSim}
              onChange={(e) => setUseLivekitSim(e.target.checked)}
            />
            Use LiveKit Simulation endpoint
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are your business hours?"
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Simulate Call'}
          </button>
        </form>

        {result && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Latest Result</h3>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Customer:</span> {result.customerName}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Question:</span> {result.question}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Escalated:</span>{' '}
                <span className={result.response.escalated ? 'text-red-600' : 'text-green-600'}>
                  {result.response.escalated ? 'Yes' : 'No'}
                </span>
              </p>
              <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                <p className="text-xs font-semibold text-gray-700 mb-1">Automated Response:</p>
                <p className="text-sm text-gray-600 italic">"{result.response.response || result.response.answer || (result.response.success === false && 'Escalated to supervisor')}"</p>
              </div>
              {result.response.fromKnowledge && (
                <p className="text-xs text-green-700 mt-2 font-semibold">
                  Source: Knowledge Base
                </p>
              )}
              {useLivekitSim && result.response.helpRequestId && (
                <p className="text-xs text-blue-700 mt-2 font-semibold">
                  Pending Help Request ID: {result.response.helpRequestId}
                </p>
              )}
            </div>
          </div>
        )}

        {callHistory.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Call History ({callHistory.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {callHistory.map((call) => (
                <div key={call.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{call.customerName}</p>
                      <p className="text-gray-600 text-xs mt-1">{call.question}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                      call.response.escalated
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {call.response.escalated ? 'Escalated' : 'Answered'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

