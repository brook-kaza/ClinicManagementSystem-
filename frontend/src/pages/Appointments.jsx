import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Plus, X, User, Clock, CheckCircle, Search, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
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
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingAppointmentId, setDeletingAppointmentId] = useState(null);

    const calendarRef = useRef(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async (start, end) => {
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
        setSelectedSlot(selectInfo);
        setEditingAppointment(null);
        setShowBookingModal(true);
    };

    const handleEventClick = (info) => {
        const appt = info.event.extendedProps;
        // Open the booking modal in edit mode with full appointment data
        setEditingAppointment({
            id: appt.id,
            patient_id: appt.patient_id,
            doctor_id: appt.doctor_id,
            start_time: appt.start_time,
            end_time: appt.end_time,
            notes: appt.notes,
            status: appt.status,
            patientName: appt.patientName,
            drName: appt.drName,
            patient: appt.patient
        });
        setShowBookingModal(true);
    };

    const handleDeleteAppointment = async () => {
        if (!deletingAppointmentId) return;
        try {
            await api.delete(`/appointments/${deletingAppointmentId}`);
            toast.success("Appointment deleted.");
            refreshCalendar();
        } catch (err) {
            toast.error("Failed to delete appointment.");
        } finally {
            setShowDeleteConfirm(false);
            setDeletingAppointmentId(null);
        }
    };

    const refreshCalendar = () => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            fetchAppointments(calendarApi.view.activeStart, calendarApi.view.activeEnd);
        }
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
                    onClick={() => { setEditingAppointment(null); setShowBookingModal(true); }}
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
                    eventClick={handleEventClick}
                    eventClassNames="rounded-lg border-none shadow-sm font-semibold text-xs cursor-pointer p-1"
                />
            </div>

            {/* Booking / Edit Modal */}
            <BookingModal 
                isOpen={showBookingModal}
                onClose={() => { setShowBookingModal(false); setEditingAppointment(null); }}
                onSuccess={refreshCalendar}
                editingAppointment={editingAppointment}
                onDelete={(id) => {
                    setShowBookingModal(false);
                    setEditingAppointment(null);
                    setDeletingAppointmentId(id);
                    setShowDeleteConfirm(true);
                }}
            />

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setDeletingAppointmentId(null); }}
                onConfirm={handleDeleteAppointment}
                title="Delete Appointment"
                message="Are you sure you want to delete this appointment? This action cannot be undone."
            />
        </div>
    );
};

export default Appointments;
