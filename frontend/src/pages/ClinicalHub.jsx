import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, Info, HelpCircle, Pill, Thermometer, ExternalLink, Activity, ShieldAlert, CheckCircle2, Plus } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PrescriptionForm, SickLeaveForm, ReferralForm } from '../components/DocumentForms';

const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);

const CONDITIONS = [
    { id: 'Healthy', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    { id: 'Caries', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    { id: 'Missing', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
    { id: 'Filled', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    { id: 'Crown', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    { id: 'Bridge', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
];

const ToothAnatomy = ({ number, condition }) => {
    // Classification based on Universal Numbering System
    const isMolar = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32].includes(number);
    const isPremolar = [4, 5, 12, 13, 20, 21, 28, 29].includes(number);
    const isCanine = [6, 11, 22, 27].includes(number);
    const isIncisor = [7, 8, 9, 10, 23, 24, 25, 26].includes(number);

    let mainPath = "";
    let highlightPath = "";

    if (isMolar) {
        mainPath = "M6 5c-1.5 0-2 1-2 2.5v3.5c0 2 1 4 2 6s.5 4 1 5c.2.5 1 .5 1.5 0s1-3 1.5-5h2c.5 2 1 4.5 1.5 5s1.3.5 1.5 0c.5-1 1-3 1-5s2-4 2-6V7.5c0-1.5-.5-2.5-2-2.5H6z";
        highlightPath = "M7 7h10M7 9h10";
    } else if (isPremolar) {
        mainPath = "M8 6c-1.5 0-2 1-2 2.5v3.5c0 2 1 4 2 6s1 4 1.5 5c.2.5 1 .5 1 0s.5-3 .5-5h2c0 2 .3 4.5.5 5s.8.5 1 0c.5-1 1.5-3 1.5-5s2-4 2-6V8.5C16 7 15.5 6 14 6H8z";
        highlightPath = "M9 8h6M9 10h6";
    } else if (isCanine) {
        mainPath = "M12 4c-1.5 1-3.5 4-4 6s-1 4-1 7c0 2 1 4.5 1.5 5.5s1 0 1-1.5v-3h5v3c0 1.5.5 2.5 1 1.5s1.5-3.5 1.5-5.5c0-3-.5-5-1-7s-2.5-5-4-6z";
        highlightPath = "M12 6l-2 3M12 6l2 3";
    } else { // Incisor
        mainPath = "M7 5v9c0 2.5 1 4.5 1.5 5.5s1 0 1-1.5v-3h5v3c0 1.5.5 2.5 1 1.5s1.5-3 1.5-5.5V5H7z";
        highlightPath = "M8 7h8M8 9h8";
    }

    const getFillColor = () => {
        if (condition === 'Caries') return '#ef4444';
        if (condition === 'Filled') return '#3b82f6';
        if (condition === 'Crown') return '#a855f7';
        if (condition === 'Bridge') return '#f59e0b';
        if (condition === 'Missing') return '#cbd5e1';
        return '#ffffff';
    };

    const getStrokeColor = () => {
        if (condition === 'Caries') return '#b91c1c';
        if (condition === 'Filled') return '#1d4ed8';
        if (condition === 'Crown') return '#7e22ce';
        if (condition === 'Bridge') return '#b45309';
        if (condition === 'Missing') return '#94a3b8';
        return '#cbd5e1';
    };

    return (
        <svg viewBox="0 0 24 24" className="w-12 h-16 transition-all duration-500 group-hover:scale-110 drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={mainPath} fill={getFillColor()} stroke={getStrokeColor()} strokeWidth="1.2" strokeLinejoin="round" />
            <path d={highlightPath} stroke={getStrokeColor()} strokeWidth="0.5" strokeLinecap="round" opacity="0.3" />
            {condition === 'Missing' && <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.5" />}
        </svg>
    );
};

const ClinicalHub = () => {
    const { patientId: urlPatientId } = useParams();
    const navigate = useNavigate();
    const patientId = urlPatientId || null;
    const [patient, setPatient] = useState(null);
    const [toothStatuses, setToothStatuses] = useState({});
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [activeDocumentModal, setActiveDocumentModal] = useState(null); // 'prescription', 'sick_leave', 'referral'
    const [loading, setLoading] = useState(urlPatientId ? true : false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPatientData();
    }, [patientId]);

    const fetchPatientData = async () => {
        if (!patientId) return;
        setLoading(true);
        setError(null);
        try {
            const pRes = await api.get(`/patients/${patientId}`);
            setPatient(pRes.data);

            const tRes = await api.get(`/patients/${patientId}/teeth`);
            const statusMap = {};
            const teethData = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.value || []);

            teethData.forEach(status => {
                if (status && status.tooth_number) {
                    statusMap[status.tooth_number] = status.condition;
                }
            });
            setToothStatuses(statusMap);
        } catch (error) {
            console.error("Failed fetching clinical data", error);
            setError("Could not load clinical folder.");
        } finally {
            setLoading(false);
        }
    };

    const handleToothClick = (number) => {
        setSelectedTooth(number);
        setShowConditionModal(true);
    };

    const handleUpdateCondition = async (condition) => {
        try {
            await api.post(`/patients/${patientId}/teeth`, {
                tooth_number: selectedTooth,
                condition: condition
            });

            setToothStatuses(prev => ({ ...prev, [selectedTooth]: condition }));
            setShowConditionModal(false);
        } catch (error) {
            console.error("Failed updating tooth condition", error);
            alert("Error saving condition.");
        }
    };

    const getToothStyle = (number) => {
        const condition = toothStatuses[number];
        if (!condition || condition === 'Healthy') {
            return 'bg-white border-slate-200 text-slate-400 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600';
        }

        switch (condition) {
            case 'Caries': return 'bg-red-50 border-red-300 text-red-600 shadow-sm shadow-red-100/50';
            case 'Missing': return 'bg-slate-100 border-slate-300 text-slate-400 opacity-60';
            case 'Filled': return 'bg-blue-50 border-blue-300 text-blue-600 shadow-sm shadow-blue-100/50';
            case 'Crown': return 'bg-purple-50 border-purple-300 text-purple-600 shadow-sm shadow-purple-100/50';
            case 'Bridge': return 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm shadow-amber-100/50';
            default: return 'bg-green-50 border-green-300 text-green-600';
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
            <div className="relative mb-4">
                <div className="w-12 h-12 border-4 border-primary-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <span className="text-slate-500 font-bold text-sm tracking-widest uppercase animate-pulse">Synchronizing Patient Record...</span>
        </div>
    );

    if (!patientId || error) {
        return (
            <div className="max-w-7xl mx-auto py-24 px-4 text-center animate-fade-in font-sans">
                <div className="glass-card p-16 rounded-[3rem] border border-white inline-block shadow-2xl shadow-slate-200/50">
                    <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Activity className="h-12 w-12 text-slate-300" />
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight font-display">Access Clinical Hub</h2>
                    <p className="text-slate-500 mb-12 max-w-sm mx-auto text-lg leading-relaxed font-medium">
                        To use the interactive odontogram, please first select a patient from the digital search queue.
                    </p>
                    <Link to="/search" className="inline-flex items-center px-10 py-5 bg-primary-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 hover:scale-[1.02] transition-all active:scale-[0.98]">
                        Browse Search Queue
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">
            {/* Patient Header Card */}
            {patient && (
                <div className="bg-white rounded-[2rem] border border-slate-200 p-8 mb-10 shadow-xl shadow-slate-200/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-inner border border-indigo-100">
                            {patient.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display uppercase">{patient.full_name}</h2>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">ID: {patient.card_number}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">PHONE: {patient.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {patient.medical_alerts && (
                        <div className="animate-pulse flex items-center gap-3 bg-red-50 text-red-700 px-6 py-4 rounded-2xl border border-red-100 shadow-sm shadow-red-50">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Critical Medical Alerts</span>
                                <span className="font-bold text-sm">{patient.medical_alerts}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Odontogram Workspace */}
                <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/30">
                    <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-100">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 font-display">Interactive Odontogram</h3>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-green-100">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Live Syncing
                        </div>
                    </div>

                    <div className="space-y-16">
                        {/* Upper Jaw */}
                        <div>
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="h-[1px] bg-slate-100 flex-1"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white px-4">Upper Maxilla</span>
                                <div className="h-[1px] bg-slate-100 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                                {TOOTH_NUMBERS.slice(0, 16).map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleToothClick(num)}
                                        className={`group relative aspect-[3/4] flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ${getToothStyle(num)} hover:shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden`}
                                    >
                                        <span className="absolute top-2 left-2 text-[10px] font-bold opacity-30 group-hover:opacity-100 transition-opacity">{num}</span>
                                        <div className="w-full h-full flex flex-col items-center justify-center pt-2">
                                            <ToothAnatomy number={num} condition={toothStatuses[num]} />
                                            <div className="mt-1 text-[9px] font-bold text-slate-500 opacity-60">
                                                {[6, 11, 22, 27].includes(num) ? 'Canine' :
                                                    [7, 8, 9, 10, 23, 24, 25, 26].includes(num) ? 'Incisor' :
                                                        [4, 5, 12, 13, 20, 21, 28, 29].includes(num) ? 'Premolar' : 'Molar'}
                                            </div>
                                            {toothStatuses[num] && toothStatuses[num] !== 'Healthy' && (
                                                <div className="mt-1 text-[8px] font-bold uppercase tracking-tighter truncate max-w-[80%] opacity-80 backdrop-blur-md px-1 rounded bg-white/50">
                                                    {toothStatuses[num]}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Lower Jaw */}
                        <div>
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="h-[1px] bg-slate-100 flex-1"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white px-4">Lower Mandible</span>
                                <div className="h-[1px] bg-slate-100 flex-1"></div>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                                {TOOTH_NUMBERS.slice(16, 32).map(num => (
                                    <button
                                        key={num}
                                        onClick={() => handleToothClick(num)}
                                        className={`group relative aspect-[3/4] flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ${getToothStyle(num)} hover:shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden`}
                                    >
                                        <span className="absolute top-2 left-2 text-[10px] font-bold opacity-30 group-hover:opacity-100 transition-opacity">{num}</span>
                                        <div className="w-full h-full flex flex-col items-center justify-center pt-2">
                                            <ToothAnatomy number={num} condition={toothStatuses[num]} />
                                            <div className="mt-1 text-[9px] font-bold text-slate-500 opacity-60">
                                                {[6, 11, 22, 27].includes(num) ? 'Canine' :
                                                    [7, 8, 9, 10, 23, 24, 25, 26].includes(num) ? 'Incisor' :
                                                        [4, 5, 12, 13, 20, 21, 28, 29].includes(num) ? 'Premolar' : 'Molar'}
                                            </div>
                                            {toothStatuses[num] && toothStatuses[num] !== 'Healthy' && (
                                                <div className="mt-1 text-[8px] font-bold uppercase tracking-tighter truncate max-w-[80%] opacity-80 backdrop-blur-md px-1 rounded bg-white/50">
                                                    {toothStatuses[num]}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information Panel */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Legend Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 sticky top-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-slate-900 font-display">Clinical Status</h4>
                            <HelpCircle className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {CONDITIONS.map(cond => (
                                <div key={cond.id} className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${cond.color} border-opacity-30`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${cond.dot} shadow-sm shadow-black/10`}></div>
                                        <span className="text-sm font-bold uppercase tracking-wide">{cond.id}</span>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
                                        <Info className="w-3 h-3 opacity-50" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <button
                                onClick={() => navigate(`/history/${patientId}`, { state: { openForm: true } })}
                                className="w-full bg-slate-900 group h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-primary-600 hover:shadow-primary-100 transition-all active:scale-95 mb-4"
                            >
                                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Record Clinical Visit</span>
                            </button>

                            <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Clinical Documents</h5>
                                <button
                                    onClick={() => setActiveDocumentModal('prescription')}
                                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary-300 hover:bg-primary-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                                            <Pill className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Prescription</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
                                </button>

                                <button
                                    onClick={() => setActiveDocumentModal('sick_leave')}
                                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                            <Thermometer className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Sick Leave</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                                </button>

                                <button
                                    onClick={() => setActiveDocumentModal('referral')}
                                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Referral Form</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Modals */}
            {activeDocumentModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-100">
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${activeDocumentModal === 'prescription' ? 'bg-orange-500' :
                                    activeDocumentModal === 'sick_leave' ? 'bg-indigo-500' : 'bg-slate-800'
                                    }`}>
                                    {activeDocumentModal === 'prescription' ? <Pill className="w-5 h-5" /> :
                                        activeDocumentModal === 'sick_leave' ? <Thermometer className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-tight">
                                    {activeDocumentModal.replace('_', ' ')}
                                </h3>
                            </div>
                            <button onClick={() => setActiveDocumentModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">
                                ✕
                            </button>
                        </div>
                        <div className="p-8">
                            {activeDocumentModal === 'prescription' && <PrescriptionForm patientId={patientId} onComplete={() => setActiveDocumentModal(null)} onCancel={() => setActiveDocumentModal(null)} />}
                            {activeDocumentModal === 'sick_leave' && <SickLeaveForm patientId={patientId} onComplete={() => setActiveDocumentModal(null)} onCancel={() => setActiveDocumentModal(null)} />}
                            {activeDocumentModal === 'referral' && <ReferralForm patientId={patientId} onComplete={() => setActiveDocumentModal(null)} onCancel={() => setActiveDocumentModal(null)} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Condition Selection Modal */}
            {showConditionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
                        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                    {selectedTooth}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 font-display uppercase tracking-tight">
                                    Assess Tooth Condition
                                </h3>
                            </div>
                            <button onClick={() => setShowConditionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm">
                                ✕
                            </button>
                        </div>

                        <div className="p-8">
                            <p className="text-sm text-slate-500 font-medium mb-8">
                                Please categorize the current diagnostic state of <span className="text-primary-600 font-bold">Tooth #{selectedTooth}</span> for the permanent record.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                {CONDITIONS.map(cond => (
                                    <button
                                        key={cond.id}
                                        onClick={() => handleUpdateCondition(cond.id)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 ${cond.color} shadow-sm hover:shadow-md group`}
                                    >
                                        <div className={`w-8 h-8 rounded-full ${cond.dot} mb-2 opacity-80 group-hover:opacity-100`}></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{cond.id}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handleUpdateCondition('Healthy')}
                                className="mt-8 w-full py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-all uppercase tracking-widest text-xs"
                            >
                                Clear Diagnosis / Set Healthy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalHub;
