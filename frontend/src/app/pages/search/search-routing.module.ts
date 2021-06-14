import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SearchComponent } from './search.component';
import { HistoryComponent } from './history/history.component';
import { EditComponent } from './edit/edit.component';
import { EditModule } from './edit/edit.module';
import { ProcessComponent } from './process/process.component';
import { ProcessModule } from './process/process.module';
import { SummaryComponent } from './summary/summary.component';
import { SummaryModule } from './summary/summary.module';

const routes: Routes = [
  {
    path: '',
    component: SearchComponent,
    children: [
      {
        path: 'history',
        component: HistoryComponent,
      },
      {
        path: ':searchId',
        component: SummaryComponent,
      },
      {
        path: ':searchId/edit',
        component: EditComponent,
      },
      {
        path: ':searchId/process',
        component: ProcessComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    EditModule,
    ProcessModule,
    SummaryModule,
  ],
  exports: [
    RouterModule,
  ],
})
export class SearchRoutingModule {
}

