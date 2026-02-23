'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/camera.module.css';

interface VideoPlayerProps {
  cameraId: string;
  isActive: boolean;
  name: string;
}

export default function VideoPlayer({ cameraId, isActive, name }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const streamUrl = `/api/hls/${cameraId}/playlist.m3u8`;

  useEffect(() => {
    if (!videoRef.current || !isActive) return;

    const video = videoRef.current;

    // Dynamic import Hls.js for better performance
    const loadHls = async () => {
      try {
        const Hls = (await import('hls.js')).default;

        if (Hls.isSupported()) {
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,

            // Ultra-low latency settings
            maxBufferLength: 2,  // Keep only 2 seconds in buffer
            maxMaxBufferLength: 3,  // Maximum 3 seconds
            maxBufferSize: 2 * 1000 * 1000,  // 2MB max buffer
            maxBufferHole: 0.1,  // Minimal buffer holes

            // Live stream optimization
            liveSyncDurationCount: 1,  // Stay as close to live as possible
            liveMaxLatencyDurationCount: 2,  // Maximum 2 segments behind
            liveDurationInfinity: true,
            liveBackBufferLength: 0,  // No back buffer for live

            // Fast start
            startLevel: -1,  // Auto quality
            autoStartLoad: true,
            startPosition: -1,  // Start at live edge

            // Aggressive fragment loading
            manifestLoadingTimeOut: 2000,
            manifestLoadingMaxRetry: 1,
            levelLoadingTimeOut: 2000,
            levelLoadingMaxRetry: 1,
            fragLoadingTimeOut: 2000,
            fragLoadingMaxRetry: 1,
          });

          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            setHasError(false);
            setIsPlaying(true);
            // Force video to start at live edge
            if (video) {
              video.play().catch(err => console.log('Autoplay prevented:', err));
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error(`HLS Error for ${cameraId}:`, event, data);

            // Handle recoverable errors
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('Network error, attempting recovery...');
                  // If manifest not found, stream might not be ready yet - retry
                  if (data.details === 'manifestLoadError') {
                    setTimeout(() => {
                      if (hlsRef.current && !hlsRef.current.destroyed) {
                        console.log('Retrying stream load...');
                        hlsRef.current.loadSource(streamUrl);
                      }
                    }, 2000);
                  } else {
                    hls.startLoad();
                  }
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Media error, attempting recovery...');
                  hls.recoverMediaError();
                  break;
                default:
                  setHasError(true);
                  setIsLoading(false);
                  // Attempt to reconnect after 5 seconds
                  setTimeout(() => {
                    if (hlsRef.current) {
                      hlsRef.current.destroy();
                    }
                    loadHls();
                  }, 5000);
                  break;
              }
            }
          });

          hls.on(Hls.Events.FRAG_LOADED, () => {
            setIsPlaying(true);
            // Keep video at live edge - jump forward if we're falling behind
            if (video && !video.paused) {
              const buffered = video.buffered;
              if (buffered.length > 0) {
                const end = buffered.end(buffered.length - 1);
                const currentTime = video.currentTime;
                // If we're more than 3 seconds behind, jump to live edge
                if (end - currentTime > 3) {
                  video.currentTime = end - 0.5;
                }
              }
            }
          });

        } else {
          // Fallback to native video playback
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            setHasError(false);
          });

          video.addEventListener('error', (e) => {
            console.error(`Video error for ${cameraId}:`, e);
            setHasError(true);
            setIsLoading(false);
          });
        }
      } catch (error) {
        console.error(`Failed to load HLS for ${cameraId}:`, error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadHls();

    // Monitor and maintain live edge every 2 seconds
    const liveEdgeInterval = setInterval(() => {
      if (video && !video.paused && video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        const currentTime = video.currentTime;
        // If we're more than 2 seconds behind, jump to live edge
        if (end - currentTime > 2) {
          console.log(`Jumping to live edge: ${currentTime.toFixed(2)} -> ${(end - 0.5).toFixed(2)}`);
          video.currentTime = end - 0.5;
        }
      }
    }, 2000);

    return () => {
      clearInterval(liveEdgeInterval);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.src = '';
      }
    };
  }, [cameraId, streamUrl, isActive]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error(`Failed to play video for ${cameraId}:`, error);
      });
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // Force re-initialization
    const event = new Event('retry');
    videoRef.current?.dispatchEvent(event);
  };

  return (
    <div className={styles.cameraVideoContainer}>
      <video
        ref={videoRef}
        className={styles.videoPlayer}
        muted
        playsInline
        autoPlay={isActive}
        controls={false}
        onLoadedMetadata={handleMute}
        onPlay={handlePlay}
      />

      {isLoading && (
        <div className={styles.videoLoading}>
          <div className={styles.videoSpinner}></div>
          <div>Connecting to {name}...</div>
        </div>
      )}

      {hasError && (
        <div className={styles.videoError}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>Stream Unavailable</div>
          <div className={styles.errorMessage}>
            Unable to connect to {name}. The camera may be offline or experiencing network issues.
          </div>
          <button className={styles.retryButton} onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !hasError && (
        <div className={styles.videoControls}>
          <button className={styles.controlButton} onClick={handlePlay} title="Play">
            ▶️
          </button>
          <button className={styles.controlButton} onClick={handleMute} title="Muted">
            🔇
          </button>
        </div>
      )}
    </div>
  );
}
