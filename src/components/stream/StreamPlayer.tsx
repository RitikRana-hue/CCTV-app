'use client';

import { useEffect, useRef, useState } from 'react';
import { HLSPlayer } from '@/lib/streaming/hls-player';
import { Camera, CameraStatus } from '@/types';
import { Play, Pause, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';

interface StreamPlayerProps {
  camera: Camera;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

export function StreamPlayer({
  camera,
  autoPlay = true,
  muted = true,
  controls = true,
  className = ''
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HLSPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = new HLSPlayer(videoRef.current, {
      autoplay: autoPlay,
      muted: muted,
      controls: false, // We use custom controls
    });

    playerRef.current = player;

    // Load stream if camera is online or streaming
    if (camera.status === CameraStatus.ONLINE || camera.status === 'streaming') {
      const streamUrl = `/api/hls/${camera.id}/playlist.m3u8`;
      player.loadStream(streamUrl)
        .then(() => {
          setIsLoading(false);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setError(`Camera is ${camera.status}`);
    }

    // Set up event listeners
    const video = videoRef.current;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };
    const handleLoadedMetadata = () => setIsLoading(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [camera, autoPlay, muted]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play().catch(console.error);
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;

    const newMuted = !isMuted;
    playerRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return;

    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;

    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if ((videoRef.current as any).webkitRequestFullscreen) {
      (videoRef.current as any).webkitRequestFullscreen();
    } else if ((videoRef.current as any).mozRequestFullScreen) {
      (videoRef.current as any).mozRequestFullScreen();
    } else if ((videoRef.current as any).msRequestFullscreen) {
      (videoRef.current as any).msRequestFullscreen();
    }
  };

  const getStatusColor = (status: CameraStatus) => {
    switch (status) {
      case CameraStatus.ONLINE:
        return 'bg-green-500';
      case CameraStatus.OFFLINE:
        return 'bg-red-500';
      case CameraStatus.CONNECTING:
        return 'bg-yellow-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: CameraStatus) => {
    switch (status) {
      case CameraStatus.ONLINE:
        return 'Live';
      case CameraStatus.OFFLINE:
        return 'Offline';
      case CameraStatus.CONNECTING:
        return 'Connecting...';
      case CameraStatus.ERROR:
        return 'Error';
      case CameraStatus.MAINTENANCE:
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={`relative video-container ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="stream-player w-full h-full"
        playsInline
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="video-overlay">
          <div className="text-center text-white">
            <div className="loading-spinner w-8 h-8 mx-auto mb-2"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="video-overlay">
          <div className="text-center text-white">
            <p className="text-red-400 mb-2">Stream Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-2 left-2">
        <span className={`px-2 py-1 rounded text-xs text-white font-medium ${getStatusColor(camera.status)}`}>
          {getStatusText(camera.status)}
        </span>
      </div>

      {/* Camera info */}
      <div className="absolute top-2 right-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
        {camera.name}
      </div>

      {/* Custom controls */}
      {controls && camera.status === CameraStatus.ONLINE && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="control-button"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMuteToggle}
                  className="control-button"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFullscreen}
                className="control-button"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                className="control-button"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
