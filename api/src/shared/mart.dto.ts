export interface MartDto {
    client_id: number;
    data: {
        [key: string]: {
            value: any,
            accuracy: number,
        }[],
    };
    metadata: {
        scraper_count: number;
        duration: number;
        generation: number;
    };
}
