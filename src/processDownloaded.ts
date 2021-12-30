import fs from 'fs';
import mv from 'mv';
import type short from 'short-uuid';
import type WebTorrent from 'webtorrent';
import { model } from 'mongoose';
import { findInDir } from './utils';
import { Room, roomSchema } from './interfaces';

const RoomModel = model<Room>('Room', roomSchema);

export default function (torrent: WebTorrent.Torrent, id: short.SUUID) {
  const extensionsRegEx = /(\.mp4|\.mkv)$/;
  findInDir(torrent.path, extensionsRegEx, (filename: string) => {
    const extension = filename.split('.').pop();
    mv(`./${filename}`, `${process.env.FILES}/${id}.${extension}`, async () => {
      await RoomModel.updateOne({ id: id }, { 
        filename: id + '.' + extension,
        downloaded: true,
        downloadedAt: new Date(),
      });
      
      fs.rmSync(__dirname + '/../' + torrent.path + '/' + torrent.name, { recursive: true });
    });
  });
}
