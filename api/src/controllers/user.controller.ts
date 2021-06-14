import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Neo4jService } from '../services/neo4j.service';

@Controller('clients')
export class ClientsController {
    constructor(
        private readonly neo4jService: Neo4jService,
    ){ }

    @Get()
    async findAll(): Promise<string[]> {
        return await this.neo4jService.getAllClients();
    }

    @Get(':clientId')
    async isClient(@Param('clientId') clientId): Promise<boolean> {
        return await this.neo4jService.isClient(clientId);
    }

    @Get(':clientId/searchs')
    async getAllSearches(@Param('clientId') clientId): Promise<any[]> {
        return await this.neo4jService.getAllSearchs(clientId);
    }

    @Post()
    async create(@Body() body): Promise<string> {
        await this.neo4jService.addClient(body.clientId);
        return 'success';
    }
}
