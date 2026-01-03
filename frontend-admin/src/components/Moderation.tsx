'use client';

import { useState } from 'react';
import api from '@/lib/api';

export function ModerationPanel() {
    const [listingId, setListingId] = useState('');
    const [hideReason, setHideReason] = useState('');

    const [userId, setUserId] = useState('');
    const [banReason, setBanReason] = useState('');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleHideListing = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/moderation/hide-listing', { listing_id: listingId, reason: hideReason });
            setMessage({ type: 'success', text: 'Listing hidden successfully' });
            setListingId('');
            setHideReason('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to hide listing (check ID)' });
        }
    };

    const handleBanUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/moderation/ban-user', { user_id: userId, reason: banReason });
            setMessage({ type: 'success', text: 'User banned successfully' });
            setUserId('');
            setBanReason('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to ban user (check ID)' });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {message && (
                <div className={`col-span-full p-4 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white p-6 rounded shadow border border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Hide Listing</h3>
                <form onSubmit={handleHideListing} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Listing UUID</label>
                        <input
                            type="text"
                            value={listingId}
                            onChange={(e) => setListingId(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded text-black border-slate-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <input
                            type="text"
                            value={hideReason}
                            onChange={(e) => setHideReason(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded text-black border-slate-300"
                        />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
                        Hide Listing
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded shadow border border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Ban User</h3>
                <form onSubmit={handleBanUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">User UUID</label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded text-black border-slate-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <input
                            type="text"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded text-black border-slate-300"
                        />
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                        Ban User
                    </button>
                </form>
            </div>
        </div>
    );
}
