import { Component, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { SearchService } from '../../../shared/services/search.service';
import { ScraperSocket } from '../../../shared/sockets/scraper.socket';

@Component({
  selector: 't3200-search-edit',
  styleUrls: ['./edit.component.scss'],
  templateUrl: './edit.component.html',
})
export class EditComponent implements AfterViewInit {
  pageDataError$ = new Subject<any>();
  input_errors = null;
  searchId = null;
  basedOnSearchId = null;
  expectedDto = {};
  inputs = {
    name: {
      'schema.org:givenName': 'Vorname',
      'schema.org:additionalName': 'Relevante Zweitnamen?',
      'schema.org:familyName': 'Nachname',
    },
    location: {
      'schema.org:address.postalCode': 'PLZ',
      'schema.org:address.addressLocality': 'Stadt',
    },
  };

  constructor(
    private searchService: SearchService,
    private socket: ScraperSocket,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.params.subscribe(
      params => {
        this.searchId = params['searchId'];
      },
    );

    this.route.queryParams.subscribe(
      params => {
        this.basedOnSearchId = params['basedOn'];
      },
    );
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.basedOnSearchId) {
      this.searchService.getSearch(this.basedOnSearchId).toPromise().then(data => {
        this.expectedDto = data.expectedDto;
      }).catch(error => {
          console.error(error);
          this.pageDataError$.next(error);
      });
    }
  }

  async startSearch() {
    this.input_errors = null;

    if (Object.keys(this.expectedDto).length < 2) {
      this.input_errors = `Bitte geben Sie <b>mindestens zwei</b> Attribute an, um die Suche zu starten.`;
    }

    /* Trim all attributes */
    Object.keys(this.expectedDto).forEach(key => {
      this.expectedDto[key] = (this.expectedDto[key] as String).trim();
    });

    this.socket.emit('updateSearchRequest', this.searchId, this.expectedDto);
    this.router.navigate([`../process`], { relativeTo: this.route });
  }
}
