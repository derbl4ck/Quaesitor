import { Controller, Get, Param, Post } from '@nestjs/common';
import { Neo4jService } from '../services/neo4j.service';

@Controller('searchs')
export class SearchController {
    constructor(
        private readonly neo4jService: Neo4jService,
    ){ }

    @Get(':searchId')
    async getSearch(@Param('searchId') searchId): Promise<any[]> {
        return await this.neo4jService.getSearch(searchId);
    }

    @Get(':searchId/result-items')
    async getSearchResultItems(@Param('searchId') searchId): Promise<any> {
        const expectedDto = (await this.neo4jService.getSearch(searchId)).expectedDto;
        const case1and2ResultItemIDs = await this.neo4jService.getCase1and2ResultItemIDs(searchId);
        const resultSet = {};

        await this.asyncForEach(case1and2ResultItemIDs, (async resultItemNodeId => {
            const resultItemAttributes = await this.neo4jService.getSubAttributes(resultItemNodeId);
            const shouldHaveAttributes = Object.keys(expectedDto);
            const currentAttributes = Object.keys(resultItemAttributes);

            /* Case 3: remove resultItems which have differnt values than given by expectedDto. */
            const onlyCompareThose = currentAttributes.filter(n => shouldHaveAttributes.includes(n));
            const whichHaveSameValues = onlyCompareThose.filter(attributeKey => expectedDto[attributeKey] === resultItemAttributes[attributeKey]);

            if (onlyCompareThose.length !== whichHaveSameValues.length) {
                // ignore resultItem, see rule 3
            } else {
                /* Case 4: If multiple values found: frontend checks if value[].length is bigger than 1. */
                currentAttributes.forEach(attribute => {
                    if (resultSet[attribute] === undefined) {
                        resultSet[attribute] = [];
                    }
                    if (!resultSet[attribute].includes(resultItemAttributes[attribute])) {
                        resultSet[attribute].push(resultItemAttributes[attribute]);
                    }
                });
            }
        }));

        return resultSet;
    }

    @Post(':clientId')
    async addSearch(@Param('clientId') clientId): Promise<any> {
        return {
            'searchId': await this.neo4jService.addSearch(clientId),
        };
    }

    private async asyncForEach(array: any[], callback: any): Promise<void> {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
      }
}
