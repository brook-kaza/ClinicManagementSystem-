import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 font-sans animate-fade-in">
            <div className="max-w-md w-full text-center">
                <div className="relative mb-8">
                    {/* Animated background rings */}
                    <div className="absolute inset-0 bg-red-100 rounded-full scale-[2.5] opacity-20 animate-pulse"></div>
                    <div className="absolute inset-0 bg-red-50 rounded-full scale-[1.8] opacity-40 animate-pulse delay-700"></div>

                    <div className="relative z-10 w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl border-2 border-red-100">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight font-heading">
                    Restricted Access
                </h2>

                <p className="text-zinc-500 mb-10 leading-relaxed font-medium">
                    Your current account role does not have the necessary permissions to access clinical records.
                    Please contact an administrator if you believe this is an error.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-2xl hover:bg-zinc-50 transition-all shadow-sm focus-ring"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 focus-ring"
                    >
                        <Home className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>

                {/* Technical Info */}
                <div className="mt-12 pt-8 border-t border-zinc-100">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full border border-red-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Error Code: 403_FORBIDDEN</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
