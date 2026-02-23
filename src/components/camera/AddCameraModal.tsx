'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddCameraModal({ isOpen, onClose, onSuccess }: AddCameraModalProps) {
    const [name, setName] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const [port, setPort] = useState('8080');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [cameraType, setCameraType] = useState('smartphone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Add ESC key listener
    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape' && !loading) {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const buildRtspUrl = () => {
        if (cameraType === 'smartphone') {
            return `rtsp://${ipAddress}:${port}/h264_pcm.sdp`;
        } else {
            const auth = password ? `${username}:${password}@` : '';
            return `rtsp://${auth}${ipAddress}:${port}/stream1`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const rtspUrl = buildRtspUrl();

            // Add camera
            const addResponse = await fetch('/api/cameras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rtspUrl }),
            });

            const addData = await addResponse.json();

            if (!addData.success) {
                throw new Error(addData.error?.message || 'Failed to add camera');
            }

            const cameraId = addData.data.id;

            // Start stream in background (don't wait for it)
            fetch('/api/streams/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cameraId, rtspUrl }),
            }).catch(err => {
                console.error('Stream start failed:', err);
            });

            // Success! Close modal immediately
            setName('');
            setIpAddress('');
            setPassword('');
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add camera');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-8"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-lg shadow-2xl w-full h-full md:max-w-2xl md:max-h-[90vh] border border-gray-700 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-semibold text-white">Add New Camera</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                        title="Close (or click outside)"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Camera Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Camera Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Front Door Camera"
                            required
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Camera Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Camera Type
                        </label>
                        <select
                            value={cameraType}
                            onChange={(e) => setCameraType(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="smartphone">Smartphone (IP Webcam)</option>
                            <option value="ipcamera">IP Camera (RTSP)</option>
                        </select>
                    </div>

                    {/* IP Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            IP Address *
                        </label>
                        <input
                            type="text"
                            value={ipAddress}
                            onChange={(e) => setIpAddress(e.target.value)}
                            placeholder="e.g., 192.168.1.100"
                            required
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Port */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Port
                        </label>
                        <input
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="8080 or 554"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Username & Password (only for IP cameras) */}
                    {cameraType === 'ipcamera' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="admin"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* RTSP URL Preview */}
                    <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">RTSP URL:</p>
                        <p className="text-xs text-gray-300 font-mono break-all">
                            {ipAddress ? buildRtspUrl() : 'Enter IP address to see URL'}
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name || !ipAddress}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm md:text-base font-medium"
                        >
                            {loading ? 'Adding...' : 'Add Camera'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
