import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as neo4j from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class Neo4jService {
    private readonly logger = new Logger(Neo4jService.name);
    private neo4jDriver: neo4j.Driver;

    constructor() {
      this.neo4jDriver = neo4j.driver(
        'neo4j://neo4j:7687',
        neo4j.auth.basic('neo4j', 'test'),
      );
    }

    /* Creating Nodes */

    public addResultItemNode(clientId: string, scraperId: string, scraperName: string, source: string, sourceResultId: string, resultItemId = uuidv4()): Promise<neo4j.Record[]> {
      const options = `{ title:'${scraperName}', scraperId:'${scraperId}', clientId:'${clientId}', source:'${source}', sourceResultId:'${sourceResultId}', resultItemId:'${resultItemId}' }`;
      this.logger.debug(`added ResultItemNode(${options})`);
      return this.executeStatement(`MERGE (n:Result ${options}) ON CREATE SET n.created = timestamp() RETURN n;`);
    }

    public async addComplexAttributeNode(clientId: string, type: string, value: any): Promise<neo4j.Record[]> {
      const options = `{ title:'${type}', clientId:'${clientId}', type:'${type}', value:'${JSON.stringify(value)}' }`;
      const complexAttributeNode = await this.executeStatement(`MERGE (n:ComplexAttribute ${options}) ON CREATE SET n.created = timestamp() RETURN n;`);

      this.logger.debug(`added AttributeNode(${options})`);

      await this.asyncForEach(Object.keys(value), (async key => {
        /* Basic validation for recursive 'Complex' Attributes */
        if (value[key] !== undefined && value[key] !== '') {
          /* Should we add a complexAttribute or normalAttribute? */
          if (typeof value[key] === 'object') {
            await this.addComplexAttributeNode(clientId, key, value[key]);
            await this.addComplex2ComplexRelationship(clientId, { type, value }, { type: key, value: value[key] });
          } else {
            await this.addAttributeNode(clientId, key, value[key]);
            await this.addComplex2AttributeRelationship(clientId, { type, value }, { type: key, value: value[key] });
          }
        }
      }));
      
      return complexAttributeNode;
    }

    public addAttributeNode(clientId: string, type: string, value: string, cleanedValue?: string): Promise<neo4j.Record[]> {
      const options = `{ title:'${value}', clientId:'${clientId}', type:'${type}'${cleanedValue ? `, cleanedValue:'${cleanedValue}'` : ''} }`;
      this.logger.debug(`added AttributeNode(${options})`);
      return this.executeStatement(`MERGE (n:Attribute ${options}) ON CREATE SET n.created = timestamp() RETURN n;`);
    }

    /* Relationships */

    public addResult2AttributeRelationship(clientId: string, scraperId: string, scraperName:string, source: string, attributeType: string, attributeValue: string, sourceResultId: string, resultItemId: string): Promise<neo4j.Record[]> {
      this.logger.debug(`added Relationship(${scraperName}[${scraperId}])->('${attributeType}': '${attributeValue}')`);
      
      return this.executeStatement(`MATCH
      (s:Result { title:'${scraperName}', scraperId:'${scraperId}', clientId:'${clientId}', source:'${source}', sourceResultId:'${sourceResultId}', resultItemId:'${resultItemId}' }),
      (a:Attribute { title:'${attributeValue}', clientId:'${clientId}', type:'${attributeType}' })
      MERGE (s)-[r:HAS_PROPERTY]->(a)
      RETURN s;`);
    }

    public addResult2ComplexAttributeRelationship(clientId: string, scraperId: string, scraperName:string, source: string, attributeType: string, attributeValue: string, sourceResultId: string, resultItemId: string): Promise<neo4j.Record[]> {
      this.logger.debug(`added Relationship(${scraperName}[${scraperId}])->('${attributeType}': '${attributeValue}')`);
      
      return this.executeStatement(`MATCH
      (s:Result { title:'${scraperName}', scraperId:'${scraperId}', clientId:'${clientId}', source:'${source}', sourceResultId:'${sourceResultId}', resultItemId:'${resultItemId}' }),
      (a:ComplexAttribute { title:'${attributeType}', clientId:'${clientId}', type:'${attributeType}', value:'${JSON.stringify(attributeValue)}' })
      MERGE (s)-[r:HAS_PROPERTY]->(a)
      RETURN s;`);
    }

    public addComplex2AttributeRelationship(clientId: string, complexAttribute: { type: string, value: string }, normalAttribute: { type: string, value: string }): Promise<neo4j.Record[]> {
      this.logger.debug(`added Relationship(${complexAttribute.type}])->('${normalAttribute.value}': '${normalAttribute.type}')`);

      return this.executeStatement(`MATCH
      (s:ComplexAttribute { title:'${complexAttribute.type}', clientId:'${clientId}', type:'${complexAttribute.type}', value:'${JSON.stringify(complexAttribute.value)}' }),
      (a:Attribute { title:'${normalAttribute.value}', clientId:'${clientId}', type:'${normalAttribute.type}' })
      MERGE (s)-[r:HAS_PROPERTY]->(a)
      RETURN s;`);
    }

    public addComplex2ComplexRelationship(clientId: string, complexAttribute1: { type: string, value: string }, complexAttribute2: { type: string, value: string }): Promise<neo4j.Record[]> {
      this.logger.debug(`added ComplexRelationship(${complexAttribute1.type}])->('${complexAttribute2.type}')`);

      return this.executeStatement(`MATCH
      (s:ComplexAttribute { title:'${complexAttribute1.type}', clientId:'${clientId}', type:'${complexAttribute1.type}', value:'${JSON.stringify(complexAttribute1.value)}' }),
      (a:ComplexAttribute { title:'${complexAttribute2.type}', clientId:'${clientId}', type:'${complexAttribute2.type}', value:'${JSON.stringify(complexAttribute2.value)}' })
      MERGE (s)-[r:HAS_PROPERTY]->(a)
      RETURN s;`);
    }

    /* Removing Nodes */

    public deleteNodes(sourceResultId: string): Promise<neo4j.Record[]> {
      this.logger.debug(`deleted Node (& Relationship) (${sourceResultId})`);
      return this.executeStatement(`MATCH (n { sourceResultId:'${sourceResultId}' }) DETACH DELETE n;`);
    }

    /* Searching */

    public async getAllImageUrls(clientId: string, searchId: string): Promise<string[]> {
      this.logger.debug(`getAllImageUrls (${clientId})`);
      const result = await this.executeStatement(`MATCH (s:Search { searchId:'${searchId}' })-[:HAS]->(a: Result)-[:HAS_PROPERTY]->(n:Attribute { type: 'schema.org:image', clientId:'${clientId}' }) RETURN n.title as url LIMIT 500;`);
      return result.map(record => record.get('url'));
    }

    /* ResultItemIDs matching rule 1 & 2 */
    public async getCase1and2ResultItemIDs(searchId: string): Promise<number[]> {
      this.logger.debug(`getCase1and2ResultItemIDs (${searchId})`);
      const result = await this.executeStatement(`MATCH (s:Search { searchId:'${searchId}' })-[:WANTS]->(a:Attribute)
      MATCH (s)-[:HAS]->(rule1:Result)-[:HAS_PROPERTY]->(a)
      with collect(rule1) as rule1List
      MATCH (s:Search { searchId:'${searchId}' })-[:WANTS]->(a:Attribute)
      MATCH (s)-[:HAS]->(rule1:Result)-[:HAS_PROPERTY]->(a)
      MATCH (rule1)-[:HAS_PROPERTY]->(b:Attribute)
      MATCH (s)-[:HAS]->(rule2:Result)
      WHERE NOT (rule2)-[:HAS_PROPERTY]->(a)
      MATCH (rule2)-[:HAS_PROPERTY]->(b)
      WITH rule1List + collect(rule2) as rule12
      UNWIND rule12 as resultNodes
      RETURN distinct ID(resultNodes);`);
      return result.map(record => record.get('ID(resultNodes)').toNumber());
    }

    public async getResultItemAttributes(resultItemId: string): Promise<Record<string, unknown>> {
      this.logger.debug(`getResultItemAttributes (${resultItemId})`);
      const result = await this.executeStatement(`MATCH (r:Result { resultItemId:'${resultItemId}' }) RETURN r;`);
      const resultNodeId = result.pop().get('r').identity.toNumber();

      return this.getSubAttributes(resultNodeId);
    }

    public async getSubAttributes(nodeId: string): Promise<Record<string, unknown>> {
      this.logger.debug(`getSubAttributes (${nodeId})`);
      const result = await this.executeStatement(`MATCH (n)
      WHERE id(n) = ${nodeId}
      OPTIONAL MATCH (n)-[:HAS_PROPERTY]->(attribute:Attribute)
      OPTIONAL MATCH (n)-[:HAS_PROPERTY]->(complex:ComplexAttribute)
      RETURN attribute, complex;`);

      const out = {};

      await this.asyncForEach(result, (async record => {    
        const attribute = record.get('attribute').properties;
        const complex = record.get('complex');

        out[attribute.type] = attribute.title;

        if (complex && out[complex.properties.type] === undefined) {
          out[complex.properties.type] = await this.getSubAttributes(complex.identity.toNumber());
        }
      }));

      return out;
    }

    /* Search overall */
    public async getSearch(searchId): Promise<any> {
      this.logger.debug(`get Search(searchId:'${searchId}')`);
      const result = await this.executeStatement(`MATCH (c:Client)-[:STARTED]->(s:Search { searchId:'${searchId}' })
      OPTIONAL MATCH (s)-[:WANTS]->(a:Attribute)
      RETURN c.clientId, s.searchId, s.created, s.finished, a as attributes LIMIT 100;`);
      const expectedDto = {};

      result.forEach(attribute => {
        if (attribute.get('attributes') !== null) {
          const properties = attribute.get('attributes').properties;
          expectedDto[properties.type] = properties.title;
        }
      });

      if (result.length === 0) {
        throw new HttpException('No node found related to given searchId.', HttpStatus.NOT_FOUND);
      }

      return {
        searchId,
        clientId: result[0].get('c.clientId'),
        finished: result[0].get('s.finished'),
        created: result[0].get('s.created').toNumber(),
        expectedDto,
      };
    }

    public async addSearch(clientId: string, searchId = uuidv4()): Promise<string> {
      this.logger.debug(`added Search(clientId:'${clientId}', searchId:'${searchId}')`);
      const result = await this.executeStatement(`MATCH (s:Client { clientId:'${clientId}' }) MERGE (s)-[:STARTED]->(n:Search { searchId:'${searchId}', finished: 'false' }) ON CREATE SET n.created = timestamp() RETURN n.searchId;`);
      return result.pop().get('n.searchId');
    }

    public addSearch2AttributeRelationship(clientId: string, searchId: string, attributeType: string, attributeValue: string): Promise<neo4j.Record[]> {
      this.logger.debug(`added Relationship(${searchId})->('${attributeType}': '${attributeValue}')`);
      
      return this.executeStatement(`MATCH
      (s:Search { searchId:'${searchId}' }),
      (a:Attribute { title:'${attributeValue}', clientId:'${clientId}', type:'${attributeType}' })
      MERGE (s)-[r:WANTS]->(a)
      RETURN s;`);
    }

    public async getAllSearchs(clientId: string): Promise<any[]> {
      this.logger.debug(`getAllSearchs (${clientId})`);
      const result = await this.executeStatement(`MATCH (s:Client { clientId:'${clientId}' })-[:STARTED]->(n:Search)
      OPTIONAL MATCH (n)-[:HAS]->(r:Result)
      OPTIONAL MATCH (n)-[:WANTS]->(a:Attribute) 
      OPTIONAL MATCH (n)-[:WANTS]->(b:Attribute { type:'schema.org:givenName' })
      OPTIONAL MATCH (n)-[:WANTS]->(c:Attribute { type:'schema.org:familyName' })
      RETURN n.searchId, n.created, count(DISTINCT r) as hits, count(DISTINCT a) as attributes, b.title as givenName, c.title as familyName LIMIT 20;`);

      return result.map(record => {
        return {
          'searchId': record.get('n.searchId'),
          'created': record.get('n.created').toNumber(),
          'schema.org:givenName': record.get('givenName'),
          'schema.org:familyName': record.get('familyName'),
          'expected': record.get('attributes').toNumber(),
          'hits': record.get('hits').toNumber(),
        }
      });
    }

    public addSearch2ResultRelationship(searchId: string, resultItemId: string): Promise<neo4j.Record[]> {
      this.logger.debug(`added Relationship(${searchId})->(resultItemId:'${resultItemId}')`);

      return this.executeStatement(`MATCH
      (s:Search { searchId:'${searchId}' }),
      (r:Result { resultItemId:'${resultItemId}' })
      MERGE (s)-[:HAS]->(r)
      RETURN r;`);
    }

    public setSearchFinished(searchId: string): Promise<neo4j.Record[]> {
      this.logger.debug(`search finished (${searchId})`);
      return this.executeStatement(`MATCH (s:Search { searchId:'${searchId}' }) SET s.finished = 'true' RETURN s;`);
    }

    /* Client */
    public addClient(clientId: string): Promise<neo4j.Record[]> {
      const options = `{ clientId:'${clientId}' }`;
      this.logger.debug(`added Client(${options})`);
      return this.executeStatement(`MERGE (n:Client ${options}) ON CREATE SET n.created = timestamp() RETURN n;`);
    }

    public async isClient(clientId: string): Promise<boolean> {
      const options = `{ clientId:'${clientId}' }`;
      this.logger.debug(`isClient (${options})`);
      const result = await this.executeStatement(`MATCH (n:Client ${options}) RETURN n.clientId as clientId LIMIT 1;`);
      return result.length != 0;
    }

    public async getAllClients(): Promise<string[]> {
      this.logger.debug(`getAllClients ()`);
      const result = await this.executeStatement(`MATCH (n:Client) RETURN n.clientId as clientId LIMIT 20;`);
      return result.map(record => record.get('clientId'));
    }

    public async createClientIndex(): Promise<any> {
      this.logger.debug(`createClientIndex()`);
      return await this.executeStatement(`CREATE INDEX clientId_index IF NOT EXISTS FOR (n:Client) ON (n.clientId);`);
    }

    /**
     * Executes a cypherStatement.
     */
    private async executeStatement(cypherStatement: string, cypherStatementParams?: { [key: string]: any }): Promise<neo4j.Record[]> {
        return new Promise(async (resolve, reject) => {
            const session = this.neo4jDriver.session();

            session.run(cypherStatement, cypherStatementParams)
            .then(result => {
              resolve(result.records);
            })
            .catch(error => {
              this.logger.error({
                error,
                cypherStatement
              });
              reject(error);
            })
            .then(() => session.close());
        });
    }

    private async asyncForEach(array: any[], callback: any): Promise<void> {
      for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
      }
    }
}
