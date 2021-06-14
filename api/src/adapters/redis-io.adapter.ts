import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisAdapter } from 'socket.io-redis';

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    const redisAdapter = new RedisAdapter('/scrapers', 'localhost:32768');

    server.adapter(redisAdapter);
    return server;
  }
}