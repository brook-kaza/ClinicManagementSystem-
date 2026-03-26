import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FileText, ChevronRight, Activity, ShieldAlert, Plus, CircleCheck as CheckCircle, AlertCircle, FileSignature } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PrescriptionForm, SickLeaveForm, ReferralForm } from '../components/DocumentForms';
import PatientBilling from '../components/PatientBilling';
import AccessDenied from '../components/AccessDenied';
import ConfirmModal from '../components/ConfirmModal';
import BookingModal from '../components/BookingModal';
import toast from 'react-hot-toast';

const TOOTH_NUMBERS = Array.from({ length: 32 }, (_, i) => i + 1);

const TOOTH_SHORT_NAMES = {
    1: 'Molar', 2: 'Molar', 3: 'Molar', 4: 'Premolar', 5: 'Premolar', 6: 'Canine', 7: 'Incisor', 8: 'Incisor',
    9: 'Incisor', 10: 'Incisor', 11: 'Canine', 12: 'Premolar', 13: 'Premolar', 14: 'Molar', 15: 'Molar', 16: 'Molar',
    17: 'Molar', 18: 'Molar', 19: 'Molar', 20: 'Premolar', 21: 'Premolar', 22: 'Canine', 23: 'Incisor', 24: 'Incisor',
    25: 'Incisor', 26: 'Incisor', 27: 'Canine', 28: 'Premolar', 29: 'Premolar', 30: 'Molar', 31: 'Molar', 32: 'Molar'
};

const TOOTH_NAMES = {
    1: '3rd Molar', 2: '2nd Molar', 3: '1st Molar', 4: '2nd Premolar', 5: '1st Premolar', 6: 'Canine', 7: 'Lateral Incisor', 8: 'Central Incisor',
    9: 'Central Incisor', 10: 'Lateral Incisor', 11: 'Canine', 12: '1st Premolar', 13: '2nd Premolar', 14: '1st Molar', 15: '2nd Molar', 16: '3rd Molar',
    17: '3rd Molar', 18: '2nd Molar', 19: '1st Molar', 20: '2nd Premolar', 21: '1st Premolar', 22: 'Canine', 23: 'Lateral Incisor', 24: 'Central Incisor',
    25: 'Central Incisor', 26: 'Lateral Incisor', 27: 'Canine', 28: '1st Premolar', 29: '2nd Premolar', 30: '1st Molar', 31: '2nd Molar', 32: '3rd Molar'
};

const getToothType = (num) => {
    const name = TOOTH_SHORT_NAMES[num];
    if (name === 'Molar') return 'molar';
    if (name === 'Premolar') return 'premolar';
    if (name === 'Canine') return 'canine';
    return 'incisor';
};

