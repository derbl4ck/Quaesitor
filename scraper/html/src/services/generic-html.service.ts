import { Injectable, Logger } from '@nestjs/common';
import { CoreService } from '../shared/core.service';
import { StagingDto } from '../shared/staging.dto';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class GenericHtmlService extends CoreService {
  constructor () {
    super(new Logger(GenericHtmlService.name));
  }

  async getSearchEntries(
      url: string,
      options: {
        httpOptions?: AxiosRequestConfig,
        httpNotFoundStatusCode: number,
        root: string,
        rootIsArray: boolean,
        attributes: AttributeDto,
      },
  ): Promise<StagingDto> {
    const startTime = new Date().getTime();
    const resultObj = {
      scraper_id: 0,
      client_id: 0,
      data: [],
      metadata: {
        count: 0,
        duration: 0,
        source: url,
        query: '',
        scraperName: 'HTML_Generic'
      },
    };

    const $ = await this.getParsedDocument(resultObj.metadata.source, options.httpOptions).catch((error) => {
      if (error?.response?.responseCode !== options.httpNotFoundStatusCode) {
        return Promise.reject(error);
      }
    });

    this.logger.debug(`Searching generic '${url}'...`);

    if (options.rootIsArray) {
      $(options.root).children().each((i, elem) => {
        resultObj.data.push(this.getAttributes($, elem, options));
      });
    } else {
      resultObj.data.push(this.getAttributes($, $(options.root), options));
    }

    resultObj.metadata.count = resultObj.data.length;
    resultObj.metadata.duration = new Date().getTime() - startTime;

    return resultObj;
  }

  private getAttributes($: cheerio.Root, searchObj, options): any {
    const searchResultItem = {};

      if (options.attributes) {
        Object.keys(options.attributes).forEach(key => {
          const valueSelector = typeof options.attributes[key] === 'string' ? options.attributes[key] : (options.attributes[key] as any).value;
          const attributeObj = (options.attributes[key] as any);

          // Load Attribute Value
          try {
            let foundValue = $(searchObj).find(valueSelector).text().trim();

            if (attributeObj.useHtmlAttribute !== undefined) {
              foundValue = $(searchObj).find(valueSelector).attr(attributeObj.useHtmlAttribute).trim();
            }

            if (foundValue !== undefined) {
              searchResultItem[key] = foundValue;
            }
          } catch(e) {}

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
            searchResultItem[key] = this.getAttributes($, searchObj, attributeObj);
          }

          // only add Attribute if condition(s) are true
          if (attributeObj.onlyAddIf !== undefined) {
            Object.keys(attributeObj.onlyAddIf).forEach(conditionSelector => {
              try {
                if ($(searchObj).find(conditionSelector).text() !== attributeObj.onlyAddIf[conditionSelector]) {
                  delete searchResultItem[key];
                }
              } catch(e) {
                this.logger.error(e);
              }
            });
          }

          // only add Attribute if condition(s) are false
          if (attributeObj.onlyAddIfNot !== undefined) {
            Object.keys(attributeObj.onlyAddIfNot).forEach(conditionSelector => {
              try {
                if ($(searchObj).find(conditionSelector).text() === attributeObj.onlyAddIfNot[conditionSelector]) {
                  delete searchResultItem[key];
                }
              } catch(e) {
                this.logger.error(e);
              }
            });
          }
        });
      }

      return searchResultItem;
  }
}
