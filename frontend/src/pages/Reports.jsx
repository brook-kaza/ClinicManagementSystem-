import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Activity, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import * as xlsx from 'xlsx-js-style';

const Reports = () => {
    // ... (Keep existing state and lifecycle logic exactly the same)
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/reports/morbidity?month=${month}&year=${year}`);
            setReportData(response.data);
            if (response.data.length === 0) {
                toast("No ICD-11 cases recorded for this period.", { icon: '📊' });
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate report. Please try again later.");
            toast.error("Report generation failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleExportExcel = () => {
        if (reportData.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const wb = xlsx.utils.book_new();

        // Define Styles
        const TITLE_STYLE = {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: "left" }
        };
        const HEADER_INFO_STYLE = {
            font: { bold: true, sz: 10 }
        };
        const DATA_INFO_STYLE = {
            font: { sz: 10 }
        };

        // Border definition for the main data grid
        const BORDER_STYLE = {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } }
        };

        const GRID_HEADER_STYLE = {
            font: { bold: true, sz: 9 },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: BORDER_STYLE,
            fill: { fgColor: { rgb: "F3F4F6" } } // Light gray background
        };

        const GRID_CELL_STYLE = {
            font: { sz: 9 },
            alignment: { horizontal: "center", vertical: "center" },
            border: BORDER_STYLE
        };

        const GRID_CELL_LEFT_STYLE = {
            font: { sz: 9 },
            alignment: { horizontal: "left", vertical: "center" },
            border: BORDER_STYLE
        };

        const exportRows = [];

        // --- ROW 0: Main Title ---
        exportRows.push([{ v: "Health Center/Hospital/Clinic monthly disease reporting form", s: TITLE_STYLE }]);

        // --- ROW 1: Info ---
        exportRows.push([
            { v: "Facility:", s: HEADER_INFO_STYLE }, { v: "Hani Dental Clinic", s: DATA_INFO_STYLE }, { v: "" },
            { v: "Region:", s: HEADER_INFO_STYLE }, { v: "Addis Ababa", s: DATA_INFO_STYLE }, { v: "" },
            { v: "Month:", s: HEADER_INFO_STYLE }, { v: month, s: DATA_INFO_STYLE }, { v: "" }
        ]);

        // --- ROW 2: Info ---
        exportRows.push([
            { v: "To:", s: HEADER_INFO_STYLE }, { v: "Health Bureau", s: DATA_INFO_STYLE }, { v: "" },
            { v: "Type:", s: HEADER_INFO_STYLE }, { v: "OPD", s: DATA_INFO_STYLE }, { v: "" },
            { v: "Year:", s: HEADER_INFO_STYLE }, { v: year, s: DATA_INFO_STYLE }, { v: "" }
        ]);

        // --- ROW 3: Blank ---
        exportRows.push([]);

        // --- ROW 4: Primary Table Headers ---
        exportRows.push([
            { v: "Ext_ID", s: GRID_HEADER_STYLE },
            { v: "Disease Name", s: GRID_HEADER_STYLE },
            { v: "Male Morbidity", s: GRID_HEADER_STYLE },
            { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "Total Male", s: GRID_HEADER_STYLE },
            { v: "Female Morbidity", s: GRID_HEADER_STYLE },
            { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE }, { v: "Total Female", s: GRID_HEADER_STYLE },
            { v: "Overall Total", s: GRID_HEADER_STYLE }
        ]);

        // --- ROW 5: Secondary Table Headers ---
        exportRows.push([
            { v: "", s: GRID_HEADER_STYLE },
            { v: "", s: GRID_HEADER_STYLE },
            { v: "<1", s: GRID_HEADER_STYLE }, { v: "1-4", s: GRID_HEADER_STYLE }, { v: "5-14", s: GRID_HEADER_STYLE }, { v: "15-29", s: GRID_HEADER_STYLE }, { v: "30-64", s: GRID_HEADER_STYLE }, { v: "≥65", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE },
            { v: "<1", s: GRID_HEADER_STYLE }, { v: "1-4", s: GRID_HEADER_STYLE }, { v: "5-14", s: GRID_HEADER_STYLE }, { v: "15-29", s: GRID_HEADER_STYLE }, { v: "30-64", s: GRID_HEADER_STYLE }, { v: "≥65", s: GRID_HEADER_STYLE }, { v: "", s: GRID_HEADER_STYLE },
            { v: "", s: GRID_HEADER_STYLE }
        ]);

        // --- DATA ROWS ---
        reportData.forEach(row => {
            const m = row.counts.Male;
            const f = row.counts.Female;
            const totalM = m['<1yr'] + m['1-4yr'] + m['5-14yr'] + m['15-29yr'] + m['30-64yr'] + m['>=65yr'];
            const totalF = f['<1yr'] + f['1-4yr'] + f['5-14yr'] + f['15-29yr'] + f['30-64yr'] + f['>=65yr'];
            const total = totalM + totalF;

            // Convert everything to styled objects
            exportRows.push([
                { v: row.ext_id, s: GRID_CELL_LEFT_STYLE },
                { v: row.disease_name, s: GRID_CELL_LEFT_STYLE },
                { v: m['<1yr'], s: GRID_CELL_STYLE }, { v: m['1-4yr'], s: GRID_CELL_STYLE }, { v: m['5-14yr'], s: GRID_CELL_STYLE }, { v: m['15-29yr'], s: GRID_CELL_STYLE }, { v: m['30-64yr'], s: GRID_CELL_STYLE }, { v: m['>=65yr'], s: GRID_CELL_STYLE }, { v: totalM, s: GRID_CELL_STYLE },
                { v: f['<1yr'], s: GRID_CELL_STYLE }, { v: f['1-4yr'], s: GRID_CELL_STYLE }, { v: f['5-14yr'], s: GRID_CELL_STYLE }, { v: f['15-29yr'], s: GRID_CELL_STYLE }, { v: f['30-64yr'], s: GRID_CELL_STYLE }, { v: f['>=65yr'], s: GRID_CELL_STYLE }, { v: totalF, s: GRID_CELL_STYLE },
                { v: total, s: GRID_CELL_STYLE }
            ]);
        });

        const ws = xlsx.utils.aoa_to_sheet(exportRows);

        // Add Merges to combine cells across headers
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // Title
            { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },  // Facility Value
            { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } },  // Bureau Value
            { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } },  // Region Value

            // Grid Header Merges
            { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },  // Vert Merge Ext_ID
            { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },  // Vert Merge Disease Name
            { s: { r: 4, c: 2 }, e: { r: 4, c: 7 } },  // Horz Merge Male Morbidity
            { s: { r: 4, c: 8 }, e: { r: 5, c: 8 } },  // Vert Merge Total Male
            { s: { r: 4, c: 9 }, e: { r: 4, c: 14 } }, // Horz Merge Female Morbidity
            { s: { r: 4, c: 15 }, e: { r: 5, c: 15 } }, // Vert Merge Total Female
            { s: { r: 4, c: 16 }, e: { r: 5, c: 16 } }  // Vert Merge Total
        ];

        // Ensure proper landscape fit — tighter widths so everything fits on one printed page
        ws['!cols'] = [
            { wch: 7 },  // Ext_ID
            { wch: 32 }, // Disease Name
            { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 5 }, { wch: 5 }, { wch: 4 }, { wch: 6 }, // Male + Total
            { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 5 }, { wch: 5 }, { wch: 4 }, { wch: 6 }, // Female + Total
            { wch: 6.5 }   // Overall Total
        ];

        // Force fit everything on exactly 1 page wide x 1 page tall
        ws['!pageSetup'] = {
            scale: 70,
            orientation: 'landscape',
            paperSize: 9,
            fitToWidth: 1,
            fitToHeight: 1
        };
        ws['!fitToPage'] = true;
        ws['!margins'] = { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.2, footer: 0.2 };

        // Set print area to cover exactly the data range
        const lastRow = exportRows.length - 1;
        ws['!printArea'] = `A1:Q${lastRow + 1}`;

        xlsx.utils.book_append_sheet(wb, ws, "Morbidity Report");

        // Use standard naming convention
        const fileName = `Health_Bureau_Morbidity_Report_${year}_${strPad(month)}.xlsx`;
        xlsx.writeFile(wb, fileName);
        toast.success("Excel report exported automatically!");
    };

    const strPad = (n) => String(n).padStart(2, '0');

    // Generate years for dropdown
    const yearOptions = [];
    for (let y = today.getFullYear() - 5; y <= today.getFullYear() + 1; y++) {
        yearOptions.push(y);
    }

    // Month Names
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in pb-24">

            {/* Header Area */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-8 mb-8 shadow-xl shadow-zinc-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-heading tracking-tight mb-1">Morbidity Reporting</h2>
                        <p className="text-zinc-500 font-medium text-sm">
                            Generate standard monthly disease aggregation reports based on ESV ICD-11 codes.
                        </p>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 shadow-sm">
                        <div className="flex items-center px-4 py-2 border-r border-zinc-200 gap-2 text-zinc-600 font-medium">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-zinc-800 cursor-pointer pl-3 pr-8 py-2.5 outline-none"
                        >
                            {monthNames.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-zinc-800 cursor-pointer pl-2 pr-6 py-2.5 outline-none border-l border-zinc-200"
                        >
                            {yearOptions.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="bg-white border-2 border-zinc-200 text-zinc-700 px-6 py-3.5 rounded-xl font-bold hover:bg-zinc-50 hover:text-zinc-900 transition-all focus-ring disabled:opacity-50"
                    >
                        {loading ? 'Crunching...' : 'View Data'}
                    </button>

                    <button
                        onClick={handleExportExcel}
                        disabled={loading || reportData.length === 0}
                        className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all focus-ring flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-5 h-5" /> Export to Excel
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-center gap-4 mb-8">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm">Generation Error</h4>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            )}

            {/* Data Table Preview */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden relative">

                {/* Visual Header */}
                <div className="bg-zinc-950 p-6 sm:px-8 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white font-heading tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" /> Bureau Report Preview
                        </h3>
                        <p className="text-zinc-400 text-sm mt-1">Health Center/Hospital/Clinic monthly disease reporting form (OPD)</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Period</p>
                        <p className="text-sm font-semibold text-indigo-300">{monthNames[month - 1]} {year}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-12 h-12 border-4 border-zinc-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <span className="text-zinc-500 font-bold tracking-wide animate-pulse">Aggregating Morbidity Data...</span>
                    </div>
                ) : reportData.length === 0 && !error ? (
                    <div className="text-center py-32 bg-zinc-50 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-200 shadow-sm">
                            <Calendar className="w-8 h-8 text-zinc-300" />
                        </div>
                        <h4 className="text-lg font-bold text-zinc-800 mb-2 font-heading tracking-tight">No Cases Found</h4>
                        <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">There are no visits recorded with an official ICD-11 diagnosis for the selected month and year.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                                <tr>
                                    <th rowSpan={2} className="px-6 py-4 border-r border-zinc-200 bg-zinc-100/50 w-24">Ext_ID</th>
                                    <th rowSpan={2} className="px-6 py-4 border-r border-zinc-200 bg-zinc-100/50 min-w-[200px]">Disease Name</th>
                                    <th colSpan={6} className="px-6 py-3 text-center border-b border-r border-zinc-200 text-indigo-700 bg-indigo-50/50">Morbidity (Male Age Buckets)</th>
                                    <th rowSpan={2} className="px-4 py-3 text-center border-b border-r border-zinc-200 text-indigo-800 bg-indigo-100/80 w-20">Total Male</th>
                                    <th colSpan={6} className="px-6 py-3 text-center border-b border-r border-zinc-200 text-rose-700 bg-rose-50/50">Morbidity (Female Age Buckets)</th>
                                    <th rowSpan={2} className="px-4 py-3 text-center border-b border-r border-zinc-200 text-rose-800 bg-rose-100/80 w-20">Total Female</th>
                                    <th rowSpan={2} className="px-6 py-4 text-center border-b border-zinc-200 font-extrabold text-zinc-900 bg-zinc-200/50 w-24">Overall Total</th>
                                </tr>
                                <tr>
                                    {/* MALE */}
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-indigo-600">&lt;1yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-indigo-600">1-4yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-indigo-600">5-14yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-indigo-600">15-29yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-indigo-600">30-64yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-indigo-600">≥65yr</th>
                                    {/* FEMALE */}
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-rose-600">&lt;1yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-rose-600">1-4yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-rose-600">5-14yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-rose-600">15-29yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-rose-600">30-64yr</th>
                                    <th className="px-3 py-2 text-center border-r border-zinc-200 text-rose-600">≥65yr</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) => {
                                    const totalM = row.counts.Male['<1yr'] + row.counts.Male['1-4yr'] + row.counts.Male['5-14yr'] + row.counts.Male['15-29yr'] + row.counts.Male['30-64yr'] + row.counts.Male['>=65yr'];
                                    const totalF = row.counts.Female['<1yr'] + row.counts.Female['1-4yr'] + row.counts.Female['5-14yr'] + row.counts.Female['15-29yr'] + row.counts.Female['30-64yr'] + row.counts.Female['>=65yr'];
                                    const grandTotal = totalM + totalF;
                                    
                                    return (
                                    <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-zinc-600 border-r border-zinc-100 bg-zinc-50/30">
                                            {row.ext_id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-zinc-900 border-r border-zinc-100 bg-white">
                                            {row.disease_name}
                                        </td>
                                        {/* Male */}
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-indigo-50/10">{row.counts.Male['<1yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-indigo-50/10">{row.counts.Male['1-4yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-indigo-50/10">{row.counts.Male['5-14yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-indigo-50/10">{row.counts.Male['15-29yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-indigo-50/10">{row.counts.Male['30-64yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center font-semibold text-indigo-900 border-r border-zinc-200 bg-indigo-50/20">{row.counts.Male['>=65yr'] || '-'}</td>
                                        <td className="px-4 py-4 text-center font-bold text-indigo-700 border-r border-zinc-200 bg-indigo-50/40">{totalM}</td>

                                        {/* Female */}
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-rose-50/10">{row.counts.Female['<1yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-rose-50/10">{row.counts.Female['1-4yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-rose-50/10">{row.counts.Female['5-14yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-rose-50/10">{row.counts.Female['15-29yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center text-zinc-700 border-r border-zinc-100 bg-rose-50/10">{row.counts.Female['30-64yr'] || '-'}</td>
                                        <td className="px-3 py-4 text-center font-semibold text-rose-900 border-r border-zinc-200 bg-rose-50/20">{row.counts.Female['>=65yr'] || '-'}</td>
                                        <td className="px-4 py-4 text-center font-bold text-rose-700 border-r border-zinc-200 bg-rose-50/40">{totalF}</td>
                                        
                                        {/* Grand Total */}
                                        <td className="px-6 py-4 text-center font-extrabold text-zinc-900 bg-zinc-50/80">{grandTotal}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Reports;
