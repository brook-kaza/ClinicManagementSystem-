import React, { useState } from 'react';
import { UserPlus, Activity, Phone, CreditCard, AlertCircle, ChevronRight, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const Registration = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        card_number: '',
        phone: '',
        age: '',
        sex: '',
        address: '',
        medical_alerts: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/patients', formData);
            toast.success(`Patient ${response.data.full_name} registered successfully!`);
            setFormData({ full_name: '', card_number: '', phone: '', age: '', sex: '', address: '', medical_alerts: '' });
            setTimeout(() => navigate(`/hub/${response.data.id}`), 1200);
        } catch (error) {
            const detail = error.response?.data?.detail;
            let errorMsg = 'Registration failed.';
            
            if (Array.isArray(detail)) {
                // Focus on the first error for clarity, prioritizing the last part of the location (the field name)
                const firstErr = detail[0];
                const field = firstErr.loc ? firstErr.loc[firstErr.loc.length - 1] : 'field';
                errorMsg = `${field.replace('_', ' ')}: ${firstErr.msg}`;
            } else if (typeof detail === 'string') {
                errorMsg = detail;
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-8 lg:px-12 font-sans animate-fade-in bg-white min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] block mb-3">
                        Patient Management
                    </span>
                    <h1 className="text-4xl font-extrabold text-[#1a202c] tracking-tight mb-2">
                        New Patient <span className="text-[#0ea5e9]">Intake</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Create a new digital record for clinical tracking and history.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 shadow-sm">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span>Secure Electronic Health Record</span>
                </div>
            </div>

            {/* Main Form Container */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm shadow-slate-200/40 relative overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8 sm:p-12 lg:p-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

                        {/* Left Column: Basic Information */}
                        <div className="space-y-8">
                            {/* Section Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100/50">
                                    <User className="w-6 h-6 text-blue-500" />
                                </div>
                                <h2 className="text-base font-bold text-zinc-900 tracking-wide">
                                    Basic Information
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Full Name *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                                            <UserPlus className="h-[18px] w-[18px]" />
                                        </div>
                                        <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block p-4 pl-12 transition-all placeholder:text-zinc-500 outline-none"
                                            placeholder="e.g. Abebe Kebede" />
                                    </div>
                                </div>

                                {/* Digital Card ID */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Digital Card ID *</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                                            <CreditCard className="h-[18px] w-[18px]" />
                                        </div>
                                        <input type="text" name="card_number" required value={formData.card_number} onChange={handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block p-4 pl-12 transition-all placeholder:text-zinc-500 font-mono tracking-wide outline-none uppercase"
                                            placeholder="DN-2024-XXXX" />
                                    </div>
                                </div>

                                {/* Contact Phone */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Contact Phone</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                                            <Phone className="h-[18px] w-[18px]" />
                                        </div>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block p-4 pl-12 transition-all placeholder:text-zinc-500 outline-none"
                                            placeholder="+251 9XX XXX XXX" />
                                    </div>
                                </div>

                                {/* Age & Sex Row */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Age</label>
                                        <input type="number" name="age" value={formData.age} onChange={handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block p-4 transition-all placeholder:text-zinc-500 outline-none"
                                            placeholder="e.g. 25" min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Sex</label>
                                        <select name="sex" value={formData.sex} onChange={handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block p-4 transition-all outline-none appearance-none cursor-pointer">
                                            <option value="" disabled className="text-zinc-400">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5">Home Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                                            <MapPin className="h-[18px] w-[18px]" />
                                        </div>
                                        <input type="text" name="address" value={formData.address} onChange={handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white block p-4 pl-12 transition-all placeholder:text-zinc-500 outline-none"
                                            placeholder="e.g. Bole, Addis Ababa" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Medical Overview */}
                        <div className="space-y-8">
                            {/* Section Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-2.5 bg-orange-50 rounded-2xl border border-orange-100/50">
                                    <Activity className="w-6 h-6 text-orange-500" />
                                </div>
                                <h2 className="text-base font-bold text-zinc-900 tracking-wide">
                                    Medical Overview
                                </h2>
                            </div>

                            <div className="flex flex-col h-[calc(100%-80px)]">
                                <div className="flex justify-between items-end mb-2.5 line-clamp-1">
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Medical Alerts</label>
                                    <span className="text-[10px] font-bold text-orange-500">Critical Info Only</span>
                                </div>

                                <div className="relative group flex-1">
                                    <div className="absolute top-5 left-5 pointer-events-none text-orange-400">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                    <textarea name="medical_alerts" value={formData.medical_alerts} onChange={handleChange}
                                        className="w-full h-full min-h-[220px] bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 text-[14px] font-medium rounded-[1.5rem] focus:ring-4 focus:ring-orange-500/10 focus:border-orange-400 focus:bg-white block p-6 pl-14 transition-all placeholder:text-zinc-500 resize-none outline-none leading-relaxed"
                                        placeholder="Note any allergies, chronic conditions (Diabetes, Hypertension), or medications..." />
                                </div>
                                <p className="text-[10px] italic text-zinc-400 mt-3 ml-2">
                                    These alerts will appear highlighted on the clinical dashboard.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="mt-14 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-5">
                        <button type="button" onClick={() => setFormData({ full_name: '', card_number: '', phone: '', age: '', sex: '', address: '', medical_alerts: '' })}
                            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors focus-ring">
                            Reset Default
                        </button>
                        <button type="submit" disabled={loading}
                            className="w-full sm:w-auto px-10 py-3.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60 focus-ring">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Initialize Patient Record</span>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Registration;
