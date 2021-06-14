import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

export class CoreService {
  protected logger: Logger;

  constructor (logger?: Logger) {
    this.logger = logger ? logger : new Logger(CoreService.name);
  }

  /**
   * Returns an valid parsed JSON Object.
   * @param url HTTP URL of the requested ressource.
   * @param options HTTP request options; uses GET by default.
   */
  protected async getJsonObject(url: string, options: AxiosRequestConfig = {
    method: 'GET',
  }): Promise<any> {
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
      return JSON.parse(JSON.stringify(response.data));
    } catch (error) {
      const err_obj = {
        message: 'failed while parsing httpBody to searchable document',
        error,
      };

      this.logger.error(err_obj);
      throw new HttpException(err_obj, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
