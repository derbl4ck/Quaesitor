import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { BaseQueue } from '../shared/base.queue';
import { PhonebookService } from '../services/phonebook.service';
import { GenericHtmlService } from '../services/generic-html.service';
import { AxiosRequestConfig } from 'axios';

/**
 * The job receives the full expected value object as a parameter.
 * The DataObject (dto) only describes the relevant partial attributes at this point.
 */
interface PartialExpectedDto {
    client_id?: number,
    'schema.org:givenName'?: string,                 // first name
    'schema.org:additionalName'?: string,            // middle name
    'schema.org:familyName'?: string,                // last name
    'schema.org:address.addressLocality'?: string,   // city
    'schema.org:address.postalCode'?: string,
}

interface JobDto {
    client_id?: number,
    url: string,
    options: {
        httpOptions?: AxiosRequestConfig,
        httpNotFoundStatusCode: number,
        root: string,
        rootIsArray: boolean,
        attributes: AttributeDto,
    },
}

@Processor(`scrapers-html`)
export class ScrapersQueueConsumer extends BaseQueue {
    private readonly logger = new Logger(ScrapersQueueConsumer.name);

    constructor(
        private readonly phonebookService: PhonebookService,
        private readonly genericHtmlService: GenericHtmlService,
    ) {
        super(new Logger(ScrapersQueueConsumer.name));
        this.logger.debug(`init ${ScrapersQueueConsumer.name} worker`);
    }
    
    /**
     * This job handler method processes only jobs of a certain type (jobs with a certain name).
     * @param job JobConfig
     */
    @Process({
        concurrency: 100,
        name: 'phonebook',
    })
    private async processPhonebook(job: Job<PartialExpectedDto>): Promise<any> {
        job.progress(5);

        // Generate Searchterm
        const searchterm = [
            job.data['schema.org:givenName'],
            job.data['schema.org:additionalName'],
            job.data['schema.org:familyName']
        ].filter(x => x !== undefined).join(' ').trim();

        if (searchterm.length === 0) {
            throw new Error('Not recieved all nessecary parameters! (failed to generate searchterm)');
        }

        this.logger.debug(`Searching '${searchterm}'...`);
        job.progress(15);

        // Check if location is known
        let location = undefined;

        if (job.data['schema.org:address.postalCode']?.length > 0) {
            location = job.data['schema.org:address.postalCode'];
        } else if (job.data['schema.org:address.addressLocality']?.length > 0) {
            location = job.data['schema.org:address.addressLocality'];
        }

        const result = await this.phonebookService.getSearchEntries(searchterm, location).catch((error) => {
            throw new Error(error);
        });

        result.metadata.query = searchterm;
        result.scraper_id = 0;
        result.client_id = job.data.client_id;

        job.progress(100);
        return result;
    }

    /**
     * This job handler method processes only jobs of a certain type (jobs with a certain name).
     * @param job JobConfig
     */
    @Process({
        concurrency: 100,
        name: 'genericHtml',
    })
    private async processGenericHtml(job: Job<JobDto>): Promise<any> {
        job.progress(10);

        const result = await this.genericHtmlService.getSearchEntries(job.data.url, job.data.options).catch((error) => {
            throw new Error(error);
        });

        result.scraper_id = 0;
        result.client_id = job.data.client_id;

        job.progress(100);
        return result;
    }
}
