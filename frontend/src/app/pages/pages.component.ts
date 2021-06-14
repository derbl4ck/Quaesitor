import { Component } from '@angular/core';

@Component({
  selector: 'ngx-pages',
  styleUrls: [
    'pages.component.scss',
    '../@theme/layouts/one-column/one-column.layout.scss',
  ],
  template: `
  <nb-layout windowMode>
      <nb-layout-header fixed>
        <ngx-header></ngx-header>
      </nb-layout-header>
      <nb-layout-column>
      <router-outlet></router-outlet>
      </nb-layout-column>
      <nb-layout-footer fixed>
        <ngx-footer></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
  `,
})
export class PagesComponent {}
