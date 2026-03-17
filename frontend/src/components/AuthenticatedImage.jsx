import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ImageIcon } from 'lucide-react';

const AuthenticatedImage = ({ src, className, alt = "Patient X-ray" }) => {
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setLoading(false);
            return;
        }

        const fetchImage = async () => {
            setLoading(true);
            setError(false);
            try {
                // Determine the correct relative path for axios
                let relativePath = src;
                if (src.startsWith('http')) {
                    try {
                        const url = new URL(src);
                        relativePath = url.pathname;
                    } catch (e) {
                        console.error("Invalid URL in AuthenticatedImage:", src);
                    }
                }
                
                // Remove /api/v1 if it exists in the path since axios already prepends it
                if (relativePath.includes('/api/v1')) {
                    relativePath = relativePath.split('/api/v1').pop();
                }

                const response = await api.get(relativePath, { responseType: 'blob' });
                const imageObjectURL = URL.createObjectURL(response.data);
                setImgSrc(imageObjectURL);
            } catch (err) {
                console.error("Error loading authenticated image:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchImage();

        // Cleanup the object URL
        return () => {
            if (imgSrc) URL.revokeObjectURL(imgSrc);
        };
    }, [src]);

    if (loading) {
        return (
            <div className={`bg-zinc-100 animate-pulse flex items-center justify-center ${className}`}>
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !imgSrc) {
        return (
            <div className={`bg-red-50 flex flex-col items-center justify-center text-red-400 gap-2 border border-red-100 ${className}`}>
                <ImageIcon className="w-8 h-8 opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Failed to load</span>
            </div>
        );
    }

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={`${className} object-cover`}
            onClick={() => window.open(imgSrc, '_blank')}
        />
    );
};

export default AuthenticatedImage;
