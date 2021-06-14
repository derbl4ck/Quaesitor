export interface StagingDto {
    scraper_id: number;
    client_id: number;
    data: StagingAttributeResultDto[];
    metadata: {
      count: number;
      duration: number;
      source: string;
      query: string;
      scraperName: string;
    };
}

export interface StagingAttributeResultDto {
  [key: string]: any;
}