import React, { useState, useEffect, useRef } from 'react';
import { Clock, Plus, X, ListFilter, ClipboardCheck, ArrowLeft, Pill, Thermometer, CheckSquare, Activity, User, ActivitySquare, CircleCheck as CheckCircle, FileText, ExternalLink } from 'lucide-react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL, SERVER_BASE_URL } from '../services/api';
import toast from 'react-hot-toast';
import { ICD11_CODES } from '../constants/icd11';
import AuthenticatedImage from '../components/AuthenticatedImage';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

const PatientHistory = () => {
    const { patientId: urlPatientId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const patientId = urlPatientId || null;
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(urlPatientId ? true : false);
    const [error, setError] = useState(null);

    const [showAddVisit, setShowAddVisit] = useState(location.state?.openForm || false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingVisitId, setEditingVisitId] = useState(null);
    const [newVisit, setNewVisit] = useState({ chief_complaint: '', doctors_notes: '', primary_diagnosis: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', temperature: '', visit_consent: false });
    const [xrayFile, setXrayFile] = useState(null);
    const [uploadingXray, setUploadingXray] = useState(false);
    const formRef = useRef(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        fetchHistory();
    }, [patientId]);

    // Handle opening form via navigation state
    useEffect(() => {
        if (location.state?.openForm) {
            setShowAddVisit(true);
            // Clear the state to prevent it from reopening on refresh/back navigation if desired, 
            // but usually, we want it to stay open if they are on this "url state".
            // However, to make it perfectly robust:
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.state]);

    const fetchHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        setError(null);
        try {
            const pRes = await api.get(`/patients/${patientId}`);
            setPatient(pRes.data);
            const vRes = await api.get(`/patients/${patientId}/visits`);
            setVisits(Array.isArray(vRes.data) ? vRes.data : []);
        } catch (e) {
            console.error("Fetch history failed:", e);
            const msg = e.response?.data?.detail || "Could not retrieve visit timeline.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVisit = async (e) => {
        e.preventDefault();

        // Consent validation
        if (!newVisit.visit_consent) {
            toast.error("Please confirm that patient has provided verbal consent for today's procedure.");
            return;
        }

        // Capture current mode before any state changes
        const wasEditing = isEditing;
        const currentEditingVisitId = editingVisitId;

        try {
            const visitData = {
                ...newVisit,
                heart_rate: newVisit.heart_rate ? parseInt(newVisit.heart_rate) : null,
                respiratory_rate: newVisit.respiratory_rate ? parseInt(newVisit.respiratory_rate) : null,
                temperature: newVisit.temperature ? parseFloat(newVisit.temperature) : null
            };

            let response;
            if (wasEditing) {
                response = await api.patch(`/patients/${patientId}/visits/${currentEditingVisitId}`, visitData);
            } else {
                response = await api.post(`/patients/${patientId}/visits`, visitData);
            }

            let addedVisit = response.data;

            // Handle X-ray upload separately
            let xrayUploadFailed = false;
            let xrayErrorMsg = "";
            if (xrayFile) {
                setUploadingXray(true);
                const formData = new FormData();
                formData.append('file', xrayFile);
                try {
                    const uploadRes = await api.post(`/patients/${patientId}/visits/${addedVisit.id}/xray`, formData);
                    addedVisit = { ...addedVisit, xray_url: uploadRes.data.url };
                } catch (uploadErr) {
                    console.error(uploadErr);
                    xrayUploadFailed = true;
                    xrayErrorMsg = uploadErr.response?.data?.detail || "Unknown upload error";
                } finally {
                    setUploadingXray(false);
                }
            }

            // Show exactly ONE toast — decide which one before any state resets
            if (xrayUploadFailed) {
                toast.error(`Visit saved but X-Ray upload failed: ${xrayErrorMsg}`);
            } else {
                toast.success(wasEditing ? "Encounter updated successfully!" : "Encounter recorded successfully!");
            }

            // Now reset all form state AFTER the toast has been dispatched
            if (wasEditing) {
                setVisits(prev => prev.map(v => v.id === currentEditingVisitId ? { ...v, ...addedVisit } : v));
            } else {
                setVisits(prev => [addedVisit, ...prev]);
            }

            setNewVisit({ chief_complaint: '', doctors_notes: '', primary_diagnosis: '', blood_pressure: '', heart_rate: '', respiratory_rate: '', temperature: '', visit_consent: false });
            setXrayFile(null);
            setShowAddVisit(false);
            setIsEditing(false);
            setEditingVisitId(null);

        } catch (err) {
            console.error(err);
            toast.error("Error saving clinical record.");
        }
    };

    const handleEditClick = (visit) => {
        setNewVisit({ chief_complaint: visit.chief_complaint || '', doctors_notes: visit.doctors_notes || '', primary_diagnosis: visit.primary_diagnosis || '', blood_pressure: visit.blood_pressure || '', heart_rate: visit.heart_rate || '', respiratory_rate: visit.respiratory_rate || '', temperature: visit.temperature || '', visit_consent: visit.visit_consent || false });
        setEditingVisitId(visit.id); setIsEditing(true); setShowAddVisit(true);
        // Scroll to the form after React renders it
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    const handleDeleteVisit = (visitId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Clinical Record',
            message: 'Are you sure you want to delete this clinical record? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/patients/${patientId}/visits/${visitId}`);
                    toast.success("Clinical record deleted successfully.");
                    setVisits(visits.filter(v => v.id !== visitId));
                    if (isEditing && editingVisitId === visitId) {
                        setShowAddVisit(false);
                        setIsEditing(false);
                        setEditingVisitId(null);
                    }
                } catch (e) {
                    console.error("Delete visit failed:", e);
                    toast.error(e.response?.data?.detail || "Failed to delete clinical record.");
                }
            }
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] font-sans">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span className="text-zinc-500 font-bold tracking-wide animate-pulse">Loading clinical timeline...</span>
        </div>
    );

    if (!patientId || error) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center font-sans animate-fade-in">
                <div className="bg-white p-16 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/50">
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                        <Clock className="h-12 w-12 text-zinc-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 mb-3 font-heading tracking-tight">No History Selected</h2>
                    <p className="text-zinc-500 mb-8 max-w-md mx-auto text-base leading-relaxed">Please select a patient from the queue to view their comprehensive clinical history and record new visits.</p>
                    <Link to="/search" state={{ intent: 'history' }} className="inline-flex py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all focus-ring">Browse Patient Queue</Link>
                </div>
            </div>
        );
    }

    const inputCls = "w-full bg-zinc-50/50 border border-zinc-200 rounded-2xl py-4 flex-1 px-5 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-inner hover:border-zinc-300 custom-scrollbar resize-y";
    const smallInputCls = "w-full bg-white border border-zinc-200 rounded-xl py-3 px-4 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:border-zinc-300 text-center";
    const labelCls = "block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1";

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in pb-24">
            {/* Header */}
            {patient && (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 mb-8 shadow-xl shadow-zinc-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-indigo-500/30 border-4 border-white">
                            {patient.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-heading tracking-tight mb-1">{patient.full_name}</h2>
                            <p className="text-zinc-500 font-medium flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-zinc-400" /> Patient Archive • Card: <span className="font-mono text-zinc-700 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">{patient.card_number}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 relative z-10">
                        <button onClick={() => navigate(`/hub/${patient.id}`)} className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all focus-ring bg-white">
                            <ArrowLeft className="w-5 h-5" /> Clinical Hub
                        </button>
                        <button onClick={async () => { try { const res = await api.get(`/documents/patients/${patient.id}/consent-form/pdf`, { responseType: 'blob' }); window.open(window.URL.createObjectURL(res.data), '_blank'); } catch (err) { console.error(err); toast.error('Failed to generate consent PDF.'); } }}
                            className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-violet-200 rounded-2xl text-sm font-bold text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-all focus-ring bg-white">
                            <FileText className="w-5 h-5" /> Print Consent
                        </button>
                        <button onClick={() => setShowAddVisit(!showAddVisit)}
                            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-white transition-all focus-ring shadow-lg ${showAddVisit ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'}`}>
                            {showAddVisit ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {showAddVisit ? 'Cancel' : 'Record Visit'}
                        </button>
                    </div>
                </div>
            )}

            {/* Form */}
            {showAddVisit && (
                <div ref={formRef} className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-10 mb-8 shadow-2xl shadow-zinc-200/50 animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-8 flex items-center gap-3 border-b border-zinc-100 pb-4 relative z-10">
                        <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                        {isEditing ? 'Edit Clinical Encounter' : 'New Clinical Encounter'}
                    </h3>
                    <form onSubmit={handleAddVisit} className="space-y-8 relative z-10">

                        {/* Per-Visit Consent Checkbox */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl"></div>
                            <label className="flex items-start gap-4 cursor-pointer pl-2">
                                <div className="mt-1 relative flex items-center justify-center shrink-0">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={newVisit.visit_consent}
                                        onChange={(e) => setNewVisit({ ...newVisit, visit_consent: e.target.checked })}
                                        className="peer w-6 h-6 appearance-none border-2 border-indigo-200 rounded-lg checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer focus-ring bg-white"
                                    />
                                    <CheckSquare className="w-4 h-4 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity drop-shadow-sm" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-indigo-950 mb-1">Patient Verbal Consent Confirmation</p>
                                    <p className="text-sm text-indigo-700/80 font-medium leading-relaxed">
                                        I confirm that verbal consent has been obtained from the patient for the procedures being performed today, and any associated risks, alternatives, and costs have been thoroughly discussed.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className={labelCls}>Chief Complaint</label>
                            <input type="text" required value={newVisit.chief_complaint} onChange={(e) => setNewVisit({ ...newVisit, chief_complaint: e.target.value })} className={inputCls} placeholder="e.g. Pain in lower right molar (Tooth #30)" />
                        </div>
                        <div>
                            <label className={labelCls}>Clinical Observations & Doctor's Notes</label>
                            <textarea rows={5} minLength="10" required value={newVisit.doctors_notes} onChange={(e) => setNewVisit({ ...newVisit, doctors_notes: e.target.value })} className={inputCls} placeholder="Detailed objective findings, diagnosis, and treatment performed..." />
                        </div>
                        <div>
                            <label className={labelCls}>Primary Official Diagnosis (ICD-11)</label>
                            <select
                                value={newVisit.primary_diagnosis}
                                onChange={(e) => setNewVisit({ ...newVisit, primary_diagnosis: e.target.value })}
                                className={inputCls + " cursor-pointer"}
                            >
                                <option value="">Select official diagnosis...</option>
                                {ICD11_CODES.map(d => (
                                    <option key={d.code} value={`${d.code} - ${d.name}`}>
                                        {d.code} - {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-8">
                            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-zinc-200/50 pb-3">
                                <ActivitySquare className="w-4 h-4 text-zinc-400" /> Vitals & Measurements
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div><label className={labelCls}>Blood Pressure</label><input type="text" placeholder="120/80" value={newVisit.blood_pressure} onChange={(e) => setNewVisit({ ...newVisit, blood_pressure: e.target.value })} className={smallInputCls} /></div>
                                <div><label className={labelCls}>Heart Rate (BPM)</label><input type="number" placeholder="72" value={newVisit.heart_rate} onChange={(e) => setNewVisit({ ...newVisit, heart_rate: e.target.value })} className={smallInputCls} /></div>
                                <div><label className={labelCls}>Resp Rate</label><input type="number" placeholder="16" value={newVisit.respiratory_rate} onChange={(e) => setNewVisit({ ...newVisit, respiratory_rate: e.target.value })} className={smallInputCls} /></div>
                                <div><label className={labelCls}>Temp (°C)</label><input type="number" step="0.1" placeholder="36.5" value={newVisit.temperature} onChange={(e) => setNewVisit({ ...newVisit, temperature: e.target.value })} className={smallInputCls} /></div>
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Upload Diagnostic Imaging (X-Ray / Scan)</label>
                            <div className="flex items-center gap-4">
                                <input type="file" accept="image/*" onChange={(e) => setXrayFile(e.target.files[0])} className="text-sm file:mr-5 file:py-3.5 file:px-6 file:rounded-xl file:border file:border-zinc-200 file:bg-white file:text-zinc-700 file:font-bold file:cursor-pointer hover:file:bg-zinc-50 hover:file:text-zinc-900 transition-colors file:shadow-sm" />
                                {xrayFile && <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Attached</span>}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-8 border-t border-zinc-100">
                            {isEditing && user?.role === 'Admin' ? (
                                <button type="button" onClick={() => handleDeleteVisit(editingVisitId)} className="text-xs font-bold text-red-500 hover:text-red-700 underline decoration-red-200 underline-offset-4 transition-colors w-full sm:w-auto text-left">
                                    Delete Record
                                </button>
                            ) : (
                                <div></div>
                            )}
                            <button type="submit" disabled={uploadingXray} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 focus-ring flex items-center justify-center gap-3 w-full sm:w-auto">
                                {uploadingXray ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processing Record...</> : 'Save Clinical Encounter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 shadow-xl shadow-zinc-200/50">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-10 border-b border-zinc-100 pb-4 flex items-center gap-3">
                    <ListFilter className="w-5 h-5 text-indigo-600" />
                    Clinical Chronology
                </h3>

                {visits.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-50/50 rounded-3xl border border-zinc-100 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-200 shadow-sm">
                            <ListFilter className="w-10 h-10 text-zinc-300" />
                        </div>
                        <h4 className="text-lg font-bold text-zinc-800 mb-2 font-heading tracking-tight">No Clinical Encounters Found</h4>
                        <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">This patient profile is currently empty. Click "New Encounter" above to record their first visit, upload X-rays, or add clinical notes.</p>
                    </div>
                ) : (
                    <div className="relative border-l-4 border-indigo-50 ml-6 pl-10 space-y-16 py-4">
                        {visits.map((visit) => (
                            <div key={visit.id} className="relative group">
                                <div className="absolute -left-[54px] top-2 w-6 h-6 bg-white border-4 border-indigo-500 rounded-full group-hover:scale-125 transition-transform shadow-sm"></div>
                                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                                    <div>
                                        <h4 className="font-extrabold text-zinc-900 text-lg group-hover:text-indigo-600 transition-colors font-heading tracking-tight">{new Date(visit.visit_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                                                <Clock className="w-3.5 h-3.5" /> {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {visit.visit_consent && (
                                                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Verbal Consent Recorded
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {user?.role === 'Admin' && (
                                            <button onClick={() => handleEditClick(visit)} className="text-[11px] font-bold text-zinc-500 hover:text-indigo-700 hover:bg-indigo-50 uppercase tracking-widest border border-zinc-200 hover:border-indigo-200 px-5 py-2.5 rounded-xl transition-all mt-4 md:mt-0 focus-ring bg-white shadow-sm">Edit</button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                    {/* LEFT: Chief Complaint */}
                                    <div className="lg:col-span-1 border-r border-zinc-100 pr-6">
                                        <span className="flex items-center gap-2 text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.18em] mb-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                                            Chief Complaint
                                        </span>
                                        <p className="font-bold text-zinc-800 text-base leading-relaxed">{visit.chief_complaint}</p>
                                    </div>

                                    {/* RIGHT: Notes + Vitals + X-ray + Documents */}
                                    <div className="lg:col-span-3 space-y-5">
                                        {/* Doctor's Notes */}
                                        <span className="flex items-center gap-2 text-[10px] font-extrabold text-blue-400 uppercase tracking-[0.18em] mb-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                                            Doctor’s Clinical Notes
                                        </span>
                                        <div className="text-zinc-800 text-sm bg-white p-5 rounded-2xl border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] whitespace-pre-wrap leading-relaxed">
                                            {visit.doctors_notes}
                                        </div>

                                        {visit.primary_diagnosis && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-[0.18em]">
                                                    Official ICD-11 Diagnosis:
                                                </span>
                                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-indigo-100 shadow-sm">
                                                    {visit.primary_diagnosis}
                                                </span>
                                            </div>
                                        )}

                                        {/* Vitals Row */}
                                        {(visit.blood_pressure || visit.heart_rate || visit.respiratory_rate || visit.temperature) && (
                                            <div className="flex flex-wrap gap-3 mt-1">
                                                {visit.blood_pressure && (
                                                    <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-w-[100px]">
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">BP</p>
                                                        <p className="font-bold text-zinc-900 text-lg leading-tight">{visit.blood_pressure}</p>
                                                    </div>
                                                )}
                                                {visit.heart_rate && (
                                                    <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-w-[100px]">
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">HR</p>
                                                        <p className="font-bold text-zinc-900 text-lg leading-tight">{visit.heart_rate} <span className="text-xs font-semibold text-zinc-400">bpm</span></p>
                                                    </div>
                                                )}
                                                {visit.respiratory_rate && (
                                                    <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-w-[100px]">
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">RR</p>
                                                        <p className="font-bold text-zinc-900 text-lg leading-tight">{visit.respiratory_rate} <span className="text-xs font-semibold text-zinc-400">/min</span></p>
                                                    </div>
                                                )}
                                                {visit.temperature && (
                                                    <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-w-[100px]">
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">TEMP</p>
                                                        <p className="font-bold text-zinc-900 text-lg leading-tight">{visit.temperature}<span className="text-xs font-semibold text-zinc-400">°C</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* X-RAY IMAGING */}
                                        {visit.xray_url && (
                                            <div className="mt-2">
                                                <span className="flex items-center gap-2 text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.18em] mb-3">
                                                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                                                    Imaging (X-Ray)
                                                </span>
                                                <div
                                                    className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm cursor-zoom-in group/img"
                                                    style={{ maxWidth: '480px' }}
                                                >
                                                    <div className="overflow-hidden" style={{ height: '220px', background: '#0a0a0a' }}>
                                                        <AuthenticatedImage
                                                            src={visit.xray_url}
                                                            alt="Dental Radiograph"
                                                            className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 group-hover/img:scale-105 transition-all duration-500"
                                                        />
                                                    </div>
                                                    <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                                        <span className="text-[10px] text-zinc-400 font-medium italic">Panoramic Radiograph — Click to view full size</span>
                                                        <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Documents Row */}
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {(patient?.prescriptions || []).filter(p => p.visit_id === visit.id).map(p => (
                                                <button key={p.id} onClick={async () => { try { const res = await api.get(`/documents/prescriptions/${p.id}/pdf`, { responseType: 'blob' }); const url = window.URL.createObjectURL(res.data); window.open(url, '_blank'); } catch (err) { console.error(err); toast.error('Failed to open prescription PDF.'); } }}
                                                    className="flex items-center gap-2 px-5 py-3 bg-white text-orange-600 border border-orange-200 shadow-sm rounded-xl text-[11px] font-bold hover:bg-orange-50 hover:border-orange-300 transition-all uppercase tracking-widest focus-ring">
                                                    <Pill className="w-4 h-4" /> Prescription Rx
                                                </button>
                                            ))}
                                            {(patient?.sick_leaves || []).filter(s => s.visit_id === visit.id).map(s => (
                                                <button key={s.id} onClick={async () => { try { const res = await api.get(`/documents/sick-leaves/${s.id}/pdf`, { responseType: 'blob' }); const url = window.URL.createObjectURL(res.data); window.open(url, '_blank'); } catch (err) { console.error(err); toast.error('Failed to open sick leave PDF.'); } }}
                                                    className="flex items-center gap-2 px-5 py-3 bg-white text-violet-600 border border-violet-200 shadow-sm rounded-xl text-[11px] font-bold hover:bg-violet-50 hover:border-violet-300 transition-all uppercase tracking-widest focus-ring">
                                                    <Thermometer className="w-4 h-4" /> Sick Leave
                                                </button>
                                            ))}
                                            {(patient?.referrals || []).filter(r => r.visit_id === visit.id).map(r => (
                                                <button key={r.id} onClick={async () => { try { const res = await api.get(`/documents/referrals/${r.id}/pdf`, { responseType: 'blob' }); const url = window.URL.createObjectURL(res.data); window.open(url, '_blank'); } catch (err) { console.error(err); toast.error('Failed to open referral PDF.'); } }}
                                                    className="flex items-center gap-2 px-5 py-3 bg-white text-teal-600 border border-teal-200 shadow-sm rounded-xl text-[11px] font-bold hover:bg-teal-50 hover:border-teal-300 transition-all uppercase tracking-widest focus-ring">
                                                    <ExternalLink className="w-4 h-4" /> Referral
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default PatientHistory;
