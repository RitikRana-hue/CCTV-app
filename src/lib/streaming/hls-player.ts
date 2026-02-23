import Hls from 'hls.js';

export interface HLSPlayerConfig {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  poster?: string;
}

export class HLSPlayer {
  private hls: Hls | null = null;
  private video: HTMLVideoElement;
  private config: HLSPlayerConfig;

  constructor(videoElement: HTMLVideoElement, config: HLSPlayerConfig = {}) {
    this.video = videoElement;
    this.config = {
      autoplay: true,
      muted: true,
      controls: false,
      loop: false,
      ...config
    };
  }

  async loadStream(streamUrl: string): Promise<void> {
    try {
      // Check if HLS is supported
      if (Hls.isSupported()) {
        this.hls = new Hls({
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

        this.hls.loadSource(streamUrl);
        this.hls.attachMedia(this.video);

        // Set up event listeners
        this.setupEventListeners();

        // Apply video element settings
        this.applyVideoSettings();

      } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        this.video.src = streamUrl;
        this.applyVideoSettings();
      } else {
        throw new Error('HLS is not supported in this browser');
      }

    } catch (error) {
      console.error('Failed to load HLS stream:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.hls) return;

    this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log('HLS media attached');
    });

    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log('HLS manifest parsed', data);
      if (this.config.autoplay) {
        this.video.play().catch(error => {
          console.warn('Autoplay failed:', error);
        });
      }
    });

    this.hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data);

      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Fatal network error, trying to recover...');
            this.hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Fatal media error, trying to recover...');
            this.hls?.recoverMediaError();
            break;
          default:
            console.error('Fatal error, destroying HLS instance');
            this.destroy();
            break;
        }
      }
    });

    this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
      console.log('HLS level loaded:', data);
    });

    this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      console.log('HLS fragment loaded:', data);
    });
  }

  private applyVideoSettings(): void {
    this.video.autoplay = this.config.autoplay || false;
    this.video.muted = this.config.muted || false;
    this.video.controls = this.config.controls || false;
    this.video.loop = this.config.loop || false;

    if (this.config.poster) {
      this.video.poster = this.config.poster;
    }
  }

  play(): Promise<void> {
    return this.video.play();
  }

  pause(): void {
    this.video.pause();
  }

  stop(): void {
    this.video.pause();
    this.video.currentTime = 0;
  }

  setMuted(muted: boolean): void {
    this.video.muted = muted;
  }

  getMuted(): boolean {
    return this.video.muted;
  }

  setVolume(volume: number): void {
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.video.volume;
  }

  getCurrentTime(): number {
    return this.video.currentTime;
  }

  getDuration(): number {
    return this.video.duration;
  }

  isPlaying(): boolean {
    return !this.video.paused && !this.video.ended;
  }

  isLive(): boolean {
    // Check if the stream is live based on duration and current time
    return this.video.duration === Infinity ||
      (this.video.duration && this.video.currentTime > this.video.duration - 10);
  }

  getQualityLevels(): any[] {
    if (!this.hls) return [];
    return this.hls.levels.map((level, index) => ({
      index,
      height: level.height,
      width: level.width,
      bitrate: level.bitrate,
      name: `${level.height}p`
    }));
  }

  setQualityLevel(levelIndex: number): void {
    if (this.hls && levelIndex >= 0 && levelIndex < this.hls.levels.length) {
      this.hls.currentLevel = levelIndex;
    }
  }

  getCurrentQualityLevel(): number {
    return this.hls?.currentLevel || -1;
  }

  enableAutoQuality(): void {
    if (this.hls) {
      this.hls.currentLevel = -1;
    }
  }

  getStats(): any {
    if (!this.hls) return null;

    return {
      currentLevel: this.hls.currentLevel,
      nextLevel: this.hls.nextLevel,
      loadLevel: this.hls.loadLevel,
      nextLoadLevel: this.hls.nextLoadLevel,
      firstLevel: this.hls.firstLevel,
      startLevel: this.hls.startLevel,
      levels: this.hls.levels.length,
      autoLevelEnabled: this.hls.autoLevelEnabled,
      autoLevelCapping: this.hls.autoLevelCapping,
    };
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    this.video.pause();
    this.video.src = '';
    this.video.load();
  }

  static isSupported(): boolean {
    return Hls.isSupported();
  }

  static canPlayNative(): boolean {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  }
}
