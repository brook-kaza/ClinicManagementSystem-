import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Activity, AlertCircle, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as xlsx from 'xlsx-js-style';

// Helper for generic excel export of simple tables
const exportToExcel = (data, headers, filename, sheetName = "Data") => {
    if (!data || data.length === 0) {
        toast.error("No data to export.");
        return;
    }

    const HEADER_STYLE = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } }
        }
    };

    const CELL_STYLE = {
        font: { sz: 10 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } }
        }
    };

    const wb = xlsx.utils.book_new();
    const exportRows = [];

    // Header row
    exportRows.push(headers.map(h => ({ v: h, s: HEADER_STYLE })));

    // Data rows
    data.forEach(row => {
        const shapedRow = Object.values(row).map(val => ({ v: val ?? "-", s: CELL_STYLE }));
        exportRows.push(shapedRow);
    });

    const ws = xlsx.utils.aoa_to_sheet(exportRows);
    
    // Auto-fit columns
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    xlsx.writeFile(wb, `${filename}.xlsx`);
    toast.success("Excel report exported automatically!");
};

const Reports = () => {
    const today = new Date();
    const [activeTab, setActiveTab] = useState('daily_income'); // daily_income, monthly_revenue, patient_stats, outstanding, morbidity

    // --- Daily Income State ---
    const [dailyDate, setDailyDate] = useState(today.toISOString().split('T')[0]);
    const [dailyData, setDailyData] = useState(null);

    // --- Monthly Revenue State ---
    const [revenueYear, setRevenueYear] = useState(today.getFullYear());
    const [revenueData, setRevenueData] = useState(null);

    // --- Patient Stats State ---
    const [statsData, setStatsData] = useState(null);

    // --- Outstanding State ---
    const [outstandingData, setOutstandingData] = useState(null);

    // --- Morbidity State (Legacy Form) ---
    const [morbidityMonth, setMorbidityMonth] = useState(today.getMonth() + 1);
    const [morbidityYear, setMorbidityYear] = useState(today.getFullYear());
    const [morbidityData, setMorbidityData] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - 5 + i).reverse();

    // Fetch master function based on active tab
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'daily_income') {
                const res = await api.get(`/reports/daily-income?report_date=${dailyDate}`);
                setDailyData(res.data);
            } else if (activeTab === 'monthly_revenue') {
                const res = await api.get(`/reports/monthly-revenue?year=${revenueYear}`);
                setRevenueData(res.data);
            } else if (activeTab === 'patient_stats') {
                const res = await api.get(`/reports/patient-statistics`);
                setStatsData(res.data);
            } else if (activeTab === 'outstanding') {
                const res = await api.get(`/reports/outstanding-payments`);
                setOutstandingData(res.data);
            } else if (activeTab === 'morbidity') {
                const res = await api.get(`/reports/morbidity?month=${morbidityMonth}&year=${morbidityYear}`);
                setMorbidityData(res.data);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate report. Please try again later.");
            toast.error("Report generation failed.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when tab or key params change
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [activeTab, dailyDate, revenueYear, morbidityMonth, morbidityYear]);


    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: Daily Income
    // ─────────────────────────────────────────────────────────────────────────────
    const renderDailyIncome = () => {
        if (!dailyData) return null;

        const handleExport = () => {
            const formatted = dailyData.transactions.map(t => ({
                "Time": t.time,
                "Patient": t.patient_name,
                "Card Number": t.card_number,
                "Description": t.description,
                "Method": t.method,
                "Recorded By": t.recorded_by,
                "Amount (ETB)": t.amount
            }));
            exportToExcel(formatted, ["Time", "Patient", "Card Number", "Description", "Method", "Recorded By", "Amount (ETB)"], `Daily_Income_${dailyData.date}`);
        };

        const totalCash = dailyData.by_method["Cash"] || 0;
        const totalTransfer = Object.entries(dailyData.by_method)
            .filter(([method]) => method !== "Cash")
            .reduce((sum, [, amount]) => sum + amount, 0);

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Total Income (ETB)</p>
                        <h4 className="text-3xl font-extrabold text-emerald-600">{dailyData.grand_total.toLocaleString()}</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Cash Payments</p>
                        <h4 className="text-3xl font-extrabold text-zinc-800">{totalCash.toLocaleString()}</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Transfer / Other</p>
                        <h4 className="text-3xl font-extrabold text-zinc-800">{totalTransfer.toLocaleString()}</h4>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                        <h3 className="font-bold text-zinc-800">Transaction Log</h3>
                        <button onClick={handleExport} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Download className="w-4 h-4" /> Export</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Patient</th>
                                    <th className="px-6 py-3">Reference/Service</th>
                                    <th className="px-6 py-3">Method</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.transactions.map((t, i) => (
                                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                                        <td className="px-6 py-3 text-zinc-500 font-medium">{t.time}</td>
                                        <td className="px-6 py-3 font-bold text-zinc-800">
                                            {t.patient_name} <span className="block text-xs text-zinc-500 font-normal">{t.card_number}</span>
                                        </td>
                                        <td className="px-6 py-3 text-zinc-600">{t.description}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.method === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {t.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-black text-zinc-900">{t.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {dailyData.transactions.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-8 text-zinc-500">No transactions recorded on this date.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: Monthly Revenue
    // ─────────────────────────────────────────────────────────────────────────────
    const renderMonthlyRevenue = () => {
        if (!revenueData) return null;

        const handleExport = () => {
            const formatted = revenueData.monthly.map(m => ({
                "Month": monthNames[m.month - 1],
                "Invoices Genered": m.invoice_count,
                "Billed Amount": m.billed,
                "Collected Amount": m.collected,
                "Outstanding / Unpaid": m.outstanding
            }));
            exportToExcel(formatted, ["Month", "Invoices Genered", "Billed Amount", "Collected Amount", "Outstanding / Unpaid"], `Monthly_Revenue_${revenueData.year}`);
        };

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Year Total Billed (ETB)</p>
                        <h4 className="text-3xl font-extrabold text-blue-600">{revenueData.totals.billed.toLocaleString()}</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Year Total Collected (ETB)</p>
                        <h4 className="text-3xl font-extrabold text-emerald-600">{revenueData.totals.collected.toLocaleString()}</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Year Outstanding (ETB)</p>
                        <h4 className="text-3xl font-extrabold text-orange-600">{revenueData.totals.outstanding.toLocaleString()}</h4>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                        <h3 className="font-bold text-zinc-800">Monthly Breakdown - {revenueData.year}</h3>
                        <button onClick={handleExport} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Download className="w-4 h-4" /> Export</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-3">Month</th>
                                    <th className="px-6 py-3">Invoices</th>
                                    <th className="px-6 py-3 text-right">Billed (ETB)</th>
                                    <th className="px-6 py-3 text-right">Collected (ETB)</th>
                                    <th className="px-6 py-3 text-right">Outstanding (ETB)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueData.monthly.map((m, i) => (
                                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                                        <td className="px-6 py-3 font-bold text-zinc-800">{monthNames[m.month - 1]}</td>
                                        <td className="px-6 py-3 text-zinc-600 font-medium">{m.invoice_count}</td>
                                        <td className="px-6 py-3 text-right text-blue-700 font-bold">{m.billed.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right text-emerald-600 font-bold">{m.collected.toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right text-orange-600 w-32">
                                            {m.outstanding > 0 ? (
                                                <div className="flex items-center justify-end gap-1.5 bg-orange-50 px-2 py-1 rounded">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                                    <span className="font-bold">{m.outstanding.toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400 font-medium">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: Patient Statistics
    // ─────────────────────────────────────────────────────────────────────────────
    const renderPatientStats = () => {
        if (!statsData) return null;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
                        <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
                        <p className="font-bold text-[11px] uppercase tracking-wider text-indigo-100 mb-2">Total Platform Patients</p>
                        <h4 className="text-4xl font-extrabold">{statsData.total_patients.toLocaleString()}</h4>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-sm text-white relative overflow-hidden">
                        <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
                        <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-100 mb-2">Total Platform Visits</p>
                        <h4 className="text-4xl font-extrabold">{statsData.total_visits.toLocaleString()}</h4>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sex Dist */}
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                            <h3 className="font-bold text-zinc-800">Gender Distribution</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1">
                                    <p className="text-sm text-zinc-500 mb-1">Male</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${((statsData.sex_distribution.Male || 0) / statsData.total_patients * 100) || 0}%` }}></div>
                                        </div>
                                        <span className="font-bold text-zinc-700 w-12 text-right">{statsData.sex_distribution.Male || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1">
                                    <p className="text-sm text-zinc-500 mb-1">Female</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500" style={{ width: `${((statsData.sex_distribution.Female || 0) / statsData.total_patients * 100) || 0}%` }}></div>
                                        </div>
                                        <span className="font-bold text-zinc-700 w-12 text-right">{statsData.sex_distribution.Female || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Age Dist */}
                    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                            <h3 className="font-bold text-zinc-800">Age Distribution</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {Object.entries(statsData.age_distribution).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-600 font-medium w-20">{key}</span>
                                    <div className="flex-1 mx-4 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-500" style={{ width: `${(val / statsData.total_patients * 100) || 0}%` }}></div>
                                    </div>
                                    <span className="font-bold text-zinc-800 w-10 text-right">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                 {/* Registrations & Visits Over Time */}
                 <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50">
                        <h3 className="font-bold text-zinc-800">Clinic Traffic ({statsData.year})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-3">Month</th>
                                    <th className="px-6 py-3 text-right">New Registrations</th>
                                    <th className="px-6 py-3 text-right">Clinical Visits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statsData.monthly_registrations.map((mr, i) => {
                                    const visits = statsData.monthly_visits.find(v => v.month === mr.month)?.count || 0;
                                    return (
                                    <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50">
                                        <td className="px-6 py-3 font-bold text-zinc-800">{monthNames[mr.month - 1]}</td>
                                        <td className="px-6 py-3 font-bold text-indigo-600 text-right">{mr.count}</td>
                                        <td className="px-6 py-3 font-bold text-emerald-600 text-right">{visits}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: Outstanding Payments (Aging)
    // ─────────────────────────────────────────────────────────────────────────────
    const renderOutstanding = () => {
        if (!outstandingData) return null;

        const handleExport = () => {
            const formatted = outstandingData.records.map(r => ({
                "Patient": r.patient_name,
                "Card Number": r.card_number,
                "Phone": r.phone,
                "Description": r.description,
                "Invoice Date": r.invoice_date,
                "Days Overdue": r.days_overdue,
                "Total Amount": r.total_amount,
                "Paid": r.amount_paid,
                "Balance Due": r.balance_due
            }));
            exportToExcel(formatted, ["Patient", "Card Number", "Phone", "Description", "Invoice Date", "Days Overdue", "Total Amount", "Paid", "Balance Due"], `Outstanding_Balances`);
        };

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                     <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm col-span-1 sm:col-span-2">
                        <p className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider mb-2">Total Outstanding (ETB)</p>
                        <h4 className="text-4xl font-extrabold text-red-600">{outstandingData.total_outstanding.toLocaleString()}</h4>
                    </div>
                    {['0-30 days', '31-60 days'].map(bucket => (
                         <div key={bucket} className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100/50 shadow-sm">
                            <p className="text-orange-600/80 font-bold text-[11px] uppercase tracking-wider mb-2">Aging: {bucket}</p>
                            <h4 className="text-2xl font-black text-orange-700">{(outstandingData.aging_summary[bucket] || 0).toLocaleString()}</h4>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
                        <h3 className="font-bold text-rose-900 flex items-center gap-2"><Clock className="w-5 h-5 text-rose-500"/> Unpaid & Partially Paid Invoices</h3>
                        <button onClick={handleExport} className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"><Download className="w-4 h-4" /> Export</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-rose-50/30 text-[11px] uppercase font-bold text-rose-900/60 border-b border-rose-100">
                                <tr>
                                    <th className="px-6 py-3">Patient</th>
                                    <th className="px-6 py-3 text-center">Date</th>
                                    <th className="px-6 py-3 text-center">Days Overdue</th>
                                    <th className="px-6 py-3 text-right">Service</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-right">Paid</th>
                                    <th className="px-6 py-3 text-right bg-rose-50">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outstandingData.records.map((r, i) => (
                                    <tr key={i} className="border-b border-zinc-100 hover:bg-rose-50/20">
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            {r.patient_name} 
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-100 px-1 py-0.5 rounded">{r.card_number}</span>
                                                <span className="text-[10px] text-zinc-500">{r.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-zinc-600">{r.invoice_date}</td>
                                        <td className="px-6 py-4 text-center font-bold text-rose-600">{r.days_overdue} days</td>
                                        <td className="px-6 py-4 text-right text-zinc-600 truncate max-w-[150px]">{r.description}</td>
                                        <td className="px-6 py-4 text-right font-medium text-zinc-600">{r.total_amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-zinc-500">{r.amount_paid.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-black text-rose-600 bg-rose-50/30">{r.balance_due.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {outstandingData.records.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-12 text-zinc-500 font-medium">All invoices are fully paid! No outstanding balances.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RENDER: Legacy Morbidity Report
    // ─────────────────────────────────────────────────────────────────────────────
    const renderMorbidity = () => {
        // [Existing Morbidity UI Logic]
        const handleExportExcel = () => {
            if (morbidityData.length === 0) {
                toast.error("No data to export.");
                return;
            }
            // ... (I am keeping the complex layout logic you had before here for morbidity)
            const wb = xlsx.utils.book_new();
            const TITLE_STYLE = { font: { bold: true, sz: 12 }, alignment: { horizontal: "left" } };
            const HEADER_INFO_STYLE = { font: { bold: true, sz: 10 } };
            const DATA_INFO_STYLE = { font: { sz: 10 } };
            const BORDER_STYLE = { top: { style: 'thin', color: { auto: 1 } }, bottom: { style: 'thin', color: { auto: 1 } }, left: { style: 'thin', color: { auto: 1 } }, right: { style: 'thin', color: { auto: 1 } } };
            const GRID_HEADER_STYLE = { font: { bold: true, sz: 9 }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: BORDER_STYLE, fill: { fgColor: { rgb: "F3F4F6" } } };
            const GRID_CELL_STYLE = { font: { sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: BORDER_STYLE };
            const GRID_CELL_LEFT_STYLE = { font: { sz: 9 }, alignment: { horizontal: "left", vertical: "center" }, border: BORDER_STYLE };
            const exportRows = [];
            exportRows.push([{ v: "Health Center/Hospital/Clinic monthly disease reporting form", s: TITLE_STYLE }]);
            exportRows.push([ { v: "Facility:", s: HEADER_INFO_STYLE }, { v: "Hani Dental Clinic", s: DATA_INFO_STYLE }, { v: "" }, { v: "Region:", s: HEADER_INFO_STYLE }, { v: "Addis Ababa", s: DATA_INFO_STYLE }, { v: "" }, { v: "Month:", s: HEADER_INFO_STYLE }, { v: morbidityMonth, s: DATA_INFO_STYLE }, { v: "" }]);
            exportRows.push([ { v: "To:", s: HEADER_INFO_STYLE }, { v: "Health Bureau", s: DATA_INFO_STYLE }, { v: "" }, { v: "Type:", s: HEADER_INFO_STYLE }, { v: "OPD", s: DATA_INFO_STYLE }, { v: "" }, { v: "Year:", s: HEADER_INFO_STYLE }, { v: morbidityYear, s: DATA_INFO_STYLE }, { v: "" } ]);
            exportRows.push([]);
            exportRows.push([{ v: "Ext_ID", s: GRID_HEADER_STYLE }, { v: "Disease Name", s: GRID_HEADER_STYLE }, { v: "Male Morbidity", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "Total Male", s: GRID_HEADER_STYLE }, { v: "Female Morbidity", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "Total Female", s: GRID_HEADER_STYLE }, { v: "Overall Total", s: GRID_HEADER_STYLE }]);
            exportRows.push([{ v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "<1", s: GRID_HEADER_STYLE }, { v: "1-4", s: GRID_HEADER_STYLE }, { v: "5-14", s: GRID_HEADER_STYLE }, { v: "15-29", s: GRID_HEADER_STYLE }, { v: "30-64", s: GRID_HEADER_STYLE }, { v: "≥65", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "<1", s: GRID_HEADER_STYLE }, { v: "1-4", s: GRID_HEADER_STYLE }, { v: "5-14", s: GRID_HEADER_STYLE }, { v: "15-29", s: GRID_HEADER_STYLE }, { v: "30-64", s: GRID_HEADER_STYLE }, { v: "≥65", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }]);
            
            morbidityData.forEach(row => {
                const m = row.counts.Male; const f = row.counts.Female;
                const totalM = m['<1yr'] + m['1-4yr'] + m['5-14yr'] + m['15-29yr'] + m['30-64yr'] + m['>=65yr'];
                const totalF = f['<1yr'] + f['1-4yr'] + f['5-14yr'] + f['15-29yr'] + f['30-64yr'] + f['>=65yr'];
                const total = totalM + totalF;
                exportRows.push([ { v: row.ext_id, s: GRID_CELL_LEFT_STYLE }, { v: row.disease_name, s: GRID_CELL_LEFT_STYLE }, { v: m['<1yr'], s: GRID_CELL_STYLE }, { v: m['1-4yr'], s: GRID_CELL_STYLE }, { v: m['5-14yr'], s: GRID_CELL_STYLE }, { v: m['15-29yr'], s: GRID_CELL_STYLE }, { v: m['30-64yr'], s: GRID_CELL_STYLE }, { v: m['>=65yr'], s: GRID_CELL_STYLE }, { v: totalM, s: GRID_CELL_STYLE }, { v: f['<1yr'], s: GRID_CELL_STYLE }, { v: f['1-4yr'], s: GRID_CELL_STYLE }, { v: f['5-14yr'], s: GRID_CELL_STYLE }, { v: f['15-29yr'], s: GRID_CELL_STYLE }, { v: f['30-64yr'], s: GRID_CELL_STYLE }, { v: f['>=65yr'], s: GRID_CELL_STYLE }, { v: totalF, s: GRID_CELL_STYLE }, { v: total, s: GRID_CELL_STYLE } ]);
            });
            const ws = xlsx.utils.aoa_to_sheet(exportRows);
            ws['!merges'] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, { s: { r: 4, c: 2 }, e: { r: 4, c: 7 } }, { s: { r: 4, c: 8 }, e: { r: 5, c: 8 } }, { s: { r: 4, c: 9 }, e: { r: 4, c: 14 } }, { s: { r: 4, c: 15 }, e: { r: 5, c: 15 } }, { s: { r: 4, c: 16 }, e: { r: 5, c: 16 } } ];
            ws['!cols'] = [ { wch: 7 }, { wch: 32 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 5 }, { wch: 5 }, { wch: 4 }, { wch: 6 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 5 }, { wch: 5 }, { wch: 4 }, { wch: 6 }, { wch: 6.5 } ];
            ws['!pageSetup'] = { scale: 70, orientation: 'landscape', paperSize: 9, fitToWidth: 1, fitToHeight: 1 };
            ws['!fitToPage'] = true;
            ws['!margins'] = { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.2, footer: 0.2 };
            ws['!printArea'] = `A1:Q${exportRows.length}`;
            xlsx.utils.book_append_sheet(wb, ws, "Morbidity Report");
            xlsx.writeFile(wb, `Health_Bureau_Morbidity_Report_${morbidityYear}_${morbidityMonth}.xlsx`);
            toast.success("Excel report exported automatically!");
        };

        return (
            <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200">
                     <div className="flex gap-4 items-center">
                         <select value={morbidityMonth} onChange={(e) => setMorbidityMonth(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded p-2 text-sm font-bold text-zinc-700 outline-none">
                            {monthNames.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                         </select>
                         <select value={morbidityYear} onChange={(e) => setMorbidityYear(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded p-2 text-sm font-bold text-zinc-700 outline-none">
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                     </div>
                     <button onClick={handleExportExcel} disabled={morbidityData.length === 0} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 text-sm flex gap-2 items-center disabled:opacity-50">
                        <Download className="w-4 h-4"/> Export Official Layout
                     </button>
                </div>
                
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                    {/* ... Minimal visual preview of morbidity ... */}
                    {morbidityData.length === 0 ? (
                        <div className="p-10 text-center text-zinc-500 font-medium">No Cases Found for this period.</div>
                    ) : (
                        <div className="overflow-x-auto p-4">
                            <p className="text-sm text-zinc-500 mb-4 px-2 tracking-wide font-medium flex items-center gap-2"><Activity className="w-4 h-4" /> Preview of Top Diagnoses</p>
                            <table className="w-full text-sm text-left border">
                                <thead className="bg-zinc-100 text-[11px] uppercase font-bold text-zinc-600 border-b">
                                    <tr><th className="p-3">Ext_ID</th><th className="p-3">Disease</th><th className="p-3 bg-indigo-50/50">Total Male</th><th className="p-3 bg-rose-50/50">Total Female</th><th className="p-3 bg-zinc-100">Overall</th></tr>
                                </thead>
                                <tbody>
                                    {morbidityData.map((row, i) => {
                                        const totalM = row.counts.Male['<1yr'] + row.counts.Male['1-4yr'] + row.counts.Male['5-14yr'] + row.counts.Male['15-29yr'] + row.counts.Male['30-64yr'] + row.counts.Male['>=65yr'];
                                        const totalF = row.counts.Female['<1yr'] + row.counts.Female['1-4yr'] + row.counts.Female['5-14yr'] + row.counts.Female['15-29yr'] + row.counts.Female['30-64yr'] + row.counts.Female['>=65yr'];
                                        return (
                                            <tr key={i} className="border-b">
                                                <td className="p-3 font-mono text-zinc-500 text-xs">{row.ext_id}</td>
                                                <td className="p-3 font-medium text-zinc-800">{row.disease_name}</td>
                                                <td className="p-3 font-bold text-indigo-700 bg-indigo-50/20">{totalM}</td>
                                                <td className="p-3 font-bold text-rose-700 bg-rose-50/20">{totalF}</td>
                                                <td className="p-3 font-black text-zinc-900 bg-zinc-50/80">{totalM + totalF}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans pb-24 h-full flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 rounded-[2rem] p-8 mb-8 shadow-xl shadow-zinc-900/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading tracking-tight mb-1">Reports & Analytics</h2>
                        <p className="text-zinc-400 font-medium text-sm">
                            Financial and clinical insights generation.
                        </p>
                    </div>
                </div>

                {/* Global Actions depending on tab */}
                <div className="relative z-10">
                    {activeTab === 'daily_income' && (
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-1.5 flex items-center">
                            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider pl-4 pr-2">Date:</span>
                            <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} className="bg-transparent border-none text-white font-bold px-3 py-2 outline-none [color-scheme:dark]" />
                        </div>
                    )}
                    {activeTab === 'monthly_revenue' && (
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-1.5 flex items-center">
                            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider pl-4 pr-2">Year:</span>
                            <select value={revenueYear} onChange={e => setRevenueYear(e.target.value)} className="bg-zinc-800 border-none text-white font-bold p-2 outline-none rounded-lg">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    )}
                    {activeTab === 'patient_stats' && (
                         <div className="px-5 py-2.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 rounded-xl text-sm font-bold">
                             YTD Analytics
                         </div>
                    )}
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 shrink-0 scrollbar-hide">
                {[
                    { id: 'daily_income', label: 'Daily Income', icon: DollarSign },
                    { id: 'monthly_revenue', label: 'Monthly Revenue', icon: TrendingUp },
                    { id: 'patient_stats', label: 'Patient Statistics', icon: Users },
                    { id: 'outstanding', label: 'Outstanding Payments', icon: AlertCircle },
                    { id: 'morbidity', label: 'ICD-11 Morbidity', icon: Activity }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap outline-none ${
                            activeTab === tab.id 
                            ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                            : 'bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200'
                        }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-400' : 'text-zinc-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error Overlay */}
            {error && (
                <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-center gap-4 mb-8 shrink-0">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm">Loading Error</h4>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            )}

            {/* Tab content container */}
            <div className="flex-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-3xl">
                        <div className="w-12 h-12 border-4 border-zinc-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <span className="text-zinc-500 font-bold tracking-wide animate-pulse">Running Report...</span>
                    </div>
                ) : null}

                {/* Render the active tab content gently underneath the loading spinner if overlayed */}
                <div className={loading ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity delay-100'}>
                    {activeTab === 'daily_income' && renderDailyIncome()}
                    {activeTab === 'monthly_revenue' && renderMonthlyRevenue()}
                    {activeTab === 'patient_stats' && renderPatientStats()}
                    {activeTab === 'outstanding' && renderOutstanding()}
                    {activeTab === 'morbidity' && renderMorbidity()}
                </div>
            </div>

        </div>
    );
};

export default Reports;
