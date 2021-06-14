import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NbActionsModule,
  NbLayoutModule,
  NbMenuModule,
  NbSearchModule,
  NbSidebarModule,
  NbUserModule,
  NbContextMenuModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbCardModule,
  NbInputModule,
  NbFormFieldModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { RouterModule } from '@angular/router';
import { HistoryComponent } from './history.component';
import { FormsModule } from '@angular/forms';
import { ThemeModule } from '../../../@theme/theme.module';

const NB_MODULES = [
  FormsModule,
  ThemeModule,
  NbLayoutModule,
  NbMenuModule,
  NbUserModule,
  NbActionsModule,
  NbSearchModule,
  NbSidebarModule,
  NbContextMenuModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbEvaIconsModule,
  NbCardModule,
  NbInputModule,
  NbFormFieldModule,
];

@NgModule({
  imports: [CommonModule, RouterModule, ...NB_MODULES],
  exports: [CommonModule, HistoryComponent],
  declarations: [HistoryComponent],
})
export class HistoryModule {}
