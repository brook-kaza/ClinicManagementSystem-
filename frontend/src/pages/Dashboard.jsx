import React, { useState, useEffect } from 'react';
import { Activity, Users, CalendarCheck, FileText, ArrowRight, UserPlus, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Patients', value: stats?.metrics?.total_patients || 0, icon: <Users className="w-6 h-6 text-indigo-500" />, bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { title: 'Visits Today', value: stats?.metrics?.visits_today || 0, icon: <Clock className="w-6 h-6 text-emerald-500" />, bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { title: 'Prescriptions', value: stats?.metrics?.total_prescriptions || 0, icon: <Activity className="w-6 h-6 text-rose-500" />, bg: 'bg-rose-50', border: 'border-rose-100' },
        { title: 'Referrals Issued', value: stats?.metrics?.total_referrals || 0, icon: <FileText className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-50', border: 'border-amber-100' },
    ];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-3xl p-6 border border-zinc-100 animate-pulse h-32 flex flex-col justify-between shadow-sm">
                            <div className="w-12 h-12 bg-zinc-100 rounded-2xl"></div>
                            <div className="h-6 w-24 bg-zinc-100 rounded"></div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 h-96 animate-pulse p-8">
                        <div className="h-6 w-48 bg-zinc-100 rounded mb-8"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full bg-zinc-50 rounded-2xl"></div>)}
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl border border-zinc-100 h-96 animate-pulse p-8">
                        <div className="h-6 w-32 bg-zinc-100 rounded mb-8"></div>
                        <div className="w-full h-48 bg-zinc-50 rounded-3xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in pb-24 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 font-heading tracking-tight mb-2">Clinic Dashboard</h1>
                    <p className="text-zinc-500 text-sm font-medium">Welcome back. Here is today's overview.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/search')} className="bg-white border-2 border-zinc-200 text-zinc-700 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-all focus-ring shadow-sm flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" /> Go to Queue
                    </button>
                    <button onClick={() => navigate('/register')} className="bg-indigo-600 border-2 border-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 hover:border-indigo-700 shadow-lg shadow-indigo-600/30 transition-all focus-ring flex items-center gap-2 text-sm">
                        <UserPlus className="w-4 h-4" /> Register Patient
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xl shadow-zinc-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70 ${card.bg}`}></div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border shadow-inner ${card.bg} ${card.border}`}>
                            {card.icon}
                        </div>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{card.title}</p>
                        <h3 className="text-4xl font-extrabold text-zinc-900 mt-2 font-heading">{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-3">
                            <Activity className="w-5 h-5 text-indigo-600" /> Recent Activity
                        </h3>
                    </div>

                    <div className="relative z-10 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                        {stats?.recent_activity?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recent_activity.map((activity) => (
                                    <div key={activity.id} className="group flex items-start gap-5 p-4 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-colors cursor-default">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border mt-0.5
                                            ${activity.type === 'patient_registration' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}">
                                            {activity.type === 'patient_registration' ? <UserPlus className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-zinc-900">{activity.title}</p>
                                            <p className="text-sm text-zinc-500 truncate mt-0.5">{activity.description}</p>
                                        </div>
                                        <div className="text-[10px] font-bold text-zinc-400 whitespace-nowrap uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded-md">
                                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Activity className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                <p className="text-zinc-500 font-medium">No system activity logged yet today.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-600 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none"></div>

                    <div className="relative z-10 text-white">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 mb-8 shadow-inner">
                            <CalendarCheck className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 font-heading tracking-tight">Need a jump start?</h2>
                        <p className="text-indigo-200 text-sm leading-relaxed mb-8">Access core clinical functions directly to save time and streamline your workflow.</p>
                    </div>

                    <div className="space-y-4 relative z-10 w-full">
                        <button onClick={() => navigate('/search')} className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-between transition-all group shadow-sm">
                            <span className="flex items-center gap-3"><Users className="w-5 h-5 text-indigo-300" /> Patient Search</span>
                            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                        </button>
                        <button onClick={() => navigate('/register')} className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-between shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all group border border-indigo-400">
                            <span className="flex items-center gap-3"><UserPlus className="w-5 h-5" /> New Registration</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
