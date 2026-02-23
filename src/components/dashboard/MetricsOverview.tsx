'use client';

import { Camera, CameraStatus } from '@/types';
import { Activity, Camera as CameraIcon, AlertTriangle, Users } from 'lucide-react';

interface MetricsOverviewProps {
  cameras: Camera[];
}

export function MetricsOverview({ cameras }: MetricsOverviewProps) {
  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter(c => c.status === CameraStatus.ONLINE).length;
  const offlineCameras = cameras.filter(c => c.status === CameraStatus.OFFLINE).length;
  const totalViewers = cameras.reduce((sum, camera) => sum + (camera.status === CameraStatus.ONLINE ? 1 : 0), 0);

  const metrics = [
    {
      title: 'Total Cameras',
      value: totalCameras.toString(),
      icon: CameraIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Online',
      value: onlineCameras.toString(),
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Offline',
      value: offlineCameras.toString(),
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Active Streams',
      value: totalViewers.toString(),
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
