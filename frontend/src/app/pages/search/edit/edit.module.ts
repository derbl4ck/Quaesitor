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
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { EditComponent } from './edit.component';
import { FormsModule } from '@angular/forms';
import { InputRowComponent } from './input-row/input-row.component';

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
];

@NgModule({
  imports: [CommonModule, ...NB_MODULES],
  exports: [CommonModule, EditComponent],
  declarations: [EditComponent, InputRowComponent],
})
export class EditModule {}
