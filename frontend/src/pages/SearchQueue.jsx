import React, { useState, useEffect } from 'react';
import { Search, Phone, UserRoundSearch, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useLocation } from 'react-router-dom';

const SearchQueue = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const intent = location.state?.intent;

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
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-heading flex items-center gap-3">
                        <Search className="w-8 h-8 text-indigo-600" />
                        Clinical Patient Queue
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2 max-w-xl leading-relaxed">
                        Search terminology across patient names, card digits, or phone records to access their comprehensive clinical hub.
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-lg shadow-zinc-200/50 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-indigo-500/50"></div>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-indigo-600 transition-colors">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                            placeholder="Search by Name, Card Number or Phone..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                fetchPatients(e.target.value);
                            }}
                        />
                    </div>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); fetchPatients(''); }}
                            className="px-6 py-4 text-zinc-500 hover:text-zinc-900 font-bold text-sm rounded-2xl hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
                        >
                            Clear Results
                        </button>
                    )}
                </form>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200">
                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50/50">Patient Name</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50/50">Card Digits</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50/50">Contact Info</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50/50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                            {loading ? (
                                <>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-zinc-50">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-200"></div>
                                                    <div className="h-4 bg-zinc-200 rounded w-32"></div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="h-6 bg-zinc-100 rounded-lg w-24"></div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="h-4 bg-zinc-100 rounded w-28"></div>
                                            </td>
                                            <td className="px-8 py-5 text-right flex justify-end">
                                                <div className="h-10 bg-zinc-50 border border-zinc-100 rounded-xl w-32"></div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-24 text-center">
                                        <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                                            <UserRoundSearch className="h-8 w-8 text-zinc-300" />
                                        </div>
                                        <p className="text-zinc-500 font-bold text-sm tracking-wide">No patient profiles discovered</p>
                                        <p className="text-zinc-400 text-xs mt-1">Try adjusting your search terminology</p>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-zinc-50/80 transition-colors group cursor-pointer" onClick={() => {
                                        if (intent === 'history') {
                                            navigate(`/history/${patient.id}`, { state: { openForm: true } });
                                        } else {
                                            navigate(`/hub/${patient.id}`);
                                        }
                                    }}>
                                        <td className="px-8 py-5 align-middle">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-zinc-900">{patient.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 align-middle">
                                            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-600 tracking-wider">
                                                {patient.card_number}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 align-middle">
                                            <div className="flex items-center text-sm font-medium text-zinc-500">
                                                <Phone className="h-4 w-4 mr-2.5 text-zinc-400" />
                                                {patient.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 align-middle text-right">
                                            <button
                                                className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-sm transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-indigo-600/20"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (intent === 'history') {
                                                        navigate(`/history/${patient.id}`, { state: { openForm: true } });
                                                    } else {
                                                        navigate(`/hub/${patient.id}`);
                                                    }
                                                }}
                                            >
                                                Open Record <ChevronRight className="w-3.5 h-3.5 ml-1 -mr-1 opacity-50 group-hover:opacity-100" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SearchQueue;
