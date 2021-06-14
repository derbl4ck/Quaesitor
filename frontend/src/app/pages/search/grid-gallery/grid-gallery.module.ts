import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../../@theme/layouts/layout.service';
import { GridGalleryComponent } from '../grid-gallery/grid-gallery.component';
import { GridGalleryItemComponent } from '../grid-gallery/grid-gallery-item/grid-gallery-item.component';
import { MatGridListModule } from '@angular/material/grid-list';


const COMPONENTS = [
  GridGalleryComponent,
  GridGalleryItemComponent,
];

@NgModule({
  imports: [
    CommonModule,
    MatGridListModule,
  ],
  exports: [
    CommonModule,
    ...COMPONENTS,
  ],
  providers: [LayoutService],
  declarations: COMPONENTS,
})
export class GridGalleryModule {}
