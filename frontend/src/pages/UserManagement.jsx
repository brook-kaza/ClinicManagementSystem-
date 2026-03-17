import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserPlus, KeyRound, Shield, Ban, UserCheck, ShieldX, UserCog, CircleCheck as CheckCircle } from 'lucide-react';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({ username: '', full_name: '', password: '', role: 'Receptionist' });
    const [resetData, setResetData] = useState({ userId: null, newPassword: '' });
    const [message, setMessage] = useState('');

    const fetchUsers = async () => {
        try { setLoading(true); const res = await api.get('/users'); setUsers(res.data); }
        catch { setMessage('Failed to load users'); setTimeout(() => setMessage(''), 3000); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (user?.role === 'Admin') fetchUsers();
        else setLoading(false);
    }, [user?.role]);

    if (user?.role !== 'Admin') {
        return (
            <div className="max-w-4xl mx-auto py-16 text-center font-sans animate-fade-in">
                <div className="bg-white p-16 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/50">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                        <ShieldX className="h-12 w-12 text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 mb-3 font-heading tracking-tight">Access Restricted</h2>
                    <p className="text-zinc-500 max-w-md mx-auto text-base leading-relaxed">Administrative privileges are required to access the User Management and Security module.</p>
                </div>
            </div>
        );
    }

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try { await api.post('/users', newUser); setMessage('User account created successfully'); setNewUser({ username: '', full_name: '', password: '', role: 'Receptionist' }); fetchUsers(); setTimeout(() => setMessage(''), 3000); }
        catch (err) { setMessage(err.response?.data?.detail || 'Account creation failed'); setTimeout(() => setMessage(''), 3000); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try { await api.put(`/users/${resetData.userId}/password`, { new_password: resetData.newPassword }); setMessage('Password reset successfully'); setResetData({ userId: null, newPassword: '' }); setTimeout(() => setMessage(''), 3000); }
        catch { setMessage('Failed to reset password'); setTimeout(() => setMessage(''), 3000); }
    };

    const handleToggleStatus = async (targetUser) => {
        try { await api.put(`/users/${targetUser.id}/role`, { is_active: !targetUser.is_active }); fetchUsers(); setMessage(`Account ${targetUser.is_active ? 'deactivated' : 'activated'}`); setTimeout(() => setMessage(''), 3000); }
        catch { setMessage('Action failed'); setTimeout(() => setMessage(''), 3000); }
    };

    const handleRoleChange = async (targetUser, newRole) => {
        try { await api.put(`/users/${targetUser.id}/role`, { role: newRole }); fetchUsers(); setMessage('Role updated'); setTimeout(() => setMessage(''), 3000); }
        catch { setMessage('Role update failed'); setTimeout(() => setMessage(''), 3000); }
    };

    const inputCls = "w-full bg-zinc-50/50 border border-zinc-200 rounded-2xl py-4 px-5 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-inner hover:border-zinc-300";
    const labelCls = "block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1";

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans space-y-8 animate-fade-in pb-24">

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-center">
                        <UserCog className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 font-heading tracking-tight">System Access & Security</h1>
                        <p className="text-sm font-medium text-zinc-500 mt-1">Manage clinic staff accounts and administrative permissions.</p>
                    </div>
                </div>
                {message && (
                    <div className="bg-indigo-50 text-indigo-700 px-6 py-3.5 rounded-2xl border border-indigo-100 shadow-sm text-sm font-bold tracking-wide animate-fade-in flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Creation Form */}
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-widest mb-8 border-b border-zinc-100 pb-4 flex items-center gap-3 relative z-10">
                        <UserPlus className="w-5 h-5 text-indigo-600" /> Provision Staff Account
                    </h2>
                    <form onSubmit={handleCreateUser} className="space-y-6 relative z-10">
                        <div>
                            <label className={labelCls}>Full Name (for documents)</label>
                            <input type="text" required value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} className={inputCls} placeholder="e.g. Dr. Dawit Ayalew" />
                        </div>
                        <div>
                            <label className={labelCls}>Login Username</label>
                            <input type="text" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} className={inputCls} placeholder="e.g. dawit123" />
                        </div>
                        <div>
                            <label className={labelCls}>Initial Password</label>
                            <input type="password" required minLength="6" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className={inputCls} placeholder="Min. 6 characters" />
                        </div>
                        <div>
                            <label className={labelCls}>Access Level</label>
                            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className={`${inputCls} cursor-pointer appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.2em_1.2em]`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}>
                                <option value="Receptionist">Receptionist (Standard)</option>
                                <option value="Admin">Administrator (Elevated)</option>
                            </select>
                        </div>
                        <div className="pt-2">
                            <button className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all text-sm focus-ring flex items-center justify-center gap-2 group">
                                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Generate Account
                            </button>
                        </div>
                    </form>
                </div>

                {/* User List */}
                <div className="xl:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Active Security Directory</h2>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200">
                                    <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">User Profile</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Access Role</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-center">System Status</th>
                                    <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-20">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                                <span className="text-zinc-400 text-sm font-bold tracking-wide">Loading Directory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.map((u) => (
                                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors group">
                                        <td className="px-8 py-5 align-middle">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-sm border ${u.id === user.id ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-400 shadow-indigo-500/20' : 'bg-white text-zinc-600 border-zinc-200'}`}>
                                                    {(u.full_name || u.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-900 tracking-wide">{u.full_name || u.username}</div>
                                                    <div className="text-[10px] text-zinc-400 font-mono font-medium mt-0.5 uppercase">@{u.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 align-middle">
                                            <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)} disabled={u.id === user.id}
                                                className="text-[11px] font-bold border border-zinc-200 rounded-lg py-2 px-3 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-zinc-700 cursor-pointer shadow-sm hover:border-zinc-300 transition-colors appearance-none pr-8 bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%233f3f46' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")` }}>
                                                <option value="Receptionist">Receptionist</option>
                                                <option value="Admin">Administrator</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-5 align-middle text-center">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                <div className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                                {u.is_active ? 'Active' : 'Revoked'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setResetData({ userId: u.id, newPassword: '' })} title="Reset Password"
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl text-amber-600 bg-white border border-zinc-200 hover:bg-amber-50 hover:border-amber-200 transition-all shadow-sm focus-ring">
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(u)} disabled={u.id === user.id} title={u.is_active ? "Revoke Access" : "Restore Access"}
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-zinc-200 shadow-sm focus-ring transition-all disabled:opacity-30 disabled:cursor-not-allowed ${u.is_active ? 'text-red-500 hover:bg-red-50 hover:border-red-200' : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200'}`}>
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

            {/* Reset Modal - Glassmorphism */}
            {resetData.userId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-fade-in" onClick={() => setResetData({ userId: null, newPassword: '' })}></div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm animate-scale-in border border-zinc-200 relative z-10">
                        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                            <KeyRound className="w-7 h-7 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2 text-center font-heading">Reset Password</h3>
                        <p className="text-xs font-semibold text-zinc-500 mb-8 text-center uppercase tracking-widest">Enforce complex passwords</p>
                        <form onSubmit={handleResetPassword}>
                            <input type="password" required minLength="6" value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} className={`${inputCls} mb-6`} placeholder="Enter new password..." />
                            <div className="flex flex-col gap-3">
                                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all text-sm focus-ring">Confirm Reset</button>
                                <button type="button" onClick={() => setResetData({ userId: null, newPassword: '' })} className="w-full bg-white text-zinc-600 border border-zinc-200 font-bold py-4 rounded-2xl hover:bg-zinc-50 transition-all text-sm focus-ring shadow-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
