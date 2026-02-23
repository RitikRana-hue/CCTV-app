'use client';

import React, { memo, useState } from 'react';
import VideoPlayer from './VideoPlayer';
import CameraSettingsModal from './CameraSettingsModal';
import { Trash2, AlertCircle, Settings } from 'lucide-react';
import styles from '@/styles/camera.module.css';

interface Camera {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'streaming';
  createdAt: string;
  updatedAt: string;
  rtspUrl?: string;
}

interface CameraCardProps {
  camera: Camera;
  onDelete?: (cameraId: string) => void;
}

function CameraCard({ camera, onDelete }: CameraCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActive = camera.status === 'streaming' || camera.status === 'online';

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      // Stop stream first (don't wait for response)
      fetch('/api/streams/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: camera.id }),
      }).catch(err => console.warn('Stream stop failed:', err));

      // Delete camera from database
      const response = await fetch(`/api/cameras/${camera.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.error?.message || data.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      // Successfully deleted
      onDelete(camera.id);
      setShowDeleteConfirm(false);

    } catch (error) {
      console.error('Error deleting camera:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete camera: ${errorMsg}`);
      setIsDeleting(false);
    }
  };

  const getStatusClass = () => {
    switch (camera.status) {
      case 'online':
        return styles.statusOnline;
      case 'offline':
        return styles.statusOffline;
      case 'streaming':
        return styles.statusStreaming;
      default:
        return styles.statusOffline;
    }
  };

  const getStatusText = () => {
    switch (camera.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'streaming':
        return 'Live';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={styles.cameraCard}>
      <div className={styles.cameraHeader}>
        <div className={styles.cameraInfo}>
          <h3 className={styles.cameraName}>{camera.name}</h3>
          <div className={styles.cameraMeta}>
            <span className={`${styles.statusIndicator} ${getStatusClass()}`}></span>
            <span>{getStatusText()}</span>
          </div>
        </div>
        <div className={styles.cameraActions}>
          <button
            className={`${styles.actionButton} ${styles.primary}`}
            title={isActive ? 'Stream Active' : 'Start Stream'}
          >
            {isActive ? '🔴' : '⚪'}
          </button>
          <button
            className={styles.actionButton}
            onClick={() => setShowSettings(true)}
            title="Camera Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            className={`${styles.actionButton} ${styles.danger}`}
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Camera"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={styles.cameraVideoContainer}>
        <VideoPlayer
          cameraId={camera.id}
          isActive={isActive}
          name={camera.name}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.deleteModal}>
          <div className={styles.deleteModalContent}>
            <div className={styles.deleteModalHeader}>
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3>Delete Camera?</h3>
            </div>
            <p className={styles.deleteModalText}>
              Are you sure you want to delete <strong>{camera.name}</strong>?
              This will stop the stream and remove the camera from your system.
            </p>
            <div className={styles.deleteModalActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={styles.deleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Camera'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <CameraSettingsModal
        camera={camera}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default memo(CameraCard);
