import { Injectable, Logger } from '@nestjs/common';
import { CoreService } from '../shared/core.service';
import { StagingDto } from '../shared/staging.dto';

@Injectable()
export class PhonebookService extends CoreService {
  constructor () {
    super(new Logger(PhonebookService.name));
  }

  async getSearchEntries(searchterm: string, cityOrZip?: string): Promise<StagingDto> {
    const startTime = new Date().getTime();
    let foundEntries = true;
    const resultObj = {
      scraper_id: 0,
      client_id: 0,
      data: [],
      metadata: {
        count: 0,
        duration: 0,
        source: `https://www.dastelefonbuch.de/Personen/${encodeURI(searchterm)}${cityOrZip ? `/${encodeURI(cityOrZip)}` : ''}`,
        query: '',
        scraperName: 'HTML_Phonebook'
      },
    };

    const $ = await this.getParsedDocument(resultObj.metadata.source, {}).catch((error) => {
      if (error.response.responseCode === 410) {
        // Nothing Found in phonebook!
        foundEntries = false;
      } else {
        return Promise.reject(error);
      }
    });

    if (foundEntries) {
      const currentEntries = $('#entrycontainer > div.standardentries').children('.entry');

      currentEntries.each((i, elem) => {
        const source = $(elem).attr('class').includes('linkedin') ? 'linkedin' : 'dastelefonbuch.de';
        const entryType = $(elem).attr('itemtype');

        if (source === 'linkedin' && entryType !== undefined) {
          resultObj.data.push({
            source,
            entryType,
            'schema.org:name': $(elem).find('span[itemprop="name"]').text().trim(),
            'schema.org:address.addressLocality': $(elem).find('div.vcard > address > a').attr('title').trim(),
          });
        } else if (source === 'dastelefonbuch.de' && entryType !== undefined) {
          const foundAttributes = {
            source,
            entryType,
            'schema.org:name': $(elem).find('span[itemprop="name"]').text().trim(),
            'schema.org:address.streetAddress': $(elem).find('span[itemprop="streetAddress"]').text().trim(),
            'schema.org:address.postalCode': $(elem).find('span[itemprop="postalCode"]').text().trim(),
            'schema.org:address.addressLocality': $(elem).find('span[itemprop="addressLocality"]').text().trim(),
          };

          const phoneType = $(elem).find('div.vcard > div.nr > i').attr('class')?.replace('icon icon_', '');

          if (phoneType === 'phone') {
            foundAttributes['schema.org:telephone'] = $(elem).find('div.vcard > div.nr > span').text()?.replace('…', '').trim();
          }

          if (phoneType === 'fax') {
            foundAttributes['schema.org:faxNumber'] = $(elem).find('div.vcard > div.nr > span').text()?.replace('…', '').trim();
          }

          // remove empty values
          Object.keys(foundAttributes).forEach((key) => {
            if (foundAttributes[key] === '') {
              delete foundAttributes[key];
            }
          });

          resultObj.data.push(foundAttributes);
        }
      });
    }

    resultObj.metadata.count = resultObj.data.length;
    resultObj.metadata.duration = new Date().getTime() - startTime;

    return resultObj;
  }
}
