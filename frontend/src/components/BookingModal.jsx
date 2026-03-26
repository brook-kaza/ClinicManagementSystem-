import React, { useState, useEffect } from 'react';
import { X, User, Clock, CheckCircle, Search, ChevronRight, AlertCircle, Calendar as CalendarIcon, Edit3, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookingModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    preselectedPatient = null,
    editingAppointment = null, // If provided, modal enters EDIT mode
    onDelete = null
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

    const isEditMode = !!editingAppointment;

    useEffect(() => {
        if (isOpen) {
            fetchDoctors();
            if (preselectedPatient) setSelectedPatient(preselectedPatient);
        }
    }, [isOpen, preselectedPatient]);

    // Pre-fill form when editing
    useEffect(() => {
        if (isOpen && editingAppointment) {
            // Set patient from the appointment data
            if (editingAppointment.patient) {
                setSelectedPatient({
                    id: editingAppointment.patient_id,
                    full_name: editingAppointment.patient.full_name || editingAppointment.patientName,
                    card_number: editingAppointment.patient.card_number || ''
                });
            }
            // Set doctor
            if (editingAppointment.doctor_id) {
                setSelectedDoctorId(String(editingAppointment.doctor_id));
            }
            // Set date
            const startDate = new Date(editingAppointment.start_time);
            setAppointmentDate(startDate.toISOString().split('T')[0]);
            // Set the time slot
            setSelectedTimeSlot(editingAppointment.start_time);
            // Set notes
            setNotes(editingAppointment.notes || '');
        }
    }, [isOpen, editingAppointment]);

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users');
            const filtered = res.data.filter(u => u.role === 'Dentist' || u.role === 'Admin');
            setDoctors(filtered);
            if (!editingAppointment && filtered.length > 0) setSelectedDoctorId(filtered[0].id);
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
            const res = await api.get('/patients/search', { params: { q: q } });
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAvailableSlots = async () => {
        if (!selectedDoctorId || !appointmentDate) return;
        try {
            const params = { date: appointmentDate, doctor_id: selectedDoctorId };
            // When editing, exclude current appointment so its slot stays available
            if (editingAppointment?.id) {
                params.exclude_appointment_id = editingAppointment.id;
            }
            const res = await api.get('/appointments/available-slots', { params });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatient || !selectedTimeSlot) {
            toast.error("Please select a patient and a time slot.");
            return;
        }

        setSubmitting(true);
        try {
            const start = new Date(selectedTimeSlot);
            const end = new Date(start.getTime() + 30 * 60000);

            if (isEditMode) {
                // PATCH existing appointment
                await api.patch(`/appointments/${editingAppointment.id}`, {
                    doctor_id: parseInt(selectedDoctorId),
                    start_time: toLocalISOString(start),
                    end_time: toLocalISOString(end),
                    notes: notes
                });
                toast.success("Appointment updated successfully!");
            } else {
                // POST new appointment
                await api.post('/appointments', {
                    patient_id: selectedPatient.id,
                    doctor_id: parseInt(selectedDoctorId),
                    start_time: toLocalISOString(start),
                    end_time: toLocalISOString(end),
                    notes: notes
                });
                toast.success("Appointment booked successfully!");
            }

            resetForm();
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.detail || (isEditMode ? "Update failed." : "Booking failed."));
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
            <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-200 animate-scale-in flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 flex-shrink-0">
                    <h3 className="text-lg font-bold text-zinc-900 font-heading flex items-center gap-2 flex-1 relative pr-8">
                        {isEditMode ? <><Edit3 className="w-5 h-5 text-amber-500" /> Edit Appointment</> : 'New Appointment'}
                    </h3>
                    <div className="flex items-center gap-2">
                        {isEditMode && onDelete && (
                            <button type="button" onClick={() => onDelete(editingAppointment.id)} title="Delete Appointment" className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={() => { onClose(); resetForm(); }} className="p-2 hover:bg-zinc-200/50 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                    {/* Patient Search */}
                    <div className="relative">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">
                            {preselectedPatient || isEditMode ? "Patient" : "Search Patient"}
                        </label>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                                        {selectedPatient.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-900 text-sm">{selectedPatient.full_name}</p>
                                        <p className="text-[10px] text-emerald-600 font-medium">Card: {selectedPatient.card_number}</p>
                                    </div>
                                </div>
                                {!preselectedPatient && !isEditMode && (
                                    <button type="button" onClick={() => setSelectedPatient(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">Change</button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => handlePatientSearch(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-text"
                                        placeholder="Search by name or card number..."
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-slide-up">
                                        {searchResults.map(p => (
                                            <button 
                                                key={p.id} 
                                                type="button"
                                                onClick={() => setSelectedPatient(p)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Assign Doctor</label>
                            <select 
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans cursor-pointer"
                            >
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.full_name || d.username} ({d.role})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                            <input 
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans cursor-text"
                            />
                        </div>
                    </div>

                    {/* Slot Picker */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Available Slots
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                            {availableSlots.length > 0 ? (
                                availableSlots.map(slot => (
                                    <button
                                        key={slot}
                                        type="button"
                                        onClick={() => setSelectedTimeSlot(slot)}
                                        className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                            selectedTimeSlot === slot 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20' 
                                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50'
                                        }`}
                                    >
                                        {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-full py-4 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-zinc-300 mb-1" />
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No slots available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Notes (Optional)</label>
                        <textarea 
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none cursor-text"
                            placeholder="Procedure details or special requirements..."
                        />
                    </div>

                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={submitting || !selectedPatient || !selectedTimeSlot}
                            className={`w-full py-4 ${isEditMode ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'} text-white rounded-2xl font-bold text-sm shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2.5`}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    {isEditMode ? 'Saving Changes...' : 'Confirming Booking...'}
                                </>
                            ) : (
                                <>
                                    {isEditMode ? <Edit3 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    {isEditMode ? 'Save Changes' : 'Confirm Appointment'}
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
