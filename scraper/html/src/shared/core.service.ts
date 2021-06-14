import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';

export class CoreService {
  protected logger: Logger;

  constructor (logger?: Logger) {
    this.logger = logger ? logger : new Logger(CoreService.name);
  }

  /**
   * Returns an Instance of Cheerio
   * @param url HTTP URL of the requested ressource
   * @param options HTTP request options; uses GET by default.
   */
  protected async getParsedDocument(url: string, options: AxiosRequestConfig = {}): Promise<cheerio.Root> {
    // Currently we want to ignore any https issues
    options.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });

    // execute http request
    const response = await axios.get(url, options).catch((error) => {
      let err_obj = {};

      if (error.response === undefined) {
        err_obj = {
          message: 'Local error while connecting to source.',
          url,
          responseCode: error.message,
        };
      } else {
        err_obj = {
          message: 'Requested ressource responded with unsuccessfull respond code',
          url,
          responseCode: error?.response?.status,
          responseBody: `${error.response.data}`.substring(0, 400),
        };
      }

      this.logger.error(err_obj);
      throw new HttpException(err_obj, HttpStatus.UNPROCESSABLE_ENTITY);
    });

    try {
      return cheerio.load(this.replaceNonValidDOM(response.data))
    } catch (error) {
      const err_obj = {
        message: 'failed while parsing httpBody to searchable document',
        error,
      };

      this.logger.error(err_obj);
      throw new HttpException(err_obj, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  protected replaceNonValidDOM(input: string) {
    let out = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    out = out.replace(/itemscope /gi, '');
    out = out.replace(/<!--(.*?)-->/gm, '');
    out = out.replace(/^\s*[\r\n\t]/gm, '');
    
    return out;
  }
}
