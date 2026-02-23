'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CameraGrid from '@/components/camera/CameraGrid';
import AddCameraModal from '@/components/camera/AddCameraModal';
import { Plus } from 'lucide-react';
import styles from '@/styles/dashboard.module.css';

interface Camera {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'streaming';
  createdAt: string;
  updatedAt: string;
  rtspUrl?: string;
}

export default function Dashboard() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchCameras = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(undefined);

      const response = await fetch('/api/cameras');
      const data = await response.json();

      if (data.success) {
        setCameras(data.data.cameras || []);
      } else {
        setError(data.error?.message || 'Failed to fetch cameras');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const fetchStreamStatuses = useCallback(async () => {
    try {
      const response = await fetch('/api/streams/status');
      const data = await response.json();

      if (data.success && data.data.streams) {
        // Update camera statuses based on stream data
        setCameras(prevCameras =>
          prevCameras.map(camera => {
            const streamStatus = data.data.streams.find((s: any) => s.cameraId === camera.id);
            return {
              ...camera,
              status: streamStatus?.running ? 'streaming' : 'offline'
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to fetch stream statuses:', err);
    }
  }, []);

  useEffect(() => {
    fetchCameras().then(() => {
      // Fetch stream statuses immediately after cameras are loaded
      fetchStreamStatuses();
    });

    // Set up periodic status updates
    const interval = setInterval(fetchStreamStatuses, 5000); // 5 seconds for more responsive updates

    return () => clearInterval(interval);
  }, [fetchCameras, fetchStreamStatuses]);

  const handleRetry = useCallback(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleAddSuccess = useCallback(() => {
    fetchCameras(false); // Refresh without showing loading spinner
  }, [fetchCameras]);

  const handleCameraDeleted = useCallback(() => {
    fetchCameras(false); // Refresh without showing loading spinner
  }, [fetchCameras]);

  const onlineCount = cameras.filter(c => c.status === 'online' || c.status === 'streaming').length;
  const streamingCount = cameras.filter(c => c.status === 'streaming').length;

  return (
    <DashboardLayout title="CCTV Dashboard">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Security Camera Overview</h1>
          <p className={styles.pageSubtitle}>
            {cameras.length} total cameras • {streamingCount} streaming • {onlineCount} online
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Camera
        </button>
      </div>

      <CameraGrid
        cameras={cameras}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        onCameraDeleted={handleCameraDeleted}
      />

      <AddCameraModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </DashboardLayout>
  );
}
