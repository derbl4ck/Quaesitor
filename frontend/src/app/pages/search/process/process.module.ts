import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbCardModule,
  NbInputModule,
  NbFormFieldModule,
  NbStepperModule,
  NbTooltipModule,
  NbSpinnerModule,
  NbListModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ProcessComponent } from './process.component';
import { FormsModule } from '@angular/forms';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { LayoutService } from '../../../@theme/layouts/layout.service';
import { GridGalleryModule } from '../grid-gallery/grid-gallery.module';
import { ThemeModule } from '../../../@theme/theme.module';

const NB_MODULES = [
  FormsModule,
  NbButtonModule,
  NbSelectModule,
  NbIconModule,
  NbEvaIconsModule,
  NbCardModule,
  NbInputModule,
  NbFormFieldModule,
  NbStepperModule,
  NbTooltipModule,
  NbSpinnerModule,
  NbListModule,
];

const COMPONENTS = [
  ProcessComponent,
];

@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    NgxGraphModule,
    GridGalleryModule,
    ...NB_MODULES],
  exports: [
    ...COMPONENTS,
  ],
  providers: [LayoutService],
  declarations: COMPONENTS,
})
export class ProcessModule {}
