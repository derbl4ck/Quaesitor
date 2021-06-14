export interface StagingDto {
    scraper_id: number;
    client_id: number;
    data: any[];
    metadata: {
      count: number;
      duration: number;
      source: string;
      query: string;
    };
}