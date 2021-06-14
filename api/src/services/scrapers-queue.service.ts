import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as bull from 'bull';
import { StagingDto } from '../shared/staging.dto';

@Injectable()
export class ScrapersQueueService {
    private readonly logger = new Logger(ScrapersQueueService.name);

    constructor(
      @InjectQueue(`scrapers-api`) private scrapersApiQueue: bull.Queue,
      @InjectQueue(`scrapers-html`) private scrapersHtmlQueue: bull.Queue,
    ) {}

    /**
     * Returns the Results 
     * @param expectedDto The PartialExpectedDto is used to compute searchterms.
     */
    public getPhonebookResults(expectedDto: any): Promise<StagingDto> {
        return this.process(this.scrapersHtmlQueue, 'phonebook', expectedDto);
    }

    /**
     * Returns the Results 
     * @param expectedDto The PartialExpectedDto is used to compute searchterms.
     */
    public async getFupaSearchResults(expectedDto: any): Promise<StagingDto> {
        // Generate Searchterm
        const searchterm = [
            expectedDto['schema.org:givenName'],
            expectedDto['schema.org:additionalName'],
            expectedDto['schema.org:familyName']
        ].filter(x => x !== undefined).join(' ').trim();

        if (searchterm.length === 0) {
            return Promise.reject(new Error('Not recieved all nessecary parameters! (failed to generate searchterm)'));
        }

        return this.process(this.scrapersApiQueue, 'genericJsonApi', {
          client_id: -1,
          url: `https://search.fupa.net/v2/query?type=player%2Creferee&q=${encodeURI(searchterm)}&prefer_region=global`,
          options: {
            arrayRoot: '$.*',
            attributes: {
              'schema.org:name': '$.name',
              'schema.org:birthDate': '$.birthday',
              'schema.org:url': {
                prefix: 'https://fupa.net',
                value: '$.linkUrl',
              },
              'schema.org:homeTeam': {
                attributes: {
                  'schema.org:name': '$.club.name',
                  'schema.org:url': {
                    prefix: 'https://www.fupa.net/club/',
                    value: '$.club.slug',
                  },
                  'schema.org:image': {
                    prefix: 'https://cdn.fupa.net/club/jpeg/200x200/',
                    value: '$.club.image.baseName',
                    onlyAddIf: {
                      '$.club.image.svg': false,
                    },
                  },
                },
                onlyAddIfNot: {
                  '$.club': 'undefined',
                },
              },
              'schema.org:address': {
                attributes: {
                  'schema.org:addressRegion': '$.region.name',
                  'schema.org:addressLocality': '$.district.name',
                },
              },
              'schema.org:image': {
                prefix: 'https://cdn.fupa.net/player/jpeg/256x320/',
                value: '$.image.baseName',
                onlyAddIf: {
                  '$.image.svg': false,
                },
              },
            },
          },
      }).catch((error) => {
        return Promise.reject(error);
      });
    }

    /**
     * Returns the Results 
     * @param expectedDto The PartialExpectedDto is used to compute searchterms.
     */
    public getFupaPerson(profileUrl: string): Promise<StagingDto> {
        return this.process(this.scrapersHtmlQueue, 'genericHtml', {
          client_id: -1,
          url: profileUrl,
          options: {
            httpNotFoundStatusCode: 404,
            root: '#app',
            rootIsArray: false,
            attributes: {
              'schema.org:name': 'div.irvo0a-2.kNTyKQ.sc-1xcbu3-0.dAHroB > div > div > div.irvo0a-5.caxcAu > div > h1',
              'schema.org:birthDate': 'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.fGnOLk > div:nth-child(1) > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-5.sc-1lc77gr-3.kUXbCS.kmrAHm',
              'schema.org:height': {
                value: 'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.fGnOLk > div:nth-child(2) > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-5.sc-1lc77gr-3.kUXbCS.kmrAHm',
                onlyAddIfNot: {
                  'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.fGnOLk > div:nth-child(2) > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-5.sc-1lc77gr-3.kUXbCS.kmrAHm': '–',
                },
              },
              'schema.org:weight': 'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.fGnOLk > div:nth-child(3) > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-5.sc-1lc77gr-3.kUXbCS.kmrAHm',
              'schema.org:nationality': 'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.fGnOLk > div:nth-child(4) > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-5.sc-1lc77gr-3.kUXbCS.kmrAHm',
              'playing_position': 'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.kpWBQo > div > div:nth-child(1) > div > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-5.sc-1lc77gr-3.kUXbCS.kmrAHm',
              'schema.org:homeTeam': {
                attributes: {
                  'schema.org:url': {
                    prefix: 'https://www.fupa.net',
                    useHtmlAttribute: 'href',
                    value: 'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.kpWBQo > div > div:nth-child(1) > a',
                  },
                },
                onlyAddIfNot: {
                  'div.sc-1e04cm7-4.fMjnao > div:nth-child(2) > div > div > div.sc-1mrugnb-0.gAqHVh > div.sc-1lc77gr-4.kpWBQo > div > div:nth-child(1) > div:nth-child(2) > span.sc-bdfBwQ.cvbBOD.sc-1e04cm7-6.sc-1lc77gr-3.zulNt.kmrAHm': '-',
                },
              },
            },
          },
        });
    }

    /**
     * Puts a new Job in the Redis Queue
     */
    private async process(queue: bull.Queue, jobName: string, jobOptions: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const workers = await queue.getWorkers();
            if (workers.length === 0) {
                reject(`${queue.name} - No workers available to process your request! (${await queue.count()} waiting or paused jobs in Queue)`);
            } else {
                const job = await queue.add(jobName, jobOptions);

                job.finished().then((data) => {
                    resolve(data);
                }).catch((err) => {
                    reject(err);
                });
            }
        });
    }

    private async asyncForEach(array: any, callback: any): Promise<void> {
      for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
      }
    }
}
