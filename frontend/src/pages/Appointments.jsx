import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Plus, X, User, Clock, CheckCircle, Search, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import BookingModal from '../components/BookingModal';
import { useAuth } from '../context/AuthContext';

const Appointments = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const calendarRef = useRef(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async (start, end) => {
        // FullCalendar provides start/end in the datesSet callback
        // If not provided (initial mount), we'll let FullCalendar trigger it
        if (!start || !end) return;

        setLoading(true);
        try {
            const res = await api.get('/appointments', {
                params: { start: start.toISOString(), end: end.toISOString() }
            });
            const formatted = res.data.map(app => {
                const patientName = app.patient?.full_name || `Patient #${app.patient_id}`;
                const drName = app.doctor?.full_name || app.doctor?.username || `Dr. ${app.doctor_id}`;
                return {
                    id: app.id,
                    title: `${patientName} (${drName})`,
                    start: app.start_time,
                    end: app.end_time,
                    extendedProps: { ...app, patientName, drName },
                    backgroundColor: app.status === 'Cancelled' ? '#ef4444' : '#4f46e5',
                    borderColor: 'transparent'
                };
            });
            setEvents(formatted);
        } catch (err) {
            toast.error("Failed to load appointments.");
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (selectInfo) => {
        // We will pass this default date context to the booking modal in future iterations if preferred, 
        // but for now, quick-booking is standard
        setSelectedSlot(selectInfo);
        setShowBookingModal(true);
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-900 font-heading tracking-tight mb-2 flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8 text-indigo-600" /> Appointment Scheduler
                    </h2>
                    <p className="text-zinc-500 font-medium">Manage clinical schedule and patient bookings efficiently.</p>
                </div>
                <button 
                    onClick={() => setShowBookingModal(true)}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all focus-ring"
                >
                    <Plus className="w-5 h-5" /> Quick Booking
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xl shadow-zinc-200/50">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    selectable={true}
                    select={handleDateSelect}
                    height="auto"
                    slotMinTime="08:00:00"
                    slotMaxTime="19:00:00"
                    allDaySlot={false}
                    datesSet={(dateInfo) => fetchAppointments(dateInfo.start, dateInfo.end)}
                    eventClick={(info) => {
                        const { patientName, drName, status, notes } = info.event.extendedProps;
                        toast.custom((t) => (
                            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border border-zinc-100`}>
                                <div className="flex-1 w-0">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <CalendarIcon className="h-10 w-10 text-indigo-500 bg-indigo-50 p-2 rounded-full" />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-sm font-bold text-zinc-900">{patientName}</p>
                                            <p className="mt-1 text-xs text-zinc-500">With {drName} • Status: <span className="font-bold">{status}</span></p>
                                            {notes && <p className="mt-2 text-xs text-zinc-600 bg-zinc-50 p-2 rounded-lg italic border border-zinc-100">"{notes}"</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex border-l border-zinc-100 pl-4 ml-4">
                                    <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-lg flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
                                        Close
                                    </button>
                                </div>
                            </div>
                        ), { duration: 5000 });
                    }}
                    eventClassNames="rounded-lg border-none shadow-sm font-semibold text-xs cursor-pointer p-1"

                />
            </div>

            {/* Standalone Booking Modal Injection */}
            <BookingModal 
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSuccess={() => {
                    if (calendarRef.current) {
                        const calendarApi = calendarRef.current.getApi();
                        fetchAppointments(calendarApi.view.activeStart, calendarApi.view.activeEnd);
                    }
                }}
            />
        </div>
    );
};

export default Appointments;
