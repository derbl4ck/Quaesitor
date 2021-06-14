import {Component, Input} from '@angular/core';

@Component({
  selector: 't3200-input-row',
  templateUrl: './input-row.component.html',
  styleUrls: ['./input-row.component.scss'],
})
export class InputRowComponent {

  @Input() sectionName: string = '';
  @Input() inputs: {[key: string]: string} = {};
  @Input() expectedDto: {[key: string]: string} = {};

  unsorted() { }
}
