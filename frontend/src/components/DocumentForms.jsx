import React, { useState } from 'react';
import { FileText, Calendar, ClipboardList, Send, X, Printer, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export const PrescriptionForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        medications: '',
        instructions: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/documents/patients/${patientId}/prescriptions`, formData);
            window.open(`http://localhost:8000/documents/prescriptions/${res.data.id}/pdf`, '_blank');
            onComplete();
        } catch (error) {
            console.error("Prescription error", error);
            alert("Failed to save prescription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Medications (One per line)</label>
                    <textarea
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-slate-900 min-h-[150px]"
                        placeholder="e.g. Amoxicillin 500mg - 1 tab tid for 5 days"
                        value={formData.medications}
                        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Special Instructions</label>
                    <input
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-slate-900"
                        placeholder="Take after meals..."
                        value={formData.instructions}
                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    />
                </div>
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="flex-2 h-14 px-8 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-4 h-4" /> Issue & Print</>}
                </button>
            </div>
        </form>
    );
};

export const SickLeaveForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        recommendations: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/documents/patients/${patientId}/sick-leaves`, formData);
            window.open(`http://localhost:8000/documents/sick-leaves/${res.data.id}/pdf`, '_blank');
            onComplete();
        } catch (error) {
            console.error("Sick leave error", error);
            alert("Failed to save sick leave.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Start Date</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">End Date</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Diagnosis / Reason</label>
                <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900"
                    placeholder="e.g. Post-extraction recovery"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Recommendations</label>
                <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900 min-h-[100px]"
                    placeholder="e.g. Avoid hard foods, strictly bed rest for 2 days"
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="flex-2 h-14 px-8 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-4 h-4" /> Issue & Print</>}
                </button>
            </div>
        </form>
    );
};

export const ReferralForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        referred_to: '',
        reason: '',
        clinical_summary: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post(`/documents/patients/${patientId}/referrals`, formData);
            window.open(`http://localhost:8000/documents/referrals/${res.data.id}/pdf`, '_blank');
            onComplete();
        } catch (error) {
            console.error("Referral error", error);
            alert("Failed to save referral.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Referred To (Clinic/Specialist)</label>
                <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900"
                    placeholder="e.g. Dr. Abebe, Oral Surgeon"
                    value={formData.referred_to}
                    onChange={(e) => setFormData({ ...formData, referred_to: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Reason for Referral</label>
                <textarea
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900 min-h-[100px]"
                    placeholder="e.g. Impacted wisdom tooth for surgical extraction"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Clinical Summary</label>
                <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:border-primary-500 transition-all font-medium text-slate-900 min-h-[100px]"
                    placeholder="Brief history of the case..."
                    value={formData.clinical_summary}
                    onChange={(e) => setFormData({ ...formData, clinical_summary: e.target.value })}
                />
            </div>
            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="flex-2 h-14 px-8 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-4 h-4" /> Issue & Print</>}
                </button>
            </div>
        </form>
    );
};
