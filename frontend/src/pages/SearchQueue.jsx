import React, { useState, useEffect } from 'react';
import { Search, User, Phone, Clock, FileText, ChevronRight, UserRoundSearch, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const SearchQueue = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (query = '') => {
        setLoading(true);
        try {
            const endpoint = query ? `/patients/search?q=${encodeURIComponent(query)}` : '/patients';
            const response = await api.get(endpoint);
            setPatients(response.data);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPatients(searchQuery);
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">

            {/* Header Section */}
            <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
                        Patient <span className="text-primary-600">Records</span>
                    </h1>
                    <p className="mt-1 text-slate-500 font-medium">
                        Search and manage the clinical queue for today's visits.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative group w-full lg:w-[450px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 shadow-sm placeholder:text-slate-400 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-slate-900"
                        placeholder="Search by ID, Name or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); fetchPatients(''); }}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs"
                        >
                            CLEAR
                        </button>
                    )}
                </form>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto customized-scrollbar">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Patient Profile</th>
                                <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Card ID</th>
                                <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Contact Info</th>
                                <th className="px-6 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Alerts Status</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="relative mb-4">
                                                <div className="w-12 h-12 border-4 border-primary-50 rounded-full"></div>
                                                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
                                            </div>
                                            <span className="text-slate-500 font-bold text-sm tracking-wide">QUERYING DATABASE...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                                <UserRoundSearch className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">No Patients Found</h3>
                                            <p className="mt-1 text-slate-500 font-medium text-sm">We couldn't find any patient matching "{searchQuery}". Try a broader term.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shadow-inner font-bold text-lg">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 mb-0.5 group-hover:text-primary-700 transition-colors uppercase tracking-tight">{patient.full_name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Record #{patient.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100/50 text-slate-600 text-xs font-bold border border-slate-200/50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                {patient.card_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center text-slate-700 font-medium text-sm">
                                                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center mr-3 border border-slate-100">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                </div>
                                                {patient.phone || <span className="text-slate-300 italic">No contact</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {patient.medical_alerts ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                    CRITICAL ALERTS
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    ALL CLEAR
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => navigate(`/hub/${patient.id}`)}
                                                className="inline-flex items-center justify-center h-10 px-5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-primary-600 hover:text-white hover:border-primary-600 hover:shadow-lg hover:shadow-primary-100 transition-all active:scale-95 group/btn"
                                            >
                                                OPEN RECORD
                                                <ChevronRight className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total Records: {patients.length}
                    </span>
                    <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">
                        Real-time Data Synchronized
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SearchQueue;
