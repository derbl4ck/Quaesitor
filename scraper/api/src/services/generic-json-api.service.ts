import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import * as jp from 'jsonpath';
import { CoreService } from '../shared/core.service';
import { StagingDto } from '../shared/staging.dto';

@Injectable()
export class GenericJsonApiService extends CoreService {
  constructor () {
    super(new Logger(GenericJsonApiService.name));
  }

  async getSearchEntries(
      url: string,
      options: {
        httpOptions?: AxiosRequestConfig,
        arrayRoot: string,
        attributes: AttributeDto,
      },
  ): Promise<StagingDto> {
    const startTime = new Date().getTime();
    const resultObj = {
      scraper_id: 1,
      client_id: 0,
      data: [],
      metadata: {
        count: 0,
        duration: 0,
        source: url,
        query: '',
        scraperName: 'API_Generic',
      },
    };

    const jsonData = await this.getJsonObject(resultObj.metadata.source, options.httpOptions).catch((error) => {
      return Promise.reject(error);
    });

    this.logger.debug(`Searching generic '${url}'...`);

    jp.query(jsonData, options.arrayRoot).forEach(result => {
      resultObj.data.push(this.getAttributes(result, options));
    });

    resultObj.metadata.count = resultObj.data.length;
    resultObj.metadata.duration = new Date().getTime() - startTime;

    return resultObj;
  }

  private getAttributes(searchObj, options): any {
    const searchResultItem = {};

      if (options.attributes) {
        Object.keys(options.attributes).forEach(key => {
          const valueSelector = typeof options.attributes[key] === 'string' ? options.attributes[key] : (options.attributes[key] as any).value;

          // Load Attribute Value
          try {
            const foundValue = jp.value(searchObj, valueSelector);
            if (foundValue !== undefined) {
              searchResultItem[key] = foundValue;
            }
          } catch(e) {}

          const attributeObj = (options.attributes[key] as any);

          // Load Attribute Prefix
          if (attributeObj.prefix !== undefined) {
            searchResultItem[key] = attributeObj.prefix + searchResultItem[key];
          }

          // Load Attribute Suffixes
          if (attributeObj.suffix !== undefined) {
            searchResultItem[key] = searchResultItem[key] + attributeObj.suffix;
          }

          // Load Sub-Attributes and ignore all other attributeOptions
          if (attributeObj.attributes !== undefined) {
            searchResultItem[key] = this.getAttributes(searchObj, attributeObj);
          }

          // only add Attribute if condition(s) are true
          if (attributeObj.onlyAddIf !== undefined) {
            Object.keys(attributeObj.onlyAddIf).forEach(conditionSelector => {
              try {
                if (jp.value(searchObj, conditionSelector) !== attributeObj.onlyAddIf[conditionSelector]) {
                  delete searchResultItem[key];
                }
              } catch(e) {}
            });
          }

          // only add Attribute if condition(s) are false
          if (attributeObj.onlyAddIfNot !== undefined) {
            Object.keys(attributeObj.onlyAddIfNot).forEach(conditionSelector => {
              try {
                if (jp.value(searchObj, conditionSelector) === attributeObj.onlyAddIfNot[conditionSelector]) {
                  delete searchResultItem[key];
                } else if(attributeObj.onlyAddIfNot[conditionSelector] === 'undefined') {
                  if (jp.value(searchObj, conditionSelector) === undefined || jp.value(searchObj, conditionSelector) === 'undefined') {
                    delete searchResultItem[key];
                  }
                }
              } catch(e) {}
            });
          }
        });
      }

      return searchResultItem;
  }
}
