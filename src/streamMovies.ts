import Koa from 'koa';
import Router from 'koa-router';
require('dotenv').config();

import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import fs from 'fs';

import { errorResponse } from './utils';

const app = new Koa();
const router = new Router({ prefix: '/movie' });

router.get('/', async (ctx) => {
  const range = ctx.req.headers.range;
  if (!range) {
    ({ status: ctx.status, body: ctx.body } = errorResponse('stream-01', 'Requires range header'));
  }

  const videoPath = './files/' + ctx.request.query.filename;
  const videoSize = fs.statSync(videoPath).size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  // HTTP Status 206 for Partial Content
  ctx.res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });

  // Stream the video chunk to the client
  ctx.body = videoStream;
});

app.use(json());
app.use(bodyParser());
app.use(cors({
  credentials: true,
}));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.MOVIES_PORT);
console.log(`📼 Streaming server live on port ${process.env.MOVIES_PORT}`);
