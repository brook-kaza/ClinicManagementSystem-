import React, { useState, useEffect } from 'react';
import { Calendar, Clock, FileText, Activity, Image as ImageIcon, Phone, CheckCircle2, Plus, X, ListFilter, ClipboardCheck, ArrowLeft, Pill, Thermometer, ExternalLink, Printer } from 'lucide-react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const PatientHistory = () => {
    const { patientId: urlPatientId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const patientId = urlPatientId || null;
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(urlPatientId ? true : false);
    const [error, setError] = useState(null);

    // New Visit Form State
    const [showAddVisit, setShowAddVisit] = useState(false);
    const [newVisit, setNewVisit] = useState({
        chief_complaint: '',
        doctors_notes: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        temperature: ''
    });
    const [xrayFile, setXrayFile] = useState(null);
    const [uploadingXray, setUploadingXray] = useState(false);

    useEffect(() => {
        fetchHistory();

        if (location.state?.openForm) {
            setShowAddVisit(true);
        }
    }, [patientId, location.state]);

    const fetchHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        setError(null);
        try {
            const pRes = await api.get(`/patients/${patientId}`);
            setPatient(pRes.data);

            const vRes = await api.get(`/patients/${patientId}/visits`);
            setVisits(Array.isArray(vRes.data) ? vRes.data : []);
        } catch (error) {
            console.error("Failed to fetch patient history", error);
            setError("Could not retrieve visit timeline.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddVisit = async (e) => {
        e.preventDefault();
        try {
            // 1. Create the visit
            const response = await api.post(`/patients/${patientId}/visits`, {
                ...newVisit,
                visit_date: new Date().toISOString(),
                heart_rate: newVisit.heart_rate ? parseInt(newVisit.heart_rate) : null,
                respiratory_rate: newVisit.respiratory_rate ? parseInt(newVisit.respiratory_rate) : null,
                temperature: newVisit.temperature ? parseFloat(newVisit.temperature) : null
            });

            let addedVisit = response.data;

            // 2. Upload X-Ray if selected
            if (xrayFile) {
                setUploadingXray(true);
                const formData = new FormData();
                formData.append('file', xrayFile);
                try {
                    const uploadRes = await api.post(`/patients/${patientId}/visits/${addedVisit.id}/xray`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    addedVisit = { ...addedVisit, xray_url: uploadRes.data.url };
                } catch (err) {
                    console.error("X-Ray upload failed", err);
                    alert("Visit saved but X-Ray upload failed.");
                } finally {
                    setUploadingXray(false);
                }
            }

            setVisits([addedVisit, ...visits]);
            setNewVisit({
                chief_complaint: '',
                doctors_notes: '',
                blood_pressure: '',
                heart_rate: '',
                respiratory_rate: '',
                temperature: ''
            });
            setXrayFile(null);
            setShowAddVisit(false);
        } catch (error) {
            console.error("Failed to add visit", error);
            alert("Error saving clinical record. Connection might be unstable.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
            <div className="relative mb-4">
                <div className="w-12 h-12 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <span className="text-slate-500 font-bold text-sm tracking-widest uppercase animate-pulse">Loading Clinical Timeline...</span>
        </div>
    );

    if (!patientId || error) {
        return (
            <div className="max-w-5xl mx-auto py-24 px-4 text-center animate-fade-in font-sans">
                <div className="glass-card p-16 rounded-[3rem] border border-white inline-block shadow-2xl shadow-slate-200/50">
                    <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Clock className="h-12 w-12 text-slate-300" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight font-display">No Active Patient</h2>
                    <p className="text-slate-500 mb-12 max-w-sm mx-auto text-lg leading-relaxed font-medium">
                        To view a patient's historical records and visit timeline, please start by selecting them from the clinical queue.
                    </p>
                    <Link to="/search" className="inline-flex items-center px-10 py-5 bg-primary-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] transition-all active:scale-[0.98]">
                        Go to Patient Search
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">

            {/* Header Area */}
            {patient && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 sm:p-10 mb-10 shadow-xl shadow-slate-200/30">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl shadow-slate-900/20">
                                {patient.full_name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.2em] mb-1">Clinical Portfolio</div>
                                <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tight font-display mb-2">{patient.full_name}</h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Card ID: {patient.card_number}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Phone className="w-3 h-3" /> {patient.phone || 'N/A'}
                                    </span>
                                    {patient.created_at && (
                                        <span className="flex items-center gap-1.5 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100 text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> Registered: {new Date(patient.created_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => navigate(`/hub/${patient.id}`)}
                                className="flex-1 lg:flex-none items-center justify-center gap-2 h-14 px-6 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 flex"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Hub
                            </button>
                            <button
                                onClick={() => setShowAddVisit(!showAddVisit)}
                                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 h-14 px-8 rounded-2xl transition-all font-bold text-sm shadow-xl active:scale-95 ${showAddVisit ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 shadow-red-100' : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-200'}`}
                            >
                                {showAddVisit ? (
                                    <>
                                        <X className="w-5 h-5" />
                                        Discard Entry
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Record Clinical Visit
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Visit Entry Form */}
            {showAddVisit && (
                <div className="bg-white rounded-[2.5rem] border-2 border-primary-500/20 p-8 sm:p-10 mb-10 shadow-2xl shadow-primary-500/10 animate-fade-in">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight">New Clinical Entry</h3>
                    </div>

                    <form onSubmit={handleAddVisit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary-600 transition-colors">Chief Complaint</label>
                                <input
                                    type="text"
                                    required
                                    value={newVisit.chief_complaint}
                                    onChange={(e) => setNewVisit({ ...newVisit, chief_complaint: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all font-medium text-slate-900 shadow-sm"
                                    placeholder="Patient's reported symptoms or reason for visit..."
                                />
                            </div>

                            <div className="group">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary-600 transition-colors">Clinical Notes / Procedure Details</label>
                                <textarea
                                    rows={5}
                                    required
                                    value={newVisit.doctors_notes}
                                    onChange={(e) => setNewVisit({ ...newVisit, doctors_notes: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 px-6 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all font-medium text-slate-900 shadow-sm resize-none"
                                    placeholder="Comprehensive notes on diagnosis, treatment performed, and recommendations..."
                                />
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary-600" />
                                    Vital Signs & Imaging
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Blood Pressure</label>
                                        <input
                                            type="text"
                                            value={newVisit.blood_pressure}
                                            onChange={(e) => setNewVisit({ ...newVisit, blood_pressure: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:border-primary-500 transition-all text-sm font-medium"
                                            placeholder="120/80"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Heart Rate (BPM)</label>
                                        <input
                                            type="number"
                                            value={newVisit.heart_rate}
                                            onChange={(e) => setNewVisit({ ...newVisit, heart_rate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:border-primary-500 transition-all text-sm font-medium"
                                            placeholder="72"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Resp. Rate</label>
                                        <input
                                            type="number"
                                            value={newVisit.respiratory_rate}
                                            onChange={(e) => setNewVisit({ ...newVisit, respiratory_rate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:border-primary-500 transition-all text-sm font-medium"
                                            placeholder="16"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Temp (°C)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newVisit.temperature}
                                            onChange={(e) => setNewVisit({ ...newVisit, temperature: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:border-primary-500 transition-all text-sm font-medium"
                                            placeholder="36.5"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">X-Ray Upload</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setXrayFile(e.target.files[0])}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        />
                                        {xrayFile && (
                                            <button
                                                type="button"
                                                onClick={() => setXrayFile(null)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowAddVisit(false)}
                                className="order-2 sm:order-1 h-14 px-8 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="order-1 sm:order-2 h-14 px-10 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-primary-600 hover:shadow-primary-100 transition-all active:scale-95 text-sm uppercase tracking-[0.1em]"
                            >
                                {uploadingXray ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Uploading X-Ray...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Finalize Record</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Timeline Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 sm:p-12 shadow-xl shadow-slate-200/30">
                <div className="flex items-center justify-between mb-12 border-b border-slate-50 pb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <ListFilter className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-display uppercase tracking-tight">Visit Timeline</h3>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        Historical Data: {visits.length} Events
                    </div>
                </div>

                {visits.length === 0 ? (
                    <div className="text-center py-24 flex flex-col items-center max-w-sm mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                            <Calendar className="h-10 w-10 text-slate-200" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2 leading-tight">No Visits Logged</h4>
                        <p className="text-slate-400 font-medium text-sm">There are no documented clinical encounters for this patient in the digital archive.</p>
                    </div>
                ) : (
                    <div className="relative border-l-[3px] border-slate-100 ml-4 sm:ml-6 space-y-12 pl-10">
                        {visits.map((visit, idx) => (
                            <div key={visit.id} className="relative group/visit">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[55px] sm:-left-[58px] top-6 w-11 h-11 bg-white border-[3px] border-slate-100 rounded-2xl shadow-sm flex items-center justify-center group-hover/visit:border-primary-500 group-hover/visit:shadow-lg group-hover/visit:shadow-primary-50 transition-all duration-300 z-10">
                                    <Clock className="w-5 h-5 text-slate-300 group-hover/visit:text-primary-600 transition-colors" />
                                </div>

                                <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 p-8 hover:bg-white hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-white">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-black text-slate-300 uppercase leading-none">{new Date(visit.visit_date).toLocaleDateString([], { month: 'short' })}</span>
                                                <span className="text-lg font-black text-slate-900 leading-tight tracking-tighter">{new Date(visit.visit_date).getDate()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 tracking-tight font-display text-lg">
                                                    {visit?.visit_date ? new Date(visit.visit_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date'}
                                                </h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-0.5">
                                                    <Clock className="w-3 h-3" /> Encountered at {new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">Verified Entry</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                        <div className="lg:col-span-4">
                                            <div className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                                Chief Complaint
                                            </div>
                                            <p className="text-slate-900 font-bold text-sm leading-relaxed">{visit.chief_complaint}</p>
                                        </div>

                                        <div className="lg:col-span-8">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                Doctor's Clinical Notes
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap shadow-sm">
                                                {visit.doctors_notes}
                                            </div>

                                            {/* Vital Signs Table in Timeline */}
                                            {(visit.blood_pressure || visit.heart_rate || visit.respiratory_rate || visit.temperature) && (
                                                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {visit.blood_pressure && (
                                                        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">BP</div>
                                                            <div className="text-sm font-bold text-slate-900">{visit.blood_pressure}</div>
                                                        </div>
                                                    )}
                                                    {visit.heart_rate && (
                                                        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">HR</div>
                                                            <div className="text-sm font-bold text-slate-900">{visit.heart_rate} <span className="text-[10px] text-slate-400">bpm</span></div>
                                                        </div>
                                                    )}
                                                    {visit.respiratory_rate && (
                                                        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">RR</div>
                                                            <div className="text-sm font-bold text-slate-900">{visit.respiratory_rate}</div>
                                                        </div>
                                                    )}
                                                    {visit.temperature && (
                                                        <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Temp</div>
                                                            <div className="text-sm font-bold text-slate-900">{visit.temperature}°C</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Media Attachments */}
                                            <div className="mt-6 flex flex-wrap gap-4">
                                                {visit.xray_url ? (
                                                    <div className="w-full mb-4">
                                                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                            <ImageIcon className="w-3 h-3" /> Imaging (X-Ray)
                                                        </div>
                                                        <div className="relative group/xray max-w-md bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                            <img
                                                                src={`http://localhost:8000${visit.xray_url}`}
                                                                alt="X-Ray"
                                                                className="w-full h-auto rounded-xl grayscale hover:grayscale-0 transition-all duration-500 cursor-zoom-in"
                                                                onClick={() => window.open(`http://localhost:8000${visit.xray_url}`, '_blank')}
                                                            />
                                                            <div className="absolute inset-0 bg-indigo-900/0 group-hover/xray:bg-indigo-900/10 transition-colors pointer-events-none"></div>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Clinical Documents for this visit */}
                                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {(patient?.prescriptions || []).filter(p => p.visit_id === visit.id).map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => window.open(`http://localhost:8000/documents/prescriptions/${p.id}/pdf`, '_blank')}
                                                            className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl hover:bg-orange-50 transition-all group text-left"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                                                    <Pill className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Prescription</div>
                                                                    <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{p.medications.split('\n')[0]}</div>
                                                                </div>
                                                            </div>
                                                            <Printer className="w-4 h-4 text-orange-300 group-hover:text-orange-500" />
                                                        </button>
                                                    ))}

                                                    {(patient?.sick_leaves || []).filter(s => s.visit_id === visit.id).map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => window.open(`http://localhost:8000/documents/sick-leaves/${s.id}/pdf`, '_blank')}
                                                            className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-all group text-left"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                                                    <Thermometer className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Sick Leave</div>
                                                                    <div className="text-xs font-bold text-slate-700">{new Date(s.start_date).toLocaleDateString()} - {new Date(s.end_date).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                            <Printer className="w-4 h-4 text-indigo-300 group-hover:text-indigo-500" />
                                                        </button>
                                                    ))}

                                                    {(patient?.referrals || []).filter(r => r.visit_id === visit.id).map(r => (
                                                        <button
                                                            key={r.id}
                                                            onClick={() => window.open(`http://localhost:8000/documents/referrals/${r.id}/pdf`, '_blank')}
                                                            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all group text-left"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referral</div>
                                                                    <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{r.referred_to}</div>
                                                                </div>
                                                            </div>
                                                            <Printer className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Timeline Tail */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">End of Archive</p>
                </div>
            </div>

        </div>
    );
};

export default PatientHistory;
