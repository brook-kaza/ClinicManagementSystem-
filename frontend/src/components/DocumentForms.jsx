import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const openAuthenticatedPdf = async (url) => {
    try {
        const res = await api.get(url, { responseType: 'blob' });
        const blobUrl = window.URL.createObjectURL(res.data);
        window.open(blobUrl, '_blank');
    } catch (error) {
        console.error('PDF download failed:', error);
        toast.error('Failed to generate PDF. Please try again.');
    }
};

const inputCls = "w-full bg-white border border-zinc-200 rounded-2xl py-3.5 px-4 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:border-zinc-300";
const labelCls = "block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1";

export const PrescriptionForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [medications, setMedications] = useState([{ drug: '', dosage: '' }]);
    const [instructions, setInstructions] = useState('');

    const addRow = () => setMedications([...medications, { drug: '', dosage: '' }]);
    const removeRow = (i) => setMedications(medications.filter((_, idx) => idx !== i));
    const updateRow = (i, field, val) => {
        const updated = [...medications];
        updated[i][field] = val;
        setMedications(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            // Serialize structured rows into the backend's expected "medications" string format
            // Each line: "Drug Name / Strength / Form - Dose / Frequency / Duration"
            const medsString = medications
                .filter(m => m.drug.trim())
                .map(m => m.dosage.trim() ? `${m.drug.trim()} - ${m.dosage.trim()}` : m.drug.trim())
                .join('\n');

            const res = await api.post(`/documents/patients/${patientId}/prescriptions`, {
                medications: medsString,
                instructions: instructions
            });
            await openAuthenticatedPdf(`/documents/prescriptions/${res.data.id}/pdf`);
            onComplete();
            toast.success("Prescription generated successfully!");
        } catch (error) { console.error(error); toast.error("Failed to save prescription."); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className={labelCls}>Medications</label>
                <div className="space-y-3">
                    {medications.map((med, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
                            <input
                                required
                                className={inputCls}
                                placeholder="Drug Name / Strength / Form"
                                value={med.drug}
                                onChange={(e) => updateRow(i, 'drug', e.target.value)}
                            />
                            <input
                                className={inputCls}
                                placeholder="Dose / Frequency / Duration"
                                value={med.dosage}
                                onChange={(e) => updateRow(i, 'dosage', e.target.value)}
                            />
                            {medications.length > 1 && (
                                <button type="button" onClick={() => removeRow(i)} className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Remove">
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addRow} className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                    + Add Medication
                </button>
            </div>
            <div>
                <label className={labelCls}>Special Instructions</label>
                <input className={inputCls} placeholder="Take after meals..."
                    value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
            <div className="flex gap-4 pt-4 border-t border-zinc-100">
                <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors text-sm focus-ring">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-3 text-sm focus-ring">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-5 h-5" /> Issue & Print Prescription</>}
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
        diagnosis: '', recommendations: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await api.post(`/documents/patients/${patientId}/sick-leaves`, formData);
            await openAuthenticatedPdf(`/documents/sick-leaves/${res.data.id}/pdf`);
            onComplete();
            toast.success("Sick leave generated successfully!");
        } catch (error) { console.error(error); toast.error("Failed to save sick leave."); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className={labelCls}>Start Date</label>
                    <input type="date" required className={inputCls} value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div>
                    <label className={labelCls}>End Date</label>
                    <input type="date" required className={inputCls} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
            </div>
            <div>
                <label className={labelCls}>Diagnosis / Reason</label>
                <input required className={inputCls} placeholder="e.g. Post-extraction recovery"
                    value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} />
            </div>
            <div>
                <label className={labelCls}>Recommendations</label>
                <textarea className={`${inputCls} min-h-[100px] resize-y custom-scrollbar`} placeholder="e.g. Avoid hard foods, bed rest for 2 days"
                    value={formData.recommendations} onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })} />
            </div>
            <div className="flex gap-4 pt-4 border-t border-zinc-100">
                <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors text-sm focus-ring">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-3 text-sm focus-ring">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-5 h-5" /> Issue & Print Sick Leave</>}
                </button>
            </div>
        </form>
    );
};

export const ReferralForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ referred_to: '', reason: '', clinical_summary: '' });

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const res = await api.post(`/documents/patients/${patientId}/referrals`, formData);
            await openAuthenticatedPdf(`/documents/referrals/${res.data.id}/pdf`);
            onComplete();
            toast.success("Referral generated successfully!");
        } catch (error) { console.error(error); toast.error("Failed to save referral."); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className={labelCls}>Referred To (Clinic/Specialist)</label>
                <input required className={inputCls} placeholder="e.g. Dr. Abebe, Oral Surgeon"
                    value={formData.referred_to} onChange={(e) => setFormData({ ...formData, referred_to: e.target.value })} />
            </div>
            <div>
                <label className={labelCls}>Reason for Referral</label>
                <textarea required className={`${inputCls} min-h-[100px] resize-y custom-scrollbar`} placeholder="e.g. Impacted wisdom tooth for surgical extraction"
                    value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
            </div>
            <div>
                <label className={labelCls}>Clinical Summary</label>
                <textarea className={`${inputCls} min-h-[120px] resize-y custom-scrollbar`} placeholder="Brief history of the case..."
                    value={formData.clinical_summary} onChange={(e) => setFormData({ ...formData, clinical_summary: e.target.value })} />
            </div>
            <div className="flex gap-4 pt-4 border-t border-zinc-100">
                <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors text-sm focus-ring">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-zinc-900 text-white font-bold rounded-2xl shadow-lg shadow-zinc-900/30 hover:bg-zinc-800 disabled:opacity-60 transition-all flex items-center justify-center gap-3 text-sm focus-ring">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-5 h-5" /> Issue & Print Referral</>}
                </button>
            </div>
        </form>
    );
};
