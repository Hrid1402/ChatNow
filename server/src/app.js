import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import {socketHandler} from '../controller/socketHandler.js';
import cors from 'cors';

const port = 3000

const app = express()
app.use(cors());
const server = http.createServer(app);
app.use(express.json());

const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

socketHandler(io);


app.get('/', (req, res) => {
  res.json({status: 'Online'});
})

server.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})