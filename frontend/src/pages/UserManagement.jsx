import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ShieldAlert, UserPlus, KeyRound, Shield, Ban, CheckCircle, Search, UserCheck, ShieldCheck, Mail, ShieldX } from 'lucide-react';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Forms state
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Receptionist' });
    const [resetData, setResetData] = useState({ userId: null, newPassword: '' });
    const [message, setMessage] = useState('');

    // Only Admin can view this page
    if (user?.role !== 'Admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 font-sans animate-fade-in">
                <div className="glass-card p-16 rounded-[3rem] border border-white max-w-lg shadow-2xl shadow-red-100/50">
                    <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100">
                        <ShieldX className="h-12 w-12 text-red-500" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight font-display">Access Denied</h2>
                    <p className="text-slate-500 mb-0 max-w-sm mx-auto text-lg leading-relaxed font-medium">
                        You do not have the required permissions to view the System Administration module.
                    </p>
                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Administrator Authentication Required</p>
                    </div>
                </div>
            </div>
        );
    }

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            setMessage('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', newUser);
            setMessage('Account provisioned successfully');
            setNewUser({ username: '', password: '', role: 'Receptionist' });
            fetchUsers();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Provisioning failed');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/users/${resetData.userId}/password`, { new_password: resetData.newPassword });
            setMessage('Credentials reset successfully');
            setResetData({ userId: null, newPassword: '' });
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Failed to reset password');
        }
    };

    const handleToggleStatus = async (targetUser) => {
        try {
            await api.put(`/users/${targetUser.id}/role`, { is_active: !targetUser.is_active });
            fetchUsers();
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Action failed');
        }
    };

    const handleRoleChange = async (targetUser, newRole) => {
        try {
            await api.put(`/users/${targetUser.id}/role`, { role: newRole });
            fetchUsers();
        } catch (err) {
            setMessage(err.response?.data?.detail || 'Action failed');
        }
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in space-y-10">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight font-display">System <span className="text-primary-600">Administration</span></h1>
                    </div>
                    <p className="text-slate-500 font-medium">Global governance for staff accounts, security tiers, and system access.</p>
                </div>

                {message && (
                    <div className="bg-primary-50 border border-primary-200 text-primary-700 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                        <span className="text-sm font-bold uppercase tracking-wide">{message}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Column: Management Forms */}
                <div className="lg:col-span-4 space-y-8">
                    {/* User Creation Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <UserPlus className="w-24 h-24 text-slate-900" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 font-display mb-8 flex items-center gap-3">
                            Provision Staff
                        </h2>
                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Username / Identifier</label>
                                    <input
                                        type="text" required value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all font-medium text-slate-900"
                                        placeholder="e.g. dr.jdoe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Security Credential</label>
                                    <input
                                        type="password" required minLength="6" value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all font-medium text-slate-900"
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Account Tier</label>
                                    <div className="relative">
                                        <select
                                            value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 appearance-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all font-bold text-slate-900 cursor-pointer"
                                        >
                                            <option value="Receptionist">Receptionist Level</option>
                                            <option value="Admin">Administrator Level</option>
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 font-black text-xs">▼</div>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-primary-600 hover:shadow-2xl hover:shadow-primary-100 transition-all active:scale-95 shadow-xl shadow-slate-900/10">
                                Deploy Account
                            </button>
                        </form>
                    </div>

                    {/* Reset Password Card */}
                    {resetData.userId && (
                        <div className="bg-amber-50 rounded-[2.5rem] border-2 border-amber-200 p-8 shadow-2xl shadow-amber-200/20 animate-fade-in">
                            <h3 className="text-lg font-bold text-amber-900 font-display mb-6 flex items-center gap-3">
                                <KeyRound className="w-5 h-5" /> Override Credentials
                            </h3>
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2 ml-1">Forced New Password</label>
                                    <input
                                        type="password" required minLength="6" value={resetData.newPassword}
                                        onChange={e => setResetData({ ...resetData, newPassword: e.target.value })}
                                        className="w-full border-2 border-amber-200 bg-white rounded-2xl py-3.5 px-5 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-slate-900"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                                        SUBMIT RESET
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setResetData({ userId: null, newPassword: '' })}
                                        className="h-12 px-6 bg-white border border-amber-200 text-amber-700 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all"
                                    >
                                        EXIT
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Column: User Directory */}
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
                    <div className="p-8 sm:p-10 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight">Active Identity Directory</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Account Management Interface</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Search className="w-5 h-5 text-slate-300" />
                        </div>
                    </div>

                    <div className="overflow-x-auto customized-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Identity</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Security Tier</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Network Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Goverance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-24">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-300 rounded-full animate-spin mb-4"></div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying LDAP Directory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.map((u) => (
                                    <tr key={u.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${u.id === user.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 text-sm">{u.username}</span>
                                                        {u.id === user.id && <span className="text-[8px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-lg font-black tracking-widest uppercase">Authoritative</span>}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Member UID: {u.id.toString().padStart(4, '0')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="relative inline-block w-40">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u, e.target.value)}
                                                    disabled={u.id === user.id}
                                                    className={`w-full text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 py-2.5 pl-3 pr-8 appearance-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600'}`}
                                                >
                                                    <option value="Receptionist">Receptionist</option>
                                                    <option value="Admin">Administrator</option>
                                                </select>
                                                <ShieldCheck className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 ${u.role === 'Admin' ? 'text-indigo-500' : 'text-slate-300'}`} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${u.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                {u.is_active ? 'Authenticated' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setResetData({ userId: u.id, newPassword: '' })}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-amber-500 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm group-hover:shadow-md"
                                                    title="Override Credentials"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(u)}
                                                    disabled={u.id === user.id}
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all shadow-sm group-hover:shadow-md disabled:opacity-30 disabled:hover:bg-transparent ${u.is_active ? 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-300' : 'bg-white border-slate-200 text-green-500 hover:bg-green-50 hover:border-green-300'}`}
                                                    title={u.is_active ? 'Suspend Credentials' : 'Restore Access'}
                                                >
                                                    {u.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserManagement;
