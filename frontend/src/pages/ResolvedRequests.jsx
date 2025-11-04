import React, { useEffect, useState } from 'react';
import { helpRequestsAPI } from '../services/api';

export const ResolvedRequests = () => {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('all');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const limit = 10;

	useEffect(() => {
		fetchRequests(page);
		// eslint-disable-next-line
	}, [filter, page]);

	const fetchRequests = async (pageNum = 1) => {
		setLoading(true);
		try {
			let response;
			if (filter === 'resolved') {
				response = await helpRequestsAPI.getResolved(pageNum, limit);
			} else if (filter === 'unresolved') {
				response = await helpRequestsAPI.getUnresolved(pageNum, limit);
			} else {
				// For 'all', fetch both and merge
				const resolved = await helpRequestsAPI.getResolved(pageNum, limit);
				const unresolved = await helpRequestsAPI.getUnresolved(pageNum, limit);
				response = {
					data: {
						data: [...resolved.data.data, ...unresolved.data.data],
						totalPages: Math.max(resolved.data.totalPages, unresolved.data.totalPages),
						totalItems: (resolved.data.totalItems || 0) + (unresolved.data.totalItems || 0),
					},
				};
			}
			setRequests(response.data.data);
			setTotalPages(response.data.totalPages || 1);
			setTotalItems(response.data.totalItems || 0);
			setError('');
		} catch (err) {
			setError('Failed to fetch requests');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this request permanently?')) return;
		try {
			await helpRequestsAPI.delete(id);
			setRequests((prev) => prev.filter((r) => r._id !== id));
			setTotalItems((prev) => Math.max(0, prev - 1));
		} catch (err) {
			setError('Failed to delete request');
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'Resolved':
				return 'bg-green-100 text-green-800';
			case 'Unresolved':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">Resolved & Unresolved Requests</h2>
				<div className="mb-4 flex gap-4">
					<button
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
						onClick={() => { setFilter('all'); setPage(1); }}
					>
						All
					</button>
					<button
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'resolved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
						onClick={() => { setFilter('resolved'); setPage(1); }}
					>
						Resolved
					</button>
					<button
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unresolved' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
						onClick={() => { setFilter('unresolved'); setPage(1); }}
					>
						Unresolved
					</button>
				</div>
				<p className="text-gray-600 mb-4">
					Total: <span className="font-bold text-blue-600">{totalItems}</span>
				</p>
				{loading ? (
					<div className="text-center py-8 text-gray-500">Loading...</div>
				) : error ? (
					<div className="text-center py-8 text-red-500">{error}</div>
				) : (
					<>
						<div className="space-y-3">
							{requests.map((request) => (
								<div key={request._id} className="p-4 border rounded-lg bg-white shadow-sm">
									<div className="flex justify-between items-center">
										<div>
											<div className="font-bold text-lg text-gray-800">
												{request.customerName}
											</div>
											<div className="text-gray-600 text-sm">
												{request.question}
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(request.status)}`}>{request.status}</span>
											<button
												className="text-red-600 hover:text-red-800 text-xs font-semibold"
												onClick={() => handleDelete(request._id)}
											>
												Delete
											</button>
										</div>
									</div>
									{request.answer && (
										<div className="mt-2 text-gray-700">
											<span className="font-semibold">Answer:</span> {request.answer}
										</div>
									)}
									{request.supervisorId && (
										<div className="mt-2 text-gray-500 text-xs">
											<span className="font-semibold">Supervisor:</span> {request.supervisorId.name}
										</div>
									)}
								</div>
							))}
						</div>
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
