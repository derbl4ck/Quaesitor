import {Component, ElementRef, HostListener, Input, ViewChild} from '@angular/core';
import {Image} from '../../../../shared/models/image.model';

@Component({
  selector: 't3200-grid-gallery-item',
  templateUrl: './grid-gallery-item.component.html',
  styleUrls: ['./grid-gallery-item.component.scss'],
})
export class GridGalleryItemComponent {

  @Input() image: Image;
  @Input() rowHeight: number = 1;
  @Input() gutterSize: number = 1;
  @ViewChild('img') img: ElementRef;

  public rows: number = 0;

  @HostListener('window:resize')
  calculateRows() {
    this.rows = Math.floor(this.img.nativeElement.offsetHeight / (this.rowHeight + this.gutterSize));
  }
}
