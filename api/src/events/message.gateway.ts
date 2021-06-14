import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
 } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ScrapersQueueService } from '../services/scrapers-queue.service';
import { StagingDto, StagingAttributeResultDto } from '../shared/staging.dto';
import { Neo4jService } from '../services/neo4j.service';

@WebSocketGateway({ namespace: '/scrapers' })
export class MessageGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('MessageGateway');

    constructor(
      private readonly scrapersQueueService: ScrapersQueueService,
      private readonly neo4jService: Neo4jService,
    ){ }

    @SubscribeMessage('updateSearchRequest')
    public async updateSearchRequest(socket: Socket, args: any[]): Promise<void> {
      const searchObj = await this.neo4jService.getSearch(args[0]);

      if (searchObj.finished === 'true') {
        this.logger.debug('cant update a already closed search case');
        socket.emit('finishedSearch');
        return;
      }

      /* Init search */
      await this.addExpectedAttributes(searchObj.clientId, args[0], args[1]);

      /* Collect -> clean -> store */
      await this.scrapersQueueService.getPhonebookResults(args[1])
        .then((result) => this.cleanAndStoreSearchResult(socket, searchObj.clientId, args[0], result))
        .catch((err) => this.errorHandler(socket, err, 'HTML', 'phonebook'));

      await this.scrapersQueueService.getFupaSearchResults(args[1])
        .then(async (fupaSearchResult) => {
        const searchResultId = await this.cleanAndStoreSearchResult(socket, searchObj.clientId, args[0], fupaSearchResult);

        await this.asyncForEach((fupaSearchResult as StagingDto).data, async (item, index, array) => {
          if (item['schema.org:url'] !== undefined) {
            await this.scrapersQueueService.getFupaPerson(item['schema.org:url'])
              .then((fupaPersonData) => this.cleanAndStoreSearchResult(socket, searchObj.clientId, args[0], fupaPersonData));
          }
        });

        this.cleanAndStoreSearchResult(socket, searchObj.clientId, args[0], fupaSearchResult, searchResultId);
      }).catch((err) => this.errorHandler(socket, err, 'API', 'genericJsonApi'));

      await this.neo4jService.setSearchFinished(args[0]);
      socket.emit('finishedSearch');
    }
  
    public afterInit(server: Server): void {
      return this.logger.log('MessageGateway successfully started');
    }
  
    public handleDisconnect(client: Socket): void {
      return this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    public handleConnection(client: Socket): void {
      return this.logger.log(`Client connected: ${client.id}`);
    }

    private async cleanAndStoreSearchResult(socket: Socket, clientId: string, searchId: string, rawResults: StagingDto, searchResultId = uuidv4()): Promise<string> {
      const cleanedResults = this.cleanAttributes(rawResults);
      await this.storeSearchResult(clientId, searchId, cleanedResults, searchResultId);

      // TODO: select scraper count, select resultItems count
      socket.emit('drawGraph', 10, 10);
      socket.emit('getAllImageUrls', await this.neo4jService.getAllImageUrls(clientId, searchId));
      return searchResultId;
    }

    private cleanAttributes(rawResults: StagingDto): StagingDto {
      /* For all ResultItems */
      for (let index = 0; index < rawResults.data.length; index++) {
        /* For all Attributes inside the ResultItem */
        for (const key in rawResults.data[index]) {
          const value = rawResults.data[index][key];
  
          if (value === undefined || value === '' || value === '–') {
            delete rawResults.data[index][key];
          } else if (typeof value !== 'object') {
            rawResults.data[index][key] = value.trim();
          }
        }
      }

      return rawResults;
    }

    private async storeSearchResult(clientId: string, searchId: string, cleanedResults: StagingDto, searchResultId: string): Promise<void> {
      await this.neo4jService.deleteNodes(searchResultId);

      /* Foreach ResultItem */
      await this.asyncForEach(cleanedResults.data, async (resultItem: StagingAttributeResultDto) => {
        /* Add ResultItem Node and connect to SearchNode */
        const resultItemId = uuidv4();
        await this.neo4jService.addResultItemNode(clientId, '' + cleanedResults.scraper_id, cleanedResults.metadata.scraperName, cleanedResults.metadata.source, searchResultId, resultItemId).catch((error) => {
          this.logger.error(error);
        });
        await this.neo4jService.addSearch2ResultRelationship(searchId, resultItemId).catch((error) => {
          this.logger.error(error);
        });

        const attributes = Object.keys(resultItem).filter(key => !['source', 'entryType'].includes(key));

        /* Foreach Attribute that is not of type 'source' or 'entryType' */
        await this.asyncForEach(attributes, (async key => {
            const value = resultItem[key];

            // Should we add a complexAttribute or normalAttribute?
            if (typeof value === 'object') {
              await this.neo4jService.addComplexAttributeNode(clientId, key, value).catch((error) => {
                this.logger.error(error);
              });
              await this.neo4jService.addResult2ComplexAttributeRelationship(clientId, '' + cleanedResults.scraper_id, cleanedResults.metadata.scraperName, cleanedResults.metadata.source, key, value, searchResultId, resultItemId).catch((error) => {
                this.logger.error(error);
              });
            } else {
              await this.neo4jService.addAttributeNode(clientId, key, value).catch((error) => {
                this.logger.error(error);
              });
              await this.neo4jService.addResult2AttributeRelationship(clientId, '' + cleanedResults.scraper_id, cleanedResults.metadata.scraperName, cleanedResults.metadata.source, key, value, searchResultId, resultItemId).catch((error) => {
                this.logger.error(error);
              });
            }
        }));
      });
    }

    private async addExpectedAttributes(clientId: string, searchId: string, expectedDto: any) {
      await this.asyncForEach(Object.keys(expectedDto), (async key => {
        await this.neo4jService.addAttributeNode(clientId, key, expectedDto[key], null).catch((error) => {
          this.logger.error(error);
        });
        await this.neo4jService.addSearch2AttributeRelationship(clientId, searchId, key, expectedDto[key]).catch((error) => {
          this.logger.error(error);
        });
      }));

      const nameAttribute = [
          expectedDto['schema.org:givenName'],
          expectedDto['schema.org:additionalName'],
          expectedDto['schema.org:familyName']
      ].filter(x => x !== undefined).join(' ').trim();

      if (nameAttribute.length !== 0) {
        await this.neo4jService.addAttributeNode(clientId, 'schema.org:name', nameAttribute, null).catch((error) => {
          this.logger.error(error);
        });
        await this.neo4jService.addSearch2AttributeRelationship(clientId, searchId, 'schema.org:name', nameAttribute).catch((error) => {
          this.logger.error(error);
        });
      }
    }

    private errorHandler(client: Socket, err, scraperGroup, scraperName) {
      this.logger.error(err);
        client.emit('getScraperErrors', {
          scraperGroup,
          scraperName,
          errorText: err.toString(),
        });
    }

    private async asyncForEach(array: any[], callback: any): Promise<void> {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}