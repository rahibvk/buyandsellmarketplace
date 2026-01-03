'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface MetricsProps {
    days: number;
    region: string;
}

export function UsersMetrics({ days, region }: MetricsProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['users-metrics', days, region],
        queryFn: async () => {
            const res = await api.get('/admin/metrics/users-by-region', { params: { days, region: region || undefined } });
            return res.data;
        }
    });

    if (isLoading) return <Loading />;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Users</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data?.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.region}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.city}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.user_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{item.new_users}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ListingsMetrics({ days, region }: MetricsProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['listings-metrics', days, region],
        queryFn: async () => {
            const res = await api.get('/admin/metrics/listings-by-region', { params: { days, region: region || undefined } });
            return res.data;
        }
    });

    if (isLoading) return <Loading />;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Live</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data?.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.region} ({item.city})</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.live_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sold_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{item.new_listings}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SupplyDemandMetrics({ days, region }: MetricsProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['supply-demand', days, region],
        queryFn: async () => {
            const res = await api.get('/admin/metrics/supply-demand', { params: { days, region: region || undefined } });
            return res.data;
        }
    });

    if (isLoading) return <Loading />;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supply (Listings)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand (Views)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ratio (D/S)</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data?.map((item: any, idx: number) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.region}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supply_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.demand_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                {item.demand_per_supply ? item.demand_per_supply.toFixed(2) : '0.00'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Loading() {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-blue-500" /></div>;
}