const TOOTH_CONDITIONS = [
    { id: 'Healthy', fill: '#f0f1f5', stroke: '#b8bcc8', text: 'text-zinc-500', dot: '#22c55e', label: 'HEALTHY', bg: 'bg-emerald-50', border: 'border-emerald-200', textColor: 'text-emerald-700' },
    { id: 'Caries', fill: '#fee2e2', stroke: '#ef4444', text: 'text-red-500', dot: '#ef4444', label: 'CARIES', bg: 'bg-red-50', border: 'border-red-200', textColor: 'text-red-700' },
    { id: 'Missing', fill: '#f4f4f5', stroke: '#a1a1aa', strokeDash: '4', text: 'text-zinc-400', dot: '#a1a1aa', label: 'MISSING', bg: 'bg-zinc-50', border: 'border-zinc-200', textColor: 'text-zinc-600' },
    { id: 'Filled', fill: '#dbeafe', stroke: '#3b82f6', text: 'text-blue-500', dot: '#3b82f6', label: 'FILLED', bg: 'bg-blue-50', border: 'border-blue-200', textColor: 'text-blue-700' },
    { id: 'Crown', fill: '#f3e8ff', stroke: '#a855f7', text: 'text-purple-500', dot: '#a855f7', label: 'CROWN', bg: 'bg-purple-50', border: 'border-purple-200', textColor: 'text-purple-700' },
    { id: 'Bridge', fill: '#fef3c7', stroke: '#f59e0b', text: 'text-amber-500', dot: '#f59e0b', label: 'BRIDGE', bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-700' }
];

const ToothSVG = ({ type, isUpper, condition }) => {
    const config = TOOTH_CONDITIONS.find(c => c.id === condition) || TOOTH_CONDITIONS[0];
    const isMissing = condition === 'Missing';
    const isCaries = condition === 'Caries';
    const isCrown = condition === 'Crown';
    const isFilled = condition === 'Filled';

    const renderToothGroup = () => {
        const paths = {
            molar: {
                outline: "M10 2 C6 2 4 6 4 12C4 16 6 20 8 22C8 26 7 28 6 34C5 40 8 44 11 44C13 44 14 40 14 36C14 40 15 44 18 44C20 44 21 40 21 36C21 40 22 44 24 44C27 44 28 40 27 34C26 28 25 26 25 22C27 20 29 16 29 12C29 6 27 2 23 2C20 2 18 4 16.5 4C15 4 13 2 10 2 Z",
                crown: "M10 2 C6 2 4 6 4 12C4 16 6 20 8 22C11 23 16 24 25 22C27 20 29 16 29 12C29 6 27 2 23 2C20 2 18 4 16.5 4C15 4 13 2 10 2 Z",
                innerCrown: "M10.5 4C8 4 6.5 7 6.5 11C6.5 15 8 18 9.5 20C12 21 16 21.5 23.5 20C25 18 26.5 15 26.5 11C26.5 7 25 4 22.5 4C20 4 18.5 6 16.5 6C14.5 6 13 4 10.5 4Z",
                crevice: "M9 12 Q16 16 24 12 M13 8 L13 16 M20 8 L20 16 M16.5 6 L16.5 18",
                caries: [{ cx: 12, cy: 11, r: 2.5 }, { cx: 21, cy: 12, r: 3 }],
                filled: [{ cx: 16.5, cy: 12, rx: 6, ry: 4 }],
                crownOverlay: "M 8 22 Q 16.5 25 25 22 L 27 12 C 27 6 25 2 21 2 L 12 2 C 8 2 6 6 6 12 Z"
            },
            premolar: {
                outline: "M12 2 C8 2 6 6 6 12C6 16 8 20 10 22C10 26 9 30 8 36C7 42 10 44 13 44C15 44 16.5 38 16.5 34C16.5 38 18 44 20 44C23 44 26 42 25 36C24 30 23 26 23 22C25 20 27 16 27 12C27 6 25 2 21 2C19 2 18 4 16.5 4C15 4 14 2 12 2 Z",
                crown: "M12 2 C8 2 6 6 6 12C6 16 8 20 10 22C12 23 17 23 23 22C25 20 27 16 27 12C27 6 25 2 21 2C19 2 18 4 16.5 4C15 4 14 2 12 2 Z",
                innerCrown: "M12 4.5C9 4.5 8 7 8 11C8 14 9.5 17 11 19C14 20 19 20 22 19C23.5 17 25 14 25 11C25 7 24 4.5 21 4.5C19 4.5 18 6 16.5 6C15 6 14 4.5 12 4.5Z",
                crevice: "M10 12 Q16 15 23 12 M16.5 7 L16.5 17",
                caries: [{ cx: 16.5, cy: 12, r: 3.5 }],
                filled: [{ cx: 16.5, cy: 12, rx: 5, ry: 3.5 }],
                crownOverlay: "M 10 22 Q 16.5 24 23 22 L 25 12 C 25 6 22 2 17 2 L 15 2 C 10 2 8 6 8 12 Z"
            },
            canine: {
                outline: "M16.5 2 C12 2 10 6 10 12C10 17 11.5 20 13 22C13 26 12 32 11 38C10 44 14 46 16.5 46C19 46 23 44 22 38C21 32 20 26 20 22C21.5 20 23 17 23 12C23 6 21 2 16.5 2 Z",
                crown: "M16.5 2 C12 2 10 6 10 12C10 17 11.5 20 13 22C14 23 19 23 20 22C21.5 20 23 17 23 12C23 6 21 2 16.5 2 Z",
                innerCrown: "M16.5 4C13.5 4 12 7 12 11.5C12 16 13.5 18.5 14.5 20C15.5 21 17.5 21 18.5 20C19.5 18.5 21 16 21 11.5C21 7 19.5 4 16.5 4Z",
                crevice: "M14 10 L16.5 14 L19 10 M16.5 14 L16.5 18",
                caries: [{ cx: 16.5, cy: 14, r: 3 }],
                filled: [{ cx: 16.5, cy: 13, rx: 3, ry: 4.5 }],
                crownOverlay: "M 13 22 Q 16.5 24 20 22 L 22 12 C 22 6 19 2 16.5 2 C 14 2 11 6 11 12 Z"
            },
            incisor: {
                outline: "M12 2C9 2 8 5 8 11C8 16 9.5 19 11 21C11 25 10 32 9 38C8 44 12 46 16.5 46C21 46 25 44 24 38C23 32 22 25 22 21C23.5 19 25 16 25 11C25 5 24 2 21 2C19 2 17 3 16.5 3C16 3 14 2 12 2 Z",
                crown: "M12 2C9 2 8 5 8 11C8 16 9.5 19 11 21C13 22 20 22 22 21C23.5 19 25 16 25 11C25 5 24 2 21 2C19 2 17 3 16.5 3C16 3 14 2 12 2 Z",
                innerCrown: "M12.5 4C10 4 9.5 7 9.5 11C9.5 15 11 18 12 19.5C14 20.5 19 20.5 21 19.5C22 18 23.5 15 23.5 11C23.5 7 23 4 20.5 4C19 4 17.5 5 16.5 5C15.5 5 14 4 12.5 4Z",
                crevice: "M11 10 C16.5 14 16.5 14 22 10 M16.5 12 L16.5 17",
                caries: [{ cx: 16.5, cy: 11, r: 3 }],
                filled: [{ cx: 16.5, cy: 11, rx: 4, ry: 3 }],
                crownOverlay: "M 11 21 Q 16.5 23 22 21 L 24 11 C 24 5 21 2 16.5 2 C 12 2 9 5 9 11 Z"
            }
        };

        const t = paths[type];

        // Fill color based on condition
        const isHealthy = condition === 'Healthy';
        const outlineFill = isHealthy ? '#f0f2f5' : config.fill;
        const crownFill = isHealthy ? '#ffffff' : (isCrown ? '#f3e8ff' : '#f8fafc');
        const innerCrownFill = isHealthy ? '#f8fafc' : (isCrown ? '#e9d5ff' : '#eef2f7');
        const strokeColor = config.stroke;
        const isDashed = isMissing;

        return (
            <g className={`transition-all duration-300 ${isUpper ? '' : 'origin-center rotate-180'} ${isMissing ? 'opacity-35 grayscale' : ''}`}>
                {/* Root area with subtle fill */}
                <path d={t.outline} fill={outlineFill} stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={isDashed ? "4 4" : "0"} />

                {/* Crown specific overlay */}
                {!isMissing && (
                    <>
                        {isCrown ? (
                            <path d={t.crownOverlay} fill="url(#crownGrad)" stroke="#9333ea" strokeWidth="1" strokeLinejoin="round" />
                        ) : (
                            <>
                                <path d={t.crown} fill={crownFill} stroke={strokeColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Inner enamel detail */}
                                <path d={t.innerCrown} fill={innerCrownFill} stroke="none" />
                            </>
                        )}

                        {/* Fissure lines */}
                        {!isCrown && !isFilled && !isMissing && (
                            <path d={t.crevice} stroke={isHealthy ? "#d1d5db" : (isCaries ? "#fca5a5" : strokeColor)} strokeWidth={isCaries ? "1.2" : "0.8"} strokeLinecap="round" fill="none" opacity="0.7" />
                        )}

                        {/* Crown shimmer line */}
                        {isCrown && (
                            <path d={t.crevice} stroke="#ede9fe" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5" />
                        )}

                        {/* Specular highlight on crown */}
                        {!isCrown && !isCaries && !isFilled && (
                            <ellipse cx="14" cy={isUpper ? "9" : "9"} rx="4" ry="2.5" fill="white" opacity="0.45" />
                        )}

                        {/* Condition Overlays */}
                        {isCaries && t.caries.map((c, i) => (
                            <circle key={`caries-${i}`} cx={c.cx} cy={c.cy} r={c.r} fill="url(#cariesGrad)" opacity="0.9" />
                        ))}

                        {isFilled && t.filled.map((c, i) => (
                            <ellipse key={`filled-${i}`} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="url(#filledGrad)" stroke="#1d4ed8" strokeWidth="0.4" />
                        ))}
                    </>
                )}
                {isMissing && (
                    <path d="M6 23 L26 23 M16 13 L16 33" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" transform="rotate(45 16 23)" opacity="0.6" />
                )}
            </g>
        );
    };

    return (
        <svg viewBox="0 0 33 48" className="w-full h-full overflow-visible" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}>
            <defs>
                {/* Gradient for crown overlay */}
                <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d8b4fe" />
                    <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                {/* Gradient for caries spots */}
                <radialGradient id="cariesGrad" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#991b1b" />
                </radialGradient>
                {/* Gradient for filled areas */}
                <linearGradient id="filledGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
            </defs>
            <g>
                {renderToothGroup()}
            </g>
        </svg>
    );
};

