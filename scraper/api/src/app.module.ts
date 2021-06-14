import { Module } from '@nestjs/common';
import { PromModule } from '@digikare/nestjs-prom';
import { BullModule } from '@nestjs/bull';
import { GenericJsonApiService } from './services/generic-json-api.service';
import { ScrapersQueueConsumer } from './queues/scrapers.queue';

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
      name: 'scrapers-api',
    }),
  ],
  controllers: [],
  providers: [GenericJsonApiService, ScrapersQueueConsumer],
})
export class AppModule {}
