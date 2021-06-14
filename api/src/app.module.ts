import { Module } from '@nestjs/common';
import { PromModule } from '@digikare/nestjs-prom';
import { BullModule } from '@nestjs/bull';
import { ScrapersQueueService } from './services/scrapers-queue.service';
import { MessageGateway } from './events/message.gateway';
import { Neo4jService } from './services/neo4j.service';
import { FrontendGateway } from './events/frontend.gateway';
import { ClientsController } from './controllers/user.controller';
import { SearchController } from './controllers/search.controller';

@Module({
  imports: [
    PromModule.forRoot({}),
    BullModule.forRoot({
      redis: {
        host: 'bullmq-redis',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'scrapers-html',
    }),
    BullModule.registerQueue({
      name: 'scrapers-api',
    }),
  ],
  controllers: [
    ClientsController,
    SearchController,
  ],
  providers: [
    ScrapersQueueService,
    Neo4jService,
    MessageGateway,
    FrontendGateway,
  ],
})
export class AppModule {}
