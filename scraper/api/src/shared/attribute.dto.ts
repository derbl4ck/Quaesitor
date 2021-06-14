interface AttributeDto {
    [key: string]: {
      prefix?: string,
      value?: string,
      attributes?: AttributeDto,
      suffix?: string,
      onlyAddIf?: {
        [key: string]: any,
      },
      onlyAddIfNot?: {
        [key: string]: any,
      }
    } | string
}