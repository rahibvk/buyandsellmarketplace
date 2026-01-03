'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UsersMetrics, ListingsMetrics, SupplyDemandMetrics } from '@/components/Metrics';
import { ModerationPanel } from '@/components/Moderation';
import clsx from 'clsx';
import { LogOut, LayoutDashboard, Users, ShoppingBag, TrendingUp, ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('users');
    const [days, setDays] = useState(30);
    const [region, setRegion] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    const tabs = [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'listings', label: 'Listings', icon: ShoppingBag },
        { id: 'supply', label: 'Supply vs Demand', icon: TrendingUp },
        { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
                <div className="flex items-center space-x-2 mb-8">
                    <LayoutDashboard className="h-8 w-8 text-blue-400" />
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors",
                                    activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 text-red-400 hover:text-red-300 mt-8 px-4"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        {tabs.find(t => t.id === activeTab)?.label}
                    </h2>

                    {activeTab !== 'moderation' && (
                        <div className="flex space-x-4">
                            <select
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                className="border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white text-black"
                            >
                                <option value={7}>Last 7 Days</option>
                                <option value={30}>Last 30 Days</option>
                                <option value={90}>Last 90 Days</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Filter Region..."
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="border-gray-300 rounded-md shadow-sm px-3 py-2 bg-white text-black"
                            />
                        </div>
                    )}
                </header>

                <div className="bg-white rounded-xl shadow p-6 min-h-[500px]">
                    {activeTab === 'users' && <UsersMetrics days={days} region={region} />}
                    {activeTab === 'listings' && <ListingsMetrics days={days} region={region} />}
                    {activeTab === 'supply' && <SupplyDemandMetrics days={days} region={region} />}
                    {activeTab === 'moderation' && <ModerationPanel />}
                </div>
            </main>
        </div>
    );
}