const ClinicalHub = () => {
    const { patientId: urlPatientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const patientId = urlPatientId || null;
    const [patient, setPatient] = useState(null);
    const [toothStatuses, setToothStatuses] = useState({});

    const [selectedTooth, setSelectedTooth] = useState(null);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [activeDocumentModal, setActiveDocumentModal] = useState(null);
    const [loading, setLoading] = useState(urlPatientId ? true : false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' or 'billing'

    const [savingConsent, setSavingConsent] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [editPatientData, setEditPatientData] = useState({ full_name: '', phone: '', age: '', sex: '', address: '', medical_alerts: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => { fetchPatientData(); }, [patientId]);

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
                if (status && status.tooth_number) statusMap[status.tooth_number] = status.condition;
            });
            setToothStatuses(statusMap);
        } catch (err) {
            console.error("Failed fetching clinical data", err);
            setError("Could not load clinical folder.");
            toast.error("Failed to load patient data.");
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalConsent = async () => {
        setSavingConsent(true);
        try {
            await api.patch(`/patients/${patientId}/consent`, {
                consent_given: true,
                consent_by: user?.username || 'System'
            });
            setPatient(prev => ({ ...prev, consent_given: true }));
            toast.success("Patient consent recorded successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Error recording consent. Please try again.");
        } finally {
            setSavingConsent(false);
        }
    };

    const openEditPatient = () => {
        setEditPatientData({
            full_name: patient.full_name || '',
            phone: patient.phone || '',
            age: patient.age || '',
            sex: patient.sex || '',
            address: patient.address || '',
            medical_alerts: patient.medical_alerts || ''
        });
        setShowEditPatientModal(true);
    };

    const handleUpdatePatient = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editPatientData,
                age: editPatientData.age ? parseInt(editPatientData.age) : null
            };
            Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
            
            const res = await api.put(`/patients/${patientId}`, payload);
            setPatient(res.data);
            setShowEditPatientModal(false);
            toast.success("Patient profile updated successfully.");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to update patient.");
        }
    };

    const handleDeletePatient = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Patient Profile',
            message: `Are you absolutely sure you want to delete ${patient.full_name}? This will permanently remove all their clinical visits, invoices, payments, and generated documents. This action CANNOT BE UNDONE.`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/patients/${patientId}`);
                    toast.success("Patient profile permanently deleted.");
                    navigate('/search');
                } catch (err) {
                    toast.error(err.response?.data?.detail || "Failed to delete patient profile.");
                }
            }
        });
    };

    const handleToothClick = (number) => { setSelectedTooth(number); setShowConditionModal(true); };

    // Lock body scroll when any modal is open
    useEffect(() => {
        const isModalOpen = !!activeDocumentModal || showConditionModal;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [activeDocumentModal, showConditionModal]);

    const handleUpdateCondition = async (condition) => {
        try {
            await api.post(`/patients/${patientId}/teeth`, { tooth_number: selectedTooth, condition });
            setToothStatuses(prev => ({ ...prev, [selectedTooth]: condition }));
            setSelectedTooth(null);
            setShowConditionModal(false);
            toast.success(`Tooth #${selectedTooth} updated to ${condition}.`);
        } catch (err) {
            console.error(err);
            toast.error("Error saving condition.");
        }
    };

    // 4-row grid matching the reference image
    const upperRow1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const upperRow2 = [9, 10, 11, 12, 13, 14, 15, 16];
    const lowerRow1 = [17, 18, 19, 20, 21, 22, 23, 24];
    const lowerRow2 = [25, 26, 27, 28, 29, 30, 31, 32];

    const renderToothCard = (num, isUpper) => {
        const condition = toothStatuses[num] || 'Healthy';
        const config = TOOTH_CONDITIONS.find(c => c.id === condition) || TOOTH_CONDITIONS[0];
        const isSelected = selectedTooth === num;
        return (
            <button key={num} onClick={() => handleToothClick(num)}
                className={`group flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer focus-ring relative w-full
                    ${isSelected ? 'bg-indigo-50 border-2 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-105 z-10' : 'border-2 border-transparent hover:border-zinc-200 hover:bg-zinc-50/80 hover:shadow-md'}
                `}
            >
                <span className={`text-[9px] sm:text-[11px] font-bold mb-0.5 sm:mb-1 ${config.text} transition-colors`}>{num}</span>
                <div className="w-6 h-8 sm:w-10 sm:h-14 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <ToothSVG type={getToothType(num)} isUpper={isUpper} condition={condition} />
                </div>
                <span className="hidden sm:block text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1 scale-90 sm:scale-100">{TOOTH_SHORT_NAMES[num]}</span>
            </button>
        );
    };

    // Default Receptionists to the Financial Ledger tab
    useEffect(() => {
        if (user?.role === 'Receptionist') {
            setActiveTab('billing');
        }
    }, [user]);

    // Full screen loading
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] font-sans">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <span className="text-zinc-500 font-bold tracking-wide">Accessing clinical records...</span>
        </div>
    );

    if (!patientId || error) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-fade-in font-sans">
                <div className="bg-white p-12 rounded-[2rem] border border-zinc-200 shadow-xl shadow-zinc-200/50">
                    <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                        <Activity className="h-10 w-10 text-zinc-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2 font-heading tracking-tight">Patient Folder Not Open</h2>
                    <p className="text-zinc-500 mb-8 text-sm max-w-md mx-auto leading-relaxed">Select a patient from the queue to access their clinical charting tools, specialized procedures, and administrative documents.</p>
                    <Link to="/search" className="inline-flex items-center px-8 py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all group focus-ring">
                        Go to Clinical Queue <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    // CONSENT GATE
    if (patient && !patient.consent_given) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl p-4 font-sans animate-fade-in">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 animate-scale-in">
                    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[150%] bg-white/5 rotate-12 pointer-events-none"></div>
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20 shadow-inner">
                            <FileSignature className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight font-heading mb-2">Global Consent Required</h2>
                        <p className="text-indigo-200 text-sm font-medium tracking-widest uppercase">Standard of Care Protocol</p>
                    </div>
                    <div className="p-8 sm:p-10">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 mb-8 text-sm text-zinc-600 leading-relaxed space-y-4">
                            <p><strong>Important Authorization:</strong> A signed and acknowledged global consent form is mandatory before initiating any clinical treatment or charting for <b className="text-zinc-900">{patient.full_name}</b>.</p>
                            <p>This confirms that the clinic's standard terms of care, treatment risk disclosures, and data handling privacy policies have been communicated verbally and agreed upon.</p>
                            <ul className="list-disc pl-5 space-y-1 text-zinc-500 font-medium">
                                <li>The patient understands baseline risks for standard dental procedures.</li>
                                <li>The clinic holds permission to maintain accurate digital health records.</li>
                                <li>Per-visit specific consents will still be required for invasive surgical procedures.</li>
                            </ul>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => navigate('/search')} className="flex-1 py-4 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-50 focus-ring transition-colors shadow-sm">Cancel & Return</button>
                            <button onClick={handleGlobalConsent} disabled={savingConsent} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 focus-ring disabled:opacity-60 transition-all flex items-center justify-center gap-3 group">
                                {savingConsent ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Patient Confirms & Agrees</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in pb-24">
            {/* Header */}
            {patient && (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 mb-8 shadow-xl shadow-zinc-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-indigo-500/30 border-4 border-white">
                            {patient.full_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <h2 className="text-2xl font-bold text-zinc-900 font-heading tracking-tight">{patient.full_name}</h2>
                                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 shadow-sm">
                                    <CheckCircle className="w-3.5 h-3.5" /> Consent Active
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-semibold text-zinc-500 flex-wrap">
                                <span className="bg-zinc-100 px-2 py-0.5 rounded-md font-mono text-zinc-600">{patient.card_number}</span>
                                <span>•</span>
                                <span>Age: {patient.age || '-'}</span>
                                <span>•</span>
                                <span>{patient.sex || 'Unknown Sex'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 relative z-10">
                        {patient.medical_alerts && (
                            <div className="bg-red-50 text-red-700 px-5 py-4 rounded-2xl border border-red-100 flex items-start gap-4 text-sm font-semibold max-w-md shadow-sm shadow-red-500/5">
                                <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{patient.medical_alerts}</span>
                            </div>
                        )}
                        <div className="flex bg-white border border-zinc-200 rounded-xl shadow-sm text-xs font-bold overflow-hidden">
                            <button onClick={() => setShowBookingModal(true)} className="px-5 py-2.5 text-emerald-600 hover:bg-emerald-50 transition-colors border-r border-zinc-200 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Book Appointment
                            </button>
                            {user?.role === 'Admin' && (
                                <button onClick={openEditPatient} className="px-5 py-2.5 text-zinc-600 hover:bg-zinc-50 transition-colors">Edit Profile</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            {patient && (
                <div className="flex items-center gap-4 mb-8 bg-zinc-50 p-2 rounded-2xl border border-zinc-200 inline-flex">
                    <button
                        onClick={() => setActiveTab('clinical')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all focus-ring ${activeTab === 'clinical' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Clinical Charting
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all focus-ring flex items-center gap-2 ${activeTab === 'billing' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Financial Ledger
                    </button>
                </div>
            )}

            {activeTab === 'clinical' ? (
                user?.role === 'Receptionist' ? <AccessDenied /> :
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Odontogram */}
                    <div className="xl:col-span-3 bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 relative">
                        <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-5">
                            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" /> Interactive Odontogram
                            </h3>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">Universal Numbering</span>
                        </div>

                        {/* Upper Maxilla */}
                        <div className="relative mb-4 overflow-x-auto pb-4 hide-scrollbar">
                            <div className="min-w-[320px] sm:min-w-0">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="flex-1 h-px bg-zinc-200"></div>
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-4">Upper Maxilla</span>
                                    <div className="flex-1 h-px bg-zinc-200"></div>
                                </div>
                                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 lg:gap-2 mb-2">
                                    {upperRow1.map(num => renderToothCard(num, true))}
                                </div>
                                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 lg:gap-2">
                                    {upperRow2.map(num => renderToothCard(num, true))}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="my-5 border-t-2 border-dashed border-zinc-200"></div>

                        {/* Lower Mandible */}
                        <div className="relative overflow-x-auto pb-4 hide-scrollbar">
                            <div className="min-w-[320px] sm:min-w-0">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="flex-1 h-px bg-zinc-200"></div>
                                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-4">Lower Mandible</span>
                                    <div className="flex-1 h-px bg-zinc-200"></div>
                                </div>
                                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 lg:gap-2 mb-2">
                                    {lowerRow1.map(num => renderToothCard(num, false))}
                                </div>
                                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 lg:gap-2">
                                    {lowerRow2.map(num => renderToothCard(num, false))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar — Tools Panel */}
                    <div className="space-y-8">
                        {/* Condition Legend */}
                        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50">
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 border-b border-zinc-100 pb-3">Diagnostics Legend</h4>
                            <div className="space-y-2">
                                {TOOTH_CONDITIONS.map(cond => (
                                    <div key={cond.id} className={`flex items-center gap-3 ${cond.bg} p-3 rounded-xl border ${cond.border}`}>
                                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cond.dot }}></div>
                                        <span className={`text-xs font-bold ${cond.textColor} uppercase tracking-wider`}>{cond.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-5 border-b border-zinc-100 pb-3 relative z-10">Workflow Shortcuts</h4>

                            <div className="relative z-10">
                                <button onClick={() => navigate(`/history/${patientId}`, { state: { openForm: true } })}
                                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl text-sm mb-5 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 focus-ring transition-all flex items-center justify-center gap-2 group">
                                    <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" /> Record Clinical Visit
                                </button>

                                <div className="space-y-2">
                                    {[
                                        { key: 'prescription', label: 'Write Prescription' },
                                        { key: 'sick_leave', label: 'Issue Sick Leave' },
                                        { key: 'referral', label: 'External Referral' },
                                    ].map(doc => (
                                        <button key={doc.key} onClick={() => setActiveDocumentModal(doc.key)}
                                            className="w-full text-left px-5 py-4 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-indigo-600 rounded-2xl border border-zinc-200 hover:border-indigo-200 flex items-center justify-between transition-all group focus-ring bg-white">
                                            <span>{doc.label}</span>
                                            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                        </button>
                                    ))}

                                    <div className="my-4 border-t border-zinc-100"></div>

                                    <button onClick={async () => {
                                        try {
                                            const res = await api.get(`/documents/patients/${patient.id}/consent-form/pdf`, { responseType: 'blob' });
                                            window.open(window.URL.createObjectURL(res.data), '_blank');
                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Failed to generate consent PDF.');
                                        }
                                    }}
                                        className="w-full text-left px-5 py-4 mb-3 text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-2xl border border-violet-200 flex items-center justify-between transition-all group focus-ring">
                                        <span>Print Tooth Removal Consent</span>
                                        <FileText className="w-5 h-5 text-violet-400 group-hover:text-violet-600 transition-colors" />
                                    </button>

                                    <button onClick={async () => {
                                        try {
                                            const res = await api.get(`/documents/patients/${patient.id}/orthodontic-consent/pdf`, { responseType: 'blob' });
                                            window.open(window.URL.createObjectURL(res.data), '_blank');
                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Failed to generate orthodontic consent PDF.');
                                        }
                                    }}
                                        className="w-full text-left px-5 py-4 text-sm font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-2xl border border-sky-200 flex items-center justify-between transition-all group focus-ring">
                                        <span>Print Orthodontic Consent</span>
                                        <FileText className="w-5 h-5 text-sky-400 group-hover:text-sky-600 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-10 shadow-xl shadow-zinc-200/50">
                    <PatientBilling patientId={patientId} />
                </div>
            )}


            {/* Document Modals — rendered into document.body via Portal so fixed positioning is always relative to viewport */}
            {activeDocumentModal && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-fade-in" onClick={() => setActiveDocumentModal(null)} />
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col relative animate-scale-in border border-zinc-200" style={{ maxHeight: '90vh' }}>
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/80 shrink-0 select-none rounded-t-[2rem]">
                            <h3 className="font-bold text-zinc-900 text-xl font-heading capitalize flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                Generate {activeDocumentModal.replace('_', ' ')}
                            </h3>
                            <button onClick={() => setActiveDocumentModal(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors text-2xl font-light shadow-sm pb-1">×</button>
                        </div>
                        <div className="p-8 overflow-y-auto bg-white rounded-b-[2rem]" style={{ overflowY: 'auto' }}>
                            {activeDocumentModal === 'prescription' && <PrescriptionForm patientId={patientId} onComplete={() => setActiveDocumentModal(null)} onCancel={() => setActiveDocumentModal(null)} />}
                            {activeDocumentModal === 'sick_leave' && <SickLeaveForm patientId={patientId} onComplete={() => setActiveDocumentModal(null)} onCancel={() => setActiveDocumentModal(null)} />}
                            {activeDocumentModal === 'referral' && <ReferralForm patientId={patientId} onComplete={() => setActiveDocumentModal(null)} onCancel={() => setActiveDocumentModal(null)} />}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Tooth Condition Modal — rendered into document.body via Portal */}
            {showConditionModal && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-fade-in" onClick={() => setShowConditionModal(false)} />
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md flex flex-col relative animate-scale-in border border-zinc-200" style={{ maxHeight: '90vh' }}>
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/80 select-none rounded-t-[2rem] shrink-0">
                            <div>
                                <h3 className="font-bold text-zinc-900 text-xl font-heading">Tooth #{selectedTooth}</h3>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{TOOTH_NAMES[selectedTooth]}</p>
                            </div>
                            <button onClick={() => setShowConditionModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors text-2xl font-light shadow-sm pb-1">×</button>
                        </div>
                        <div className="p-5 rounded-b-[2rem]">
                            <p className="text-sm font-semibold text-zinc-600 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100 leading-relaxed text-center">Confirm the current pathology/restoration status for clinical charting.</p>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                {TOOTH_CONDITIONS.map(cond => (
                                    <button key={cond.id} onClick={() => handleUpdateCondition(cond.id)}
                                        className="p-3.5 rounded-2xl border-[3px] flex flex-col items-center justify-center gap-2.5 hover:shadow-lg transition-all cursor-pointer bg-white group focus-ring relative overflow-hidden"
                                        style={{ borderColor: cond.id === (toothStatuses[selectedTooth] || 'Healthy') ? cond.stroke : '#f4f4f5' }}>
                                        {cond.id === (toothStatuses[selectedTooth] || 'Healthy') && <div className="absolute top-1.5 right-1.5"><CheckCircle className="w-4 h-4" style={{ color: cond.stroke }} /></div>}
                                        <div className="w-7 h-7 rounded-lg border-[3px] shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: cond.fill, borderColor: cond.stroke }}></div>
                                        <span className="text-sm font-bold text-zinc-800 tracking-wide">{cond.id}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => handleUpdateCondition('Healthy')}
                                className="mt-5 w-full py-3.5 bg-zinc-100 text-zinc-700 rounded-2xl font-bold hover:bg-zinc-200 hover:text-zinc-900 focus-ring transition-colors border border-transparent hover:border-zinc-300">
                                Reset to Healthy Baseline
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Patient Modal */}
            {showEditPatientModal && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-fade-in" onClick={() => setShowEditPatientModal(false)} />
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl flex flex-col relative animate-scale-in border border-zinc-200">
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/80 rounded-t-[2rem]">
                            <h3 className="font-bold text-zinc-900 text-xl font-heading">Edit Patient Profile</h3>
                            <button onClick={() => setShowEditPatientModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors text-2xl font-light">×</button>
                        </div>
                        <form onSubmit={handleUpdatePatient} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Full Name <span className="text-red-500">*</span></label>
                                    <input type="text" required value={editPatientData.full_name} onChange={e => setEditPatientData({...editPatientData, full_name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Phone <span className="text-red-500">*</span></label>
                                    <input type="text" required value={editPatientData.phone} onChange={e => setEditPatientData({...editPatientData, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Age</label>
                                        <input type="number" min="0" max="150" value={editPatientData.age} onChange={e => setEditPatientData({...editPatientData, age: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Sex</label>
                                        <select value={editPatientData.sex} onChange={e => setEditPatientData({...editPatientData, sex: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Address</label>
                                    <input type="text" value={editPatientData.address} onChange={e => setEditPatientData({...editPatientData, address: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold flex items-center gap-2 text-rose-500 uppercase tracking-widest mb-2"><ShieldAlert className="w-3.5 h-3.5"/> Medical Alerts</label>
                                    <textarea value={editPatientData.medical_alerts} onChange={e => setEditPatientData({...editPatientData, medical_alerts: e.target.value})} className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-rose-900 placeholder:text-rose-300 min-h-[80px]" placeholder="Allergies, chronic conditions, etc." />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <button type="button" onClick={handleDeletePatient} className="text-xs font-bold text-red-500 hover:text-red-700 underline decoration-red-200 underline-offset-4 transition-colors">Delete Patient</button>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowEditPatientModal(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-zinc-600 hover:bg-zinc-100 border border-zinc-200 transition-colors">Cancel</button>
                                    <button type="submit" className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Appointment Booking Modal — pre-fills this patient */}
            <BookingModal 
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                preselectedPatient={patient}
                onSuccess={() => toast.success('Appointment booked for ' + patient?.full_name)}
            />
        </div>
    );
};

export default ClinicalHub;
