import { Schema } from 'mongoose';

export interface Room {
  id: string;
  magnet?: string;
  createdAt: Date;
  movie?: string;
  filename?: string;
  downloadedProg?: number;
  reencodedProg?: number;
  downloaded?: boolean;
  downloadedAt?: Date;
  position: number;
  syncedAt: Date;
}

export const roomSchema = new Schema<Room>({
  id: { type: String, required: true },
  magnet: { type: String, required: false },
  createdAt: { type: Date, required: true },
  movie: { type: String, required: false },
  filename: { type: String, required: false },
  downloaded: { type: Boolean, required: false },
  downloadedProg: { type: Number, required: false },
  reencodedProg: { type: Number, required: false },
  downloadedAt: { type: Date, required: false },
  position: { type: Number, required: true },
  syncedAt: { type: Date, required: true },
});
