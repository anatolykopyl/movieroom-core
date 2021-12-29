import { Schema } from 'mongoose';

export interface Room {
  id: string;
  magnet: string;
  createdAt: Date;
  movie?: string;
  downloaded?: boolean;
  downloadedAt?: Date;
  position: number;
}

export const roomSchema = new Schema<Room>({
  id: { type: String, required: true },
  magnet: { type: String, required: true },
  createdAt: { type: Date, required: true },
  movie: { type: String, required: false },
  downloaded: { type: Boolean, required: false },
  downloadedAt: { type: Date, required: false },
  position: { type: Number, required: true },
});
