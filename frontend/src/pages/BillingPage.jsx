import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, User, Phone, ArrowLeft, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import PatientBilling from '../components/PatientBilling';
import { useAuth } from '../context/AuthContext';

const BillingPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) {
            navigate('/search?intent=billing');
            return;
        }

        const fetchPatient = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/patients/${patientId}`);
                setPatient(res.data);
            } catch (err) {
                console.error("Failed to load patient", err);
                setError("Patient record not found or inaccessible.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [patientId, navigate]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="animate-pulse space-y-6">
                    <div className="h-24 bg-white rounded-3xl border border-zinc-200"></div>
                    <div className="h-64 bg-white rounded-3xl border border-zinc-200"></div>
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="max-w-7xl mx-auto py-16 px-4 text-center font-sans">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Patient Not Found</h3>
                <p className="text-zinc-500 mb-6">{error || "The requested patient could not be located."}</p>
                <button
                    onClick={() => navigate('/search')}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700"
                >
                    Back to Patient Queue
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in space-y-6">
            {/* Header with Navigation & Patient Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/search')}
                        className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors shadow-sm"
                        title="Back to Patient Queue"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight font-heading">
                                Billing & Invoices
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Financial Management
                            </span>
                        </div>
                        <p className="text-zinc-500 text-xs mt-0.5">
                            Manage treatments, create itemized invoices, record installment payments, and print receipts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                        <Calendar className="w-4 h-4 text-zinc-500" /> Book Appointment
                    </button>
                    {['Admin', 'Dentist'].includes(user?.role) && (
                        <button
                            onClick={() => navigate(`/hub/${patient.id}`)}
                            className="px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
                        >
                            Open Clinical Hub
                        </button>
                    )}
                </div>
            </div>

            {/* Patient Info Banner */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                        {patient.full_name?.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-zinc-900">{patient.full_name}</h2>
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200">
                                {patient.card_number}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-zinc-500 font-medium">
                            <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                {patient.phone || 'No phone'}
                            </span>
                            <span>•</span>
                            <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}</span>
                            <span>•</span>
                            <span className="capitalize">{patient.sex || 'Sex N/A'}</span>
                            {patient.address && (
                                <>
                                    <span>•</span>
                                    <span>{patient.address}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {patient.medical_alerts && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 max-w-xs text-xs text-rose-800">
                        <span className="font-bold block uppercase text-[10px] tracking-wider text-rose-600">Medical Alert</span>
                        {patient.medical_alerts}
                    </div>
                )}
            </div>

            {/* Billing Component */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <PatientBilling patientId={patient.id} />
            </div>
        </div>
    );
};

export default BillingPage;
