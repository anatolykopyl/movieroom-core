import fs from 'fs';
import mv from 'mv';
import { spawn } from 'handbrake-js';
import type short from 'short-uuid';
import type WebTorrent from 'webtorrent';
import { model } from 'mongoose';
import { findInDir } from './utils';
import { Room, roomSchema } from './interfaces';

const RoomModel = model<Room>('Room', roomSchema);

async function completeDownload(torrent: WebTorrent.Torrent, id: short.SUUID, ext: string) {
  await RoomModel.updateOne({ id: id }, { 
    filename: id + '.' + ext,
    downloaded: true,
    downloadedAt: new Date(),
  });

  fs.rmSync(__dirname + '/../' + torrent.path + '/' + torrent.name, { recursive: true });
}

export default function (torrent: WebTorrent.Torrent, id: short.SUUID) {
  const extensionsRegEx = /(\.mp4|\.mkv|\.avi)$/;
  findInDir(torrent.path, extensionsRegEx, async (filename: string) => {
    const originalExtension = filename.split('.').pop();
    const extension = 'mp4';
    const outputLocation = `${process.env.FILES}/${id}.${extension}`;

    if (originalExtension !== 'mp4') {
      spawn({ input: filename, output: outputLocation })
        .on('error', console.error)
        .on('progress', async (progress) => {
          await RoomModel.updateOne({ id: id }, { 
            reencodedProg: progress.percentComplete / 100,
          });
        })
        .on('complete', () => {
          completeDownload(torrent, id, extension);
        });
    } else {
      mv(filename, outputLocation, async () => {
        completeDownload(torrent, id, extension);
      });
    }
  });
}
