require('dotenv').config();
import Koa from 'koa';
import json from 'koa-json';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { connect } from 'mongoose';

import routes from './routes';

const app = new Koa();

app.use(json());
app.use(bodyParser());
app.use(cors({
  credentials: true,
}));
app.use(routes.routes());
app.use(routes.allowedMethods());

connect(process.env.DB).then(() => {
  app.listen(process.env.PORT);
  console.log(`💡 Core api live on port ${process.env.PORT}`);
});
