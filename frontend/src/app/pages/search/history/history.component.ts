import { Component, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { ClientService } from '../../../shared/services/client.service';
import { SearchService } from '../../../shared/services/search.service';
import { debounceTime, share, catchError } from 'rxjs/operators';

@Component({
  selector: 't3200-search-history',
  styleUrls: ['./history.component.scss'],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements AfterViewInit {
  pageDataObserver: (Observable<any>);
  pageDataError$ = new Subject<any>();

  constructor(
    private clientService: ClientService,
    private searchService: SearchService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.pageDataObserver = this.clientService.getAllSearches(this.clientService.clientId).pipe(
      debounceTime(200),
      share(),
      catchError((error) => {
        console.error(error);
        this.pageDataError$.next(error);
        return of();
      }),
    );
  }

  async newSearch() {
    const searchId = await this.searchService.addSearch(this.clientService.clientId);
    this.router.navigate([`../${searchId}/edit`], { relativeTo: this.route });
  }
}
