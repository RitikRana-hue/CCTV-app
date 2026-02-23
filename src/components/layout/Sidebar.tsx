'use client';

import { Camera, CameraStatus } from '@/types';
import { Video, VideoOff, Circle, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  cameras: Camera[];
  selectedCamera: string | null;
  onSelectCamera: (cameraId: string | null) => void;
}

export function Sidebar({ 
  isOpen, 
  onToggle, 
  cameras, 
  selectedCamera, 
  onSelectCamera 
}: SidebarProps) {
  const getStatusIcon = (status: CameraStatus) => {
    switch (status) {
      case CameraStatus.ONLINE:
        return <Circle className="w-3 h-3 fill-green-500 text-green-500" />;
      case CameraStatus.OFFLINE:
        return <Circle className="w-3 h-3 fill-red-500 text-red-500" />;
      case CameraStatus.CONNECTING:
        return <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500 animate-pulse" />;
      default:
        return <Circle className="w-3 h-3 fill-gray-500 text-gray-500" />;
    }
  };

  const getStatusText = (status: CameraStatus) => {
    switch (status) {
      case CameraStatus.ONLINE:
        return 'Online';
      case CameraStatus.OFFLINE:
        return 'Offline';
      case CameraStatus.CONNECTING:
        return 'Connecting';
      case CameraStatus.ERROR:
        return 'Error';
      case CameraStatus.MAINTENANCE:
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const onlineCount = cameras.filter(c => c.status === CameraStatus.ONLINE).length;
  const offlineCount = cameras.filter(c => c.status === CameraStatus.OFFLINE).length;

  return (
    <aside className={`sidebar transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {isOpen && <h2 className="font-semibold text-foreground">Cameras</h2>}
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-accent transition-colors"
            aria-label="Toggle sidebar"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {isOpen && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Online</span>
              <span className="text-green-500 font-medium">{onlineCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Offline</span>
              <span className="text-red-500 font-medium">{offlineCount}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => onSelectCamera(camera.id)}
              className={`w-full text-left p-3 rounded-md transition-colors mb-1 ${
                selectedCamera === camera.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                {camera.status === CameraStatus.ONLINE ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <VideoOff className="w-4 h-4" />
                )}
                
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{camera.name}</p>
                      {getStatusIcon(camera.status)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {camera.location || 'No location'}
                    </p>
                    {isOpen && (
                      <p className="text-xs text-muted-foreground">
                        {getStatusText(camera.status)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
