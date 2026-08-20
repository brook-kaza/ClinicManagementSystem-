import React, { useState, useRef, useEffect } from 'react';
import { Printer, X, Plus, Calendar, CalendarDays } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { DRUG_LIST, formatDrugDisplay, formatDrugForPrescription } from '../constants/drugs';

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


// ═══════════════════════════════════════════════════════════════════════════
//  Drug Autocomplete Input
// ═══════════════════════════════════════════════════════════════════════════

const DrugAutocompleteInput = ({ value, onChange, placeholder, required }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Sync external value changes
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val);

        if (val.trim().length >= 1) {
            const lower = val.toLowerCase();
            const filtered = DRUG_LIST.filter(drug => {
                const display = formatDrugDisplay(drug).toLowerCase();
                const name = drug.name.toLowerCase();
                const category = drug.category.toLowerCase();
                return name.includes(lower) || display.includes(lower) || category.includes(lower);
            });
            setSuggestions(filtered);
            setShowDropdown(filtered.length > 0);
            setHighlightedIndex(-1);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }
    };

    const selectDrug = (drug) => {
        const formatted = formatDrugForPrescription(drug);
        setQuery(formatted);
        onChange(formatted);
        setShowDropdown(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            selectDrug(suggestions[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // Group suggestions by category for display
    const groupedSuggestions = suggestions.reduce((groups, drug) => {
        if (!groups[drug.category]) groups[drug.category] = [];
        groups[drug.category].push(drug);
        return groups;
    }, {});

    // Flatten for index tracking
    let flatIndex = -1;

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                required={required}
                className={inputCls}
                placeholder={placeholder}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                }}
                autoComplete="off"
            />
            {showDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-[280px] overflow-y-auto custom-scrollbar">
                    {Object.entries(groupedSuggestions).map(([category, drugs]) => (
                        <div key={category}>
                            <div className="px-4 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 sticky top-0 border-b border-zinc-100">
                                {category}
                            </div>
                            {drugs.map((drug) => {
                                flatIndex++;
                                const idx = flatIndex;
                                return (
                                    <button
                                        key={`${drug.name}-${drug.strength}`}
                                        type="button"
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                                            idx === highlightedIndex
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-zinc-700 hover:bg-zinc-50'
                                        }`}
                                        onMouseEnter={() => setHighlightedIndex(idx)}
                                        onClick={() => selectDrug(drug)}
                                    >
                                        <span className="font-medium">{drug.name} <span className="text-zinc-400 font-normal">{drug.strength}</span></span>
                                        <span className="text-[11px] text-zinc-400 shrink-0">{drug.form}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
//  Prescription Form (with Drug Autocomplete)
// ═══════════════════════════════════════════════════════════════════════════

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
                            <DrugAutocompleteInput
                                required
                                placeholder="Type drug name..."
                                value={med.drug}
                                onChange={(val) => updateRow(i, 'drug', val)}
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


// ═══════════════════════════════════════════════════════════════════════════
//  Sick Leave Form (with Date Range / Specific Days toggle)
// ═══════════════════════════════════════════════════════════════════════════

export const SickLeaveForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [dateMode, setDateMode] = useState('range'); // 'range' or 'specific'
    const [specificDates, setSpecificDates] = useState([]);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        diagnosis: '', recommendations: '',
    });

    const addSpecificDate = () => {
        if (!newDate) return;
        if (specificDates.includes(newDate)) {
            toast.error('This date is already added.');
            return;
        }
        const updated = [...specificDates, newDate].sort();
        setSpecificDates(updated);
    };

    const removeSpecificDate = (dateToRemove) => {
        setSpecificDates(specificDates.filter(d => d !== dateToRemove));
    };

    const formatDateDisplay = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);

        if (dateMode === 'specific' && specificDates.length === 0) {
            toast.error('Please add at least one date.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                diagnosis: formData.diagnosis,
                recommendations: formData.recommendations,
            };

            if (dateMode === 'specific') {
                const sorted = [...specificDates].sort();
                payload.start_date = sorted[0];
                payload.end_date = sorted[sorted.length - 1];
                payload.specific_dates = sorted;
            } else {
                payload.start_date = formData.start_date;
                payload.end_date = formData.end_date;
            }

            const res = await api.post(`/documents/patients/${patientId}/sick-leaves`, payload);
            await openAuthenticatedPdf(`/documents/sick-leaves/${res.data.id}/pdf`);
            onComplete();
            toast.success("Sick leave generated successfully!");
        } catch (error) { console.error(error); toast.error("Failed to save sick leave."); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Mode Toggle ──────────────────────────────────── */}
            <div>
                <label className={labelCls}>Leave Period Type</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setDateMode('range')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                            dateMode === 'range'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Date Range
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateMode('specific')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                            dateMode === 'specific'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Specific Days
                    </button>
                </div>
            </div>

            {/* ── Date Range Mode ─────────────────────────────── */}
            {dateMode === 'range' && (
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
            )}

            {/* ── Specific Days Mode ───────────────────────────── */}
            {dateMode === 'specific' && (
                <div>
                    <label className={labelCls}>Select Days</label>
                    <div className="flex gap-3 items-start">
                        <input
                            type="date"
                            className={inputCls}
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={addSpecificDate}
                            className="shrink-0 py-3.5 px-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>

                    {/* Selected dates as chips */}
                    {specificDates.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {specificDates.map(date => (
                                <div
                                    key={date}
                                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-sm py-2 px-3.5 rounded-xl group transition-all hover:bg-indigo-100"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                    {formatDateDisplay(date)}
                                    <button
                                        type="button"
                                        onClick={() => removeSpecificDate(date)}
                                        className="ml-0.5 p-0.5 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-700 transition-colors"
                                        title="Remove date"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {specificDates.length > 0 && (
                        <p className="mt-2 text-xs text-zinc-400 font-medium ml-1">
                            {specificDates.length} day{specificDates.length !== 1 ? 's' : ''} selected
                        </p>
                    )}
                </div>
            )}

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
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-5 h-5" /> Issue &amp; Print Sick Leave</>}
                </button>
            </div>
        </form>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
//  Medical Certificate Form (Official Formal Template)
// ═══════════════════════════════════════════════════════════════════════════

export const MedicalCertificateForm = ({ patientId, onComplete, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [leaveType, setLeaveType] = useState('range'); // 'none', 'range', 'specific'
    const [specificDates, setSpecificDates] = useState([]);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [formData, setFormData] = useState({
        date_examined: new Date().toISOString().split('T')[0],
        diagnosis: '',
        recommended_rest_days: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        remarks: '',
    });

    const addSpecificDate = () => {
        if (!newDate) return;
        if (specificDates.includes(newDate)) {
            toast.error('This date is already added.');
            return;
        }
        const updated = [...specificDates, newDate].sort();
        setSpecificDates(updated);
    };

    const removeSpecificDate = (dateToRemove) => {
        setSpecificDates(specificDates.filter(d => d !== dateToRemove));
    };

    const formatDateDisplay = (dateStr) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);

        if (leaveType === 'specific' && specificDates.length === 0) {
            toast.error('Please add at least one specific date.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                date_examined: formData.date_examined,
                diagnosis: formData.diagnosis,
                remarks: formData.remarks,
            };

            if (leaveType === 'range') {
                payload.start_date = formData.start_date;
                payload.end_date = formData.end_date;
                if (formData.recommended_rest_days) {
                    payload.recommended_rest_days = parseInt(formData.recommended_rest_days, 10);
                } else {
                    const d1 = new Date(formData.start_date);
                    const d2 = new Date(formData.end_date);
                    payload.recommended_rest_days = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
                }
            } else if (leaveType === 'specific') {
                const sorted = [...specificDates].sort();
                payload.start_date = sorted[0];
                payload.end_date = sorted[sorted.length - 1];
                payload.specific_dates = sorted;
                payload.recommended_rest_days = sorted.length;
            } else {
                payload.recommended_rest_days = null;
                payload.start_date = null;
                payload.end_date = null;
            }

            const res = await api.post(`/documents/patients/${patientId}/medical-certificates`, payload);
            await openAuthenticatedPdf(`/documents/medical-certificates/${res.data.id}/pdf`);
            onComplete();
            toast.success("Medical Certificate generated successfully!");
        } catch (error) { console.error(error); toast.error("Failed to save medical certificate."); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Examination Date ─────────────────────────────── */}
            <div>
                <label className={labelCls}>Date Examined</label>
                <input
                    type="date"
                    required
                    className={inputCls}
                    value={formData.date_examined}
                    onChange={(e) => setFormData({ ...formData, date_examined: e.target.value })}
                />
            </div>

            {/* ── Diagnosis / Treatment ────────────────────────── */}
            <div>
                <label className={labelCls}>Diagnosed With / Treated For</label>
                <textarea
                    required
                    className={`${inputCls} min-h-[90px] resize-y custom-scrollbar`}
                    placeholder="e.g. Acute Pulpitis, Surgical Extraction #38 under local anesthesia..."
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                />
            </div>

            {/* ── Medical Recommendation / Leave Toggle ────────── */}
            <div>
                <label className={labelCls}>Medical Recommendation / Leave</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setLeaveType('range')}
                        className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border-2 flex items-center justify-center gap-1.5 ${
                            leaveType === 'range'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                        }`}
                    >
                        <CalendarDays className="w-3.5 h-3.5" /> Date Range
                    </button>
                    <button
                        type="button"
                        onClick={() => setLeaveType('specific')}
                        className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border-2 flex items-center justify-center gap-1.5 ${
                            leaveType === 'specific'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5" /> Specific Days
                    </button>
                    <button
                        type="button"
                        onClick={() => setLeaveType('none')}
                        className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border-2 flex items-center justify-center gap-1.5 ${
                            leaveType === 'none'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
                        }`}
                    >
                        Fit For Duty (No Leave)
                    </button>
                </div>
            </div>

            {/* ── Date Range Inputs ────────────────────────────── */}
            {leaveType === 'range' && (
                <div className="grid grid-cols-2 gap-4 bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200">
                    <div>
                        <label className={labelCls}>From Date</label>
                        <input type="date" required className={inputCls} value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>To Date</label>
                        <input type="date" required className={inputCls} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                    </div>
                </div>
            )}

            {/* ── Specific Days Inputs ─────────────────────────── */}
            {leaveType === 'specific' && (
                <div className="bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200">
                    <label className={labelCls}>Select Specific Dates</label>
                    <div className="flex gap-2 items-start">
                        <input
                            type="date"
                            className={inputCls}
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={addSpecificDate}
                            className="shrink-0 py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-xs"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>

                    {specificDates.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {specificDates.map(date => (
                                <div
                                    key={date}
                                    className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs py-1.5 px-3 rounded-xl"
                                >
                                    {formatDateDisplay(date)}
                                    <button
                                        type="button"
                                        onClick={() => removeSpecificDate(date)}
                                        className="p-0.5 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-700"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Additional Remarks ───────────────────────────── */}
            <div>
                <label className={labelCls}>Additional Remarks</label>
                <textarea
                    className={`${inputCls} min-h-[90px] resize-y custom-scrollbar`}
                    placeholder="e.g. Strict bed rest, soft diet, avoid strenuous activities, adhere to prescribed medications..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
            </div>

            {/* ── Action Buttons ───────────────────────────────── */}
            <div className="flex gap-4 pt-4 border-t border-zinc-100">
                <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors text-sm focus-ring">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-3 text-sm focus-ring">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Printer className="w-5 h-5" /> Issue &amp; Print Medical Certificate</>}
                </button>
            </div>
        </form>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
//  Referral Form (unchanged)
// ═══════════════════════════════════════════════════════════════════════════

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
