'use client';

import React, { memo, useEffect, useState, useCallback } from 'react';
import CameraCard from './CameraCard';
import styles from '@/styles/dashboard.module.css';

interface Camera {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'streaming';
  createdAt: string;
  updatedAt: string;
  rtspUrl?: string;
}

interface CameraGridProps {
  cameras: Camera[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onCameraDeleted?: () => void;
}

function CameraGrid({ cameras, loading = false, error, onRetry, onCameraDeleted }: CameraGridProps) {
  const [visibleCameras, setVisibleCameras] = useState<Camera[]>([]);
  const [page, setPage] = useState(1);
  const camerasPerPage = 16;

  const handleCameraDelete = (cameraId: string) => {
    // Remove camera from local state immediately for better UX
    setVisibleCameras(prev => prev.filter(c => c.id !== cameraId));
    // Notify parent to refresh the camera list
    if (onCameraDeleted) {
      onCameraDeleted();
    }
  };

  // Intersection Observer for lazy loading
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cameraId = entry.target.getAttribute('data-camera-id');
        if (cameraId) {
          const camera = cameras.find(c => c.id === cameraId);
          if (camera && !visibleCameras.find(c => c.id === cameraId)) {
            setVisibleCameras(prev => [...prev, camera]);
          }
        }
      }
    });
  }, [cameras, visibleCameras]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    const elements = document.querySelectorAll('[data-camera-id]');
    elements.forEach(element => observer.observe(element));

    return () => observer.disconnect();
  }, [observerCallback]);

  // Reset visible cameras when camera list changes
  useEffect(() => {
    setVisibleCameras([]);
  }, [cameras]);

  const paginatedCameras = cameras.slice(0, page * camerasPerPage);
  const hasMore = cameras.length > page * camerasPerPage;

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <div>Loading cameras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>Failed to load cameras: {error}</div>
        {onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>No cameras found</div>
        <p>Configure your cameras to start monitoring</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.cameraGrid}>
        {paginatedCameras.map((camera) => (
          <div
            key={camera.id}
            data-camera-id={camera.id}
            style={{ minHeight: '300px' }}
          >
            <CameraCard camera={camera} onDelete={handleCameraDelete} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            className={styles.retryButton}
            onClick={loadMore}
            disabled={loading}
          >
            Load More Cameras
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(CameraGrid);
