import { Module } from '@nestjs/common';
import { PromModule } from '@digikare/nestjs-prom';
import { BullModule } from '@nestjs/bull';
import { PhonebookService } from './services/phonebook.service';
import { ScrapersQueueConsumer } from './queues/scrapers.queue';
import { GenericHtmlService } from './services/generic-html.service';

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
  ],
  controllers: [],
  providers: [PhonebookService, GenericHtmlService, ScrapersQueueConsumer],
})
export class AppModule {}
