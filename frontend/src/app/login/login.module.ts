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
import { LoginComponent } from './login.component';
import { ThemeModule } from '../@theme/theme.module';
import { FormsModule } from '@angular/forms';

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
  exports: [CommonModule, LoginComponent],
  declarations: [LoginComponent],
})
export class LoginModule {}
