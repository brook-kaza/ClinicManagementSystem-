import React, { useState } from 'react';
import { UserPlus, AlertCircle, Phone, CreditCard, Activity, CheckCircle2, XCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await api.post('/patients', formData);
            setStatus({ type: 'success', message: `Patient ${response.data.full_name} registered successfully on ${new Date().toLocaleDateString()}!` });
            setFormData({ full_name: '', card_number: '', phone: '', age: '', sex: '', address: '', medical_alerts: '' });

            setTimeout(() => {
                navigate(`/hub/${response.data.id}`);
            }, 1200);
        } catch (error) {
            console.error("Registration Error:", error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Registration failed.';
            setStatus({ type: 'error', message: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-widest mb-4">
                        Patient Management
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight font-display">
                        New Patient <span className="text-primary-600">Intake</span>
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium">Create a new digital record for clinical tracking and history.</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-100/50 px-4 py-2 rounded-xl border border-slate-200">
                    <Activity className="w-4 h-4" />
                    Secure Electronic Health Record
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
                    <div className="p-8 sm:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">

                            {/* Personal Information Section */}
                            <div className="space-y-8">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    Basic Information
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name *</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                                <UserPlus className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="full_name"
                                                required
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                                placeholder="e.g. Abebe Kebede"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Digital Card ID *</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                                <CreditCard className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="card_number"
                                                required
                                                value={formData.card_number}
                                                onChange={handleChange}
                                                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                                placeholder="DN-2024-XXXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Contact Phone</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                                placeholder="+251 9XX XXX XXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Age</label>
                                            <input
                                                type="number"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                                placeholder="e.g. 25"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Sex</label>
                                            <select
                                                name="sex"
                                                value={formData.sex}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                                            placeholder="e.g. Addis Ababa, Bole"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Medical Information Section */}
                            <div className="space-y-8">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    Medical Overview
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex justify-between">
                                            Medical Alerts
                                            <span className="text-amber-500 normal-case font-medium">Critical Info Only</span>
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute top-4 left-4 pointer-events-none text-amber-400 group-focus-within:text-amber-500 transition-colors">
                                                <AlertCircle className="h-5 w-5" />
                                            </div>
                                            <textarea
                                                name="medical_alerts"
                                                rows={8}
                                                value={formData.medical_alerts}
                                                onChange={handleChange}
                                                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium resize-none customized-scrollbar"
                                                placeholder="Note any allergies, chronic conditions (Diabetes, Hypertension), or medications..."
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-medium pl-1 italic">
                                            These alerts will appear highlighted on the clinical dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        {status.message && (
                            <div className={`mt-10 p-5 rounded-2xl flex items-center gap-4 animate-fade-in border ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border-green-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                {status.type === 'success'
                                    ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    : <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                                }
                                <p className="text-sm font-bold">{status.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-6 sm:px-12 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-slate-400 font-medium">
                            Fields marked with <span className="text-red-500 font-bold">*</span> are required for registration.
                        </p>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                type="button"
                                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                onClick={() => setFormData({ full_name: '', card_number: '', phone: '', age: '', sex: '', address: '', medical_alerts: '' })}
                                disabled={loading}
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 sm:flex-none h-14 px-10 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Patient Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Registration;
