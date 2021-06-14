// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.

export const environment = {
  production: false,
  scraperSocket: 'http://localhost:3000/scrapers',
  frontendSocket: 'http://localhost:3000/frontend',
  httpApi: 'http://localhost:3000/',
};
