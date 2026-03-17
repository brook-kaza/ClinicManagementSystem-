import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans animate-fade-in">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl shadow-zinc-200/50 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2 font-heading">Something went wrong</h1>
                        <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
                            A critical error occurred while rendering this interface. The issue has been logged.
                        </p>

                        <div className="bg-zinc-50 rounded-xl p-4 text-left border border-zinc-100 mb-8 overflow-x-auto">
                            <code className="text-[10px] text-zinc-600 font-mono">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-700 font-bold text-sm rounded-2xl hover:bg-zinc-50 transition-colors focus-ring"
                            >
                                <RefreshCw className="w-4 h-4" /> Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors focus-ring"
                            >
                                <Home className="w-4 h-4" /> Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
