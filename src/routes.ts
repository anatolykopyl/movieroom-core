import Router from 'koa-router';
import short from 'short-uuid';
import WebTorrent from 'webtorrent';
import { model } from 'mongoose';

import { errorResponse } from './utils';
import processDownloaded from './processDownloaded';
import { Room, roomSchema } from './interfaces';

const RoomModel = model<Room>('Room', roomSchema);
const tCli = new WebTorrent();

const router = new Router({ prefix: '/api' });

router.post('/room', async (ctx) => {
  if (ctx.request.body.magnet) {
    return new Promise(function (resolve) {
      tCli.add(ctx.request.body.magnet, { path: process.env.TEMP_FILES }, async function (torrent) {
        const room = {
          id: (short()).new(),
          magnet: ctx.request.body.magnet,
          createdAt: new Date(),
          movie: torrent.name,
          position: 0,
          syncedAt: new Date(),
        };
        const doc = new RoomModel(room);

        async function setDownloadProg() {
          await RoomModel.updateOne({ id: room.id }, { 
            downloadedProg: torrent.progress,
          });
        }
  
        torrent
          .on('download', async () => {
            setDownloadProg();
          })
          .on('done', async () => {
            setDownloadProg();
            torrent.destroy();
            processDownloaded(torrent, room.id);
          });
  
        await doc.save();
        ctx.body = room;
        resolve(null);
      });
    });
  }
  ({ status: ctx.status, body: ctx.body } = errorResponse('room-01', 'Invalid magnet link'));
});

router.get('/room', async (ctx) => {
  const room = await RoomModel.findOne({ id: ctx.request.query.id }).exec();
  if (room) {
    ctx.body = room;  
  } else {
    ({ status: ctx.status, body: ctx.body } = errorResponse('room-00', 'Room not found'));
  }
});

router.post('/position', async (ctx) => {
  await RoomModel.updateOne({ id: ctx.request.body.id }, { 
    position: Number(ctx.request.body.position),
    syncedAt: new Date(),
  });
  ctx.body = 'success';
});

router.get('/position', async (ctx) => {
  const room = await RoomModel.findOne({ id: ctx.request.query.id }).exec();
  if (room) {
    const elapsedTime = new Date().getTime() - new Date(room.syncedAt).getTime();
    ctx.body = {
      position: room.position + elapsedTime / 1000,
      syncedAt: room.syncedAt,
    };
  } else {
    ({ status: ctx.status, body: ctx.body } = errorResponse('room-00', 'Room not found'));
  }
});

// Лучше спрятать в вебсокет?
router.get('/status', async (ctx) => {
  const room = await RoomModel.findOne({ id: ctx.request.query.id }).exec();

  if (room) {
    ctx.body = {
      downloadedProg: room.downloadedProg,
      reencodedProg: room.reencodedProg,
      downloaded: room.downloaded,
    };
  } else {
    ({ status: ctx.status, body: ctx.body } = errorResponse('status-01', 'No room found'));
  }
});

export default router;