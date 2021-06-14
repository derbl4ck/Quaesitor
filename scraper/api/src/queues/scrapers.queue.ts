import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { BaseQueue } from '../shared/base.queue';
import { GenericJsonApiService } from '../services/generic-json-api.service';
import { AxiosRequestConfig } from 'axios';

/**
 * Job config
 * @param url HTTP Ressource that returns a JSON Body.
 * @param options HTTP Request configuration & Data Interpretation definition.
 */
interface JobDto {
    client_id?: number,
    url: string,
    options: {
        httpOptions?: AxiosRequestConfig,
        arrayRoot: string,
        attributes: AttributeDto,
    },
}

@Processor(`scrapers-api`)
export class ScrapersQueueConsumer extends BaseQueue {
    private readonly logger = new Logger(ScrapersQueueConsumer.name);

    constructor(private readonly genericJsonApiService: GenericJsonApiService) {
        super(new Logger(ScrapersQueueConsumer.name));
        this.logger.debug(`init ${ScrapersQueueConsumer.name} worker`);
    }

    /**
     * This job handler method processes only jobs of a certain type (jobs with a certain name).
     * @param job JobConfig
     */
    @Process({
        concurrency: 100,
        name: 'genericJsonApi',
    })
    private async processGenericJsonApi(job: Job<JobDto>): Promise<any> {
        job.progress(10);

        const result = await this.genericJsonApiService.getSearchEntries(job.data.url, job.data.options).catch((error) => {
            throw new Error(error);
        });

        result.scraper_id = 0;
        result.client_id = job.data.client_id;

        job.progress(100);
        return result;
    }
}
