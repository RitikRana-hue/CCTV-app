import { Camera, CameraRepository, CreateCameraRequest, UpdateCameraRequest } from '@/types/camera';
import { getDatabase } from '@/lib/database';
import { logger } from '@/utils/logger';

export class SqliteCameraRepository implements CameraRepository {
  async createCamera(data: CreateCameraRequest): Promise<Camera> {
    const db = getDatabase();
    const id = `cam-${Date.now()}`;
    const now = new Date().toISOString();

    const camera: Camera = {
      id,
      name: data.name,
      rtspUrl: data.rtspUrl,
      status: 'offline',
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO cameras (id, name, rtspUrl, status, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [camera.id, camera.name, camera.rtspUrl, camera.status, camera.createdAt, camera.updatedAt],
        function (err) {
          if (err) {
            reject(err);
          } else {
            logger.info('Camera created', { cameraId: id, name: data.name });
            resolve(camera);
          }
        }
      );
    });
  }

  async deleteCamera(id: string): Promise<void> {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM cameras WHERE id = ?', [id], function (err) {
        if (err) {
          reject(err);
        } else {
          logger.info('Camera deleted', { cameraId: id });
          resolve();
        }
      });
    });
  }

  async getCameraById(id: string): Promise<Camera | null> {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM cameras WHERE id = ?', [id], function (err, row) {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async getAllCameras(): Promise<Camera[]> {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM cameras ORDER BY createdAt DESC', function (err, rows) {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async updateCamera(id: string, data: UpdateCameraRequest): Promise<Camera> {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.rtspUrl !== undefined) {
      updates.push('rtspUrl = ?');
      values.push(data.rtspUrl);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    const query = `UPDATE cameras SET ${updates.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(query, values, function (err) {
        if (err) {
          reject(err);
        } else {
          // Get updated camera
          this.getCameraById(id).then(updatedCamera => {
            if (!updatedCamera) {
              reject(new Error(`Camera ${id} not found after update`));
            } else {
              logger.info('Camera updated', { cameraId: id, updates: Object.keys(data) });
              resolve(updatedCamera);
            }
          }).catch(reject);
        }
      });
    });
  }
}

// Singleton instance
export const cameraRepository = new SqliteCameraRepository();
