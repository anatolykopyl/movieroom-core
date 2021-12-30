import Koa from 'koa';
import Router from 'koa-router';
require('dotenv').config();

import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import { model, connect } from 'mongoose';
import short from 'short-uuid';
import WebTorrent from 'webtorrent';

import { errorResponse } from './utils';
import processDownloaded from './processDownloaded';
import { Room, roomSchema } from './interfaces';

const RoomModel = model<Room>('Room', roomSchema);

const tCli = new WebTorrent();

const app = new Koa();
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
  
        torrent.on('done', function () {
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
    if (room.downloaded) {
      ctx.body = {
        progress: 1,
        downloaded: room.downloaded,
      };
    } else {
      const torrent = tCli.get(room.magnet);
      if (torrent) {
        ctx.body = {
          progress: (torrent as WebTorrent.Torrent).progress,
          downloaded: room.downloaded,
        };
      } else {
        ({ status: ctx.status, body: ctx.body } = errorResponse('status-00', 'No torrent found'));
      }
    }
  } else {
    ({ status: ctx.status, body: ctx.body } = errorResponse('status-01', 'No room found'));
  }
});

app.use(json());
app.use(bodyParser());
app.use(cors({
  credentials: true,
}));
app.use(router.routes());
app.use(router.allowedMethods());

connect(process.env.DB).then(() => {
  app.listen(process.env.PORT);
  console.log(`💡 Core api live on port ${process.env.PORT}`);
});
