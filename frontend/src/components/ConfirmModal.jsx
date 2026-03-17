import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900/50 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="relative w-full max-w-md p-4 mx-auto animate-fade-in-up">
        <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
          <button
            onClick={onCancel}
            type="button"
            className="absolute top-3 right-3 text-gray-400 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 min-h-16 min-w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
            <p className="mb-6 text-sm text-gray-500 whitespace-pre-wrap">{message}</p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={onCancel}
                type="button"
                className="text-gray-600 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                type="button"
                className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center transition-colors cursor-pointer shadow-sm"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
