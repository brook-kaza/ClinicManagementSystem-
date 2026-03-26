import React, { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle, Search, ChevronRight, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookingModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    preselectedPatient = null // If provided, locks the patient selection
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(preselectedPatient);
    
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchDoctors();
            if (preselectedPatient) setSelectedPatient(preselectedPatient);
        }
    }, [isOpen, preselectedPatient]);

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users');
            const filtered = res.data.filter(u => u.role === 'Dentist' || u.role === 'Admin');
            setDoctors(filtered);
            if (filtered.length > 0) setSelectedDoctorId(filtered[0].id);
        } catch (err) {
            console.error("Fetch doctors failed:", err);
        }
    };

    const handlePatientSearch = async (q) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            // FIXED BUG: ?query=.. -> ?q=..
            const res = await api.get('/patients/search', { params: { q: q } });
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAvailableSlots = async () => {
        if (!selectedDoctorId || !appointmentDate) return;
        try {
            const res = await api.get('/appointments/available-slots', {
                params: { date: appointmentDate, doctor_id: selectedDoctorId }
            });
            setAvailableSlots(res.data.available_slots);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchAvailableSlots();
        }
    }, [appointmentDate, selectedDoctorId, isOpen]);

    const toLocalISOString = (dateObj) => {
        const pad = n => n.toString().padStart(2, '0');
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!selectedPatient || !selectedTimeSlot) {
            toast.error("Please select a patient and a time slot.");
            return;
        }

        setSubmitting(true);
        try {
            const start = new Date(selectedTimeSlot);
            const end = new Date(start.getTime() + 30 * 60000); // 30 mins later
            
            // Send standard local ISO string dropping the Z to avoid FastAPI aware/naive timezone crash
            await api.post('/appointments', {
                patient_id: selectedPatient.id,
                doctor_id: parseInt(selectedDoctorId),
                start_time: toLocalISOString(start),
                end_time: toLocalISOString(end),
                notes: notes
            });

            toast.success("Appointment booked successfully!");
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.detail || "Booking failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        if (!preselectedPatient) setSelectedPatient(null);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedTimeSlot(null);
        setNotes('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200 animate-scale-in flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 flex-shrink-0">
                    <h3 className="text-xl font-bold text-zinc-900 font-heading">New Appointment</h3>
                    <button onClick={() => { onClose(); resetForm(); }} className="p-2 hover:bg-zinc-200/50 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-zinc-400" />
                    </button>
                </div>
                
                <form onSubmit={handleBookAppointment} className="p-8 space-y-6 overflow-y-auto">
                    {/* Patient Search */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">
                            {preselectedPatient ? "Target Patient" : "Search Patient"}
                        </label>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                                        {selectedPatient.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-900">{selectedPatient.full_name}</p>
                                        <p className="text-xs text-emerald-600 font-medium">Card: {selectedPatient.card_number}</p>
                                    </div>
                                </div>
                                {!preselectedPatient && (
                                    <button type="button" onClick={() => setSelectedPatient(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">Change</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => handlePatientSearch(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-text"
                                        placeholder="Search by name or card number..."
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-slide-up">
                                        {searchResults.map(p => (
                                            <button 
                                                key={p.id} 
                                                type="button"
                                                onClick={() => setSelectedPatient(p)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold">
                                                        {p.full_name.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-zinc-900">{p.full_name}</p>
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Card: {p.card_number}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-zinc-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Assign Doctor</label>
                            <select 
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 flex-1 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans cursor-pointer"
                            >
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.full_name || d.username} ({d.role})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Date</label>
                            <input 
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 flex-1 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans cursor-text"
                            />
                        </div>
                    </div>

                    {/* Slot Picker */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Available Slots
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {availableSlots.length > 0 ? (
                                availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setSelectedTimeSlot(slot)}
                                        className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                                            selectedTimeSlot === slot 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20' 
                                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50'
                                        }`}
                                    >
                                        {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full py-6 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 flex flex-col items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-zinc-300 mb-2" />
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No slots available for this date</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2.5 ml-1">Notes (Optional)</label>
                        <textarea 
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none cursor-text"
                            placeholder="Procedure details or special requirements..."
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting || !selectedPatient || !selectedTimeSlot}
                            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-base hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Confirming Booking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" /> Confirm Appointment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
