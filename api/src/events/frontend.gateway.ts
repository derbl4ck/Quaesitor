import {
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
 } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ namespace: '/frontend' })
export class FrontendGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('FrontendGateway');
  
    public afterInit(server: Server): void {
      return this.logger.log('FrontendGateway successfully started');
    }
  
    public handleDisconnect(client: Socket): void {
      return this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    public handleConnection(client: Socket): void {
      return this.logger.log(`Client connected: ${client.id}`);
    }

    private async asyncForEach(array: any[], callback: any): Promise<void> {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}