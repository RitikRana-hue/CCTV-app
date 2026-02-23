'use client';

import { useState, useEffect } from 'react';
import { X, Camera, Wifi, Clock, Video } from 'lucide-react';

interface Camera {
    id: string;
    name: string;
    rtspUrl?: string;
    status: 'online' | 'offline' | 'streaming';
    createdAt: string;
    updatedAt: string;
}

interface CameraSettingsModalProps {
    camera: Camera;
    isOpen: boolean;
    onClose: () => void;
}

export default function CameraSettingsModal({ camera, isOpen, onClose }: CameraSettingsModalProps) {
    const [streamInfo, setStreamInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchStreamInfo();

            // Add ESC key listener
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };

            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, camera.id, onClose]);

    const fetchStreamInfo = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/streams/status`);
            const data = await response.json();

            if (data.success && data.data.streams) {
                const stream = data.data.streams.find((s: any) => s.cameraId === camera.id);
                setStreamInfo(stream);
            }
        } catch (error) {
            console.error('Failed to fetch stream info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = () => {
        switch (camera.status) {
            case 'streaming':
                return 'text-green-500';
            case 'online':
                return 'text-blue-500';
            case 'offline':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const maskRtspUrl = (url?: string) => {
        if (!url) return 'Not configured';
        return url.replace(/:([^@]+)@/, ':****@');
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-8"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-lg shadow-2xl w-full h-full md:max-w-4xl md:max-h-[85vh] border border-gray-700 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700 bg-gray-900 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Camera className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl md:text-2xl font-semibold text-white">Camera Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                        title="Close (or click outside)"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1">
                    <div>
                        <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Basic Information
                        </h3>
                        <div className="bg-gray-800 rounded-lg p-3 md:p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Camera Name:</span>
                                <span className="text-white font-medium">{camera.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Camera ID:</span>
                                <span className="text-white font-mono text-sm">{camera.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Status:</span>
                                <span className={`font-medium capitalize ${getStatusColor()}`}>
                                    {camera.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                            <Wifi className="w-5 h-5" />
                            Connection Details
                        </h3>
                        <div className="bg-gray-800 rounded-lg p-3 md:p-4 space-y-3">
                            <div>
                                <span className="text-gray-400 block mb-1">RTSP URL:</span>
                                <code className="text-white font-mono text-sm bg-gray-900 px-3 py-2 rounded block break-all">
                                    {maskRtspUrl(camera.rtspUrl)}
                                </code>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Stream URL:</span>
                                <code className="text-white font-mono text-xs">
                                    /api/hls/{camera.id}/playlist.m3u8
                                </code>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Timestamps
                        </h3>
                        <div className="bg-gray-800 rounded-lg p-3 md:p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Created:</span>
                                <span className="text-white text-sm">{formatDate(camera.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Last Updated:</span>
                                <span className="text-white text-sm">{formatDate(camera.updatedAt)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(camera.id);
                                alert('Camera ID copied!');
                            }}
                            className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
                        >
                            Copy Camera ID
                        </button>
                        <button
                            onClick={() => {
                                const streamUrl = `${window.location.origin}/api/hls/${camera.id}/playlist.m3u8`;
                                navigator.clipboard.writeText(streamUrl);
                                alert('Stream URL copied!');
                            }}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
                        >
                            Copy Stream URL
                        </button>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm md:text-base"
                        >
                            Close Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
