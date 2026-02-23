export interface Camera {
  id: string;
  name: string;
  rtspUrl?: string;
  status: 'online' | 'offline' | 'streaming';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCameraRequest {
  name: string;
  rtspUrl?: string;
}

export interface UpdateCameraRequest {
  name?: string;
  rtspUrl?: string;
  status?: 'online' | 'offline' | 'streaming';
}

export interface CameraRepository {
  createCamera(data: CreateCameraRequest): Promise<Camera>;
  deleteCamera(id: string): Promise<void>;
  getCameraById(id: string): Promise<Camera | null>;
  getAllCameras(): Promise<Camera[]>;
  updateCamera(id: string, data: UpdateCameraRequest): Promise<Camera>;
}
