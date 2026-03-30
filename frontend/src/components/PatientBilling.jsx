import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle, Clock, CreditCard, Receipt, FileText, Trash2, PlusCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const PatientBilling = ({ patientId }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Modals
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Form States — Line Items
    const emptyItem = { description: '', unit_price: '' };
    const [invoiceItems, setInvoiceItems] = useState([{ ...emptyItem }]);
    const [newPayment, setNewPayment] = useState({ amount_paid: '', payment_method: 'Cash' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        if (patientId) fetchInvoices();
    }, [patientId]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/billing/patients/${patientId}/invoices`);
            setInvoices(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load invoice history");
        } finally {
            setLoading(false);
        }
    };

    // --- Line Item Helpers ---
    const addItemRow = () => setInvoiceItems(prev => [...prev, { ...emptyItem }]);
    
    const removeItemRow = (idx) => {
        if (invoiceItems.length <= 1) return; // Must keep at least 1 row
        setInvoiceItems(prev => prev.filter((_, i) => i !== idx));
    };

    const updateItemRow = (idx, field, value) => {
        setInvoiceItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const calculateTotal = () => {
        return invoiceItems.reduce((sum, item) => {
            const price = parseFloat(item.unit_price) || 0;
            return sum + price;
        }, 0);
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        
        // Validate all items have description and price
        const validItems = invoiceItems.filter(item => item.description.trim() && parseFloat(item.unit_price) > 0);
        if (validItems.length === 0) {
            toast.error("Please add at least one treatment with a valid description and price.");
            return;
        }

        try {
            const payload = {
                items: validItems.map(item => ({
                    description: item.description.trim(),
                    quantity: 1,
                    unit_price: parseFloat(item.unit_price)
                }))
            };

            const res = await api.post(`/billing/patients/${patientId}/invoices`, payload);
            setInvoices([res.data, ...invoices]);
            setInvoiceItems([{ ...emptyItem }]);
            setShowInvoiceModal(false);
            toast.success("Invoice generated successfully");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Error creating invoice");
        }
    };

    const handleLogPayment = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/billing/invoices/${selectedInvoice.id}/payments`, {
                amount_paid: parseFloat(newPayment.amount_paid),
                payment_method: newPayment.payment_method
            });

            // Refresh invoice list to reflect new payment and status
            fetchInvoices();

            setNewPayment({ amount_paid: '', payment_method: 'Cash' });
            setShowPaymentModal(false);
            setSelectedInvoice(null);
            toast.success("Payment logged successfully");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Error logging payment");
        }
    };

    const handleDeleteInvoice = (invoiceId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Invoice',
            message: 'Are you sure you want to delete this invoice? All associated payments will also be deleted.',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/billing/invoices/${invoiceId}`);
                    toast.success("Invoice deleted successfully");
                    fetchInvoices();
                } catch (err) {
                    toast.error(err.response?.data?.detail || "Failed to delete invoice");
                }
            }
        });
    };

    const handleDeletePayment = (paymentId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Payment',
            message: 'Are you sure you want to delete this payment record?',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await api.delete(`/billing/payments/${paymentId}`);
                    toast.success("Payment deleted successfully");
                    fetchInvoices();
                } catch (err) {
                    toast.error(err.response?.data?.detail || "Failed to delete payment");
                }
            }
        });
    };


    const calculateTotalOutstanding = () => {
        let total = 0;
        invoices.forEach(inv => {
            const paid = inv.payments.reduce((sum, p) => sum + p.amount_paid, 0);
            total += (inv.total_amount - paid);
        });
        return total;
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-zinc-500 font-bold">Loading Financial Records...</div>;

    const totalDue = calculateTotalOutstanding();

    return (
        <div className="space-y-6 animate-fade-in font-sans pb-10">

            {/* Summary Dashboard */}
            <div className={`p-6 rounded-3xl border flex items-center justify-between shadow-sm relative overflow-hidden ${totalDue > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 pointer-events-none blur-xl"></div>
                <div className="relative z-10">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${totalDue > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        Total Outstanding Balance
                    </p>
                    <h3 className={`text-3xl font-black ${totalDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {totalDue.toFixed(2)} ETB
                    </h3>
                </div>
                <button
                    onClick={() => { setInvoiceItems([{ ...emptyItem }]); setShowInvoiceModal(true); }}
                    className="relative z-10 bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                    <Plus className="w-4 h-4" /> Create Invoice
                </button>
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
                {invoices.length === 0 ? (
                    <div className="text-center py-16 bg-zinc-50 border border-zinc-200 rounded-3xl">
                        <Receipt className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <h4 className="text-zinc-600 font-bold">No Invoices Found</h4>
                        <p className="text-zinc-400 text-sm mt-1">Generate an invoice to start tracking payments.</p>
                    </div>
                ) : (
                    invoices.map(invoice => {
                        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount_paid, 0);
                        const balance = invoice.total_amount - totalPaid;
                        const isPaid = balance <= 0;
                        const hasItems = invoice.items && invoice.items.length > 0;

                        return (
                            <div key={invoice.id} className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                                {invoice.description}
                                            </h4>
                                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                invoice.status === 'Partially Paid' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                    'bg-rose-50 text-rose-600 border-rose-200'
                                                }`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                                            <Clock className="w-3.5 h-3.5" />
                                            Generated on {new Date(invoice.created_at).toLocaleDateString()}
                                        </p>

                                        {/* Line Items Breakdown (if available) */}
                                        {hasItems && (
                                            <div className="mb-4 bg-zinc-50/80 border border-zinc-100 rounded-xl p-3">
                                                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2">Treatment Breakdown</p>
                                                <div className="space-y-1.5">
                                                    {invoice.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-zinc-700 font-medium">{item.description}</span>
                                                            <span className="font-bold text-zinc-800">{item.line_total.toLocaleString()} ETB</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Financial Breakdown */}
                                        <div className="grid grid-cols-3 gap-4 max-w-sm bg-zinc-50 border border-zinc-100 rounded-xl p-3">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total</p>
                                                <p className="font-bold text-zinc-800">{invoice.total_amount.toLocaleString()} ETB</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Paid</p>
                                                <p className="font-bold text-emerald-700">{totalPaid.toLocaleString()} ETB</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Balance</p>
                                                <p className="font-bold text-rose-600">{balance.toLocaleString()} ETB</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[140px] items-end">
                                        {!isPaid && (
                                            <button
                                                onClick={() => { setSelectedInvoice(invoice); setShowPaymentModal(true); }}
                                                className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <DollarSign className="w-4 h-4" /> Log Payment
                                            </button>
                                        )}
                                        {user?.role === 'Admin' && (
                                            <button
                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                className="text-[10px] font-bold text-red-400 hover:text-red-600 underline decoration-red-200 underline-offset-4 mt-2 transition-colors uppercase tracking-widest text-right"
                                            >
                                                Delete Invoice
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Installment History Timeline */}
                                {invoice.payments.length > 0 && (
                                    <div className="mt-5 pt-4 border-t border-zinc-100">
                                        <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <CreditCard className="w-3 h-3" /> Payment History
                                        </p>
                                        <div className="space-y-2">
                                            {invoice.payments.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-zinc-50/50 px-3 py-2 rounded-lg text-sm border border-zinc-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                        </div>
                                                        <span className="font-semibold text-zinc-700">{p.amount_paid.toLocaleString()} ETB</span>
                                                        <span className="text-zinc-400 text-xs">via {p.payment_method}</span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-zinc-400 text-xs font-medium">{new Date(p.payment_date).toLocaleDateString()}</span>
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await api.get(`/billing/payments/${p.id}/receipt`, { responseType: 'blob' });
                                                                        window.open(window.URL.createObjectURL(res.data), '_blank');
                                                                    } catch (err) {
                                                                        toast.error('Failed to generate PDF receipt.');
                                                                    }
                                                                }}
                                                                className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                                                            >
                                                                <FileText className="w-3 h-3" /> Print Receipt
                                                            </button>
                                                            {user?.role === 'Admin' && (
                                                                <button
                                                                    onClick={() => handleDeletePayment(p.id)}
                                                                    className="text-[10px] font-bold uppercase tracking-wider text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 border-l border-zinc-200 pl-4"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL: Create Invoice with Line Items */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold font-heading mb-1 text-zinc-800">Generate New Invoice</h3>
                        <p className="text-sm text-zinc-400 mb-5">Add each treatment/service as a separate line item.</p>
                        
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            {/* Line Items */}
                            <div className="space-y-3">
                                {invoiceItems.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3 relative group">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                required
                                                value={item.description}
                                                onChange={e => updateItemRow(idx, 'description', e.target.value)}
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                placeholder="Treatment (e.g. Extraction)"
                                            />
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={e => updateItemRow(idx, 'unit_price', e.target.value)}
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold"
                                                placeholder="Price (ETB)"
                                            />
                                        </div>
                                        {invoiceItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItemRow(idx)}
                                                className="mt-2 text-red-400 hover:text-red-600 transition-colors p-1"
                                                title="Remove treatment"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Treatment Button */}
                            <button
                                type="button"
                                onClick={addItemRow}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 text-sm font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                            >
                                <PlusCircle className="w-4 h-4" /> Add Another Treatment
                            </button>

                            {/* Running Total */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                                <span className="text-sm font-bold text-indigo-800">Invoice Total:</span>
                                <span className="text-xl font-black text-indigo-600">{calculateTotal().toLocaleString()} ETB</span>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInvoiceModal(false)} className="px-4 py-3 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-600 flex-1 hover:bg-zinc-50">Cancel</button>
                                <button type="submit" className="px-4 py-3 rounded-xl bg-indigo-600 font-bold text-sm text-white flex-1 hover:bg-indigo-700">Create Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Log Payment */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
                        <div className="mb-6 pb-4 border-b border-zinc-100">
                            <h3 className="text-xl font-bold font-heading mb-1 text-zinc-800">Log Payment</h3>
                            <p className="text-sm font-medium text-zinc-500">For: <span className="text-zinc-800">{selectedInvoice.description}</span></p>
                        </div>

                        {/* Show item breakdown if available */}
                        {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                            <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 mb-4">
                                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2">Treatments on this Invoice</p>
                                <div className="space-y-1">
                                    {selectedInvoice.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-zinc-600">{item.description}</span>
                                            <span className="font-bold text-zinc-800">{item.line_total.toLocaleString()} ETB</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-indigo-800">Remaining Balance:</span>
                            <span className="text-lg font-black text-indigo-600">
                                {(selectedInvoice.total_amount - selectedInvoice.payments.reduce((s, p) => s + p.amount_paid, 0)).toLocaleString()} ETB
                            </span>
                        </div>

                        <form onSubmit={handleLogPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Payment Amount (ETB)</label>
                                <input type="number" required min="0.01" step="0.01" max={selectedInvoice.total_amount - selectedInvoice.payments.reduce((s, p) => s + p.amount_paid, 0)} value={newPayment.amount_paid} onChange={e => setNewPayment({ ...newPayment, amount_paid: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Payment Method</label>
                                <select required value={newPayment.payment_method} onChange={e => setNewPayment({ ...newPayment, payment_method: e.target.value })} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                                    <option>Cash</option>
                                    <option>Credit Card</option>
                                    <option>Debit Card</option>
                                    <option>Bank Transfer</option>
                                    <option>Insurance</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => { setShowPaymentModal(false); setSelectedInvoice(null); }} className="px-4 py-3 rounded-xl border border-zinc-200 font-bold text-sm text-zinc-600 flex-1 hover:bg-zinc-50">Cancel</button>
                                <button type="submit" className="px-4 py-3 rounded-xl bg-emerald-600 font-bold text-sm text-white flex-1 hover:bg-emerald-700 shadow-md shadow-emerald-600/20">Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default PatientBilling;
