import { Component, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { SearchService } from '../../../shared/services/search.service';
import { Image } from '../../../shared/models/image.model';

@Component({
  selector: 't3200-search-summary',
  styleUrls: ['./summary.component.scss'],
  templateUrl: './summary.component.html',
})
export class SummaryComponent implements AfterViewInit {
  pageDataError$ = new Subject<any>();
  scraperErrors = [];
  searchId = null;
  expectedDto = {};
  resultSet = {};
  metadata = {
    created: 0,
    attributes: 0,
    scrapers: 0,
    resultItems: 0,
  };
  images: Image [] = [];

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
  ) {
    this.route.params.subscribe(
      params => {
        this.searchId = params['searchId'];
      },
    );
  }

  async ngAfterViewInit(): Promise<void> {
    this.searchService.getSearch(this.searchId).toPromise().then(data => {
      this.expectedDto = data.expectedDto;
      this.metadata.created = data.created;
      this.metadata.attributes = Object.keys(this.expectedDto).length;
    }).catch(error => {
        console.error(error);
        this.pageDataError$.next(error);
    });

    this.searchService.getSearchResultSet(this.searchId).toPromise().then(data => {
      this.resultSet = data;
      if (data['schema.org:image']) {
        data['schema.org:image'].forEach((imageUrl) => {
          this.images.push({
            src: imageUrl,
          });
        });
      }
    }).catch(error => {
        console.error(error);
        this.pageDataError$.next(error);
    });
  }
}
