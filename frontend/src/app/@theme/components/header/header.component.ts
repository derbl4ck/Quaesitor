import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbThemeService } from '@nebular/theme';

import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ClientService } from '../../../shared/services/client.service';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  username: string;

  constructor(private themeService: NbThemeService,
              private breakpointService: NbMediaBreakpointsService,
              private clientService: ClientService) {
  }

  ngOnInit() {
    const {xl} = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.username = this.clientService.clientId;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logoutUser() {
    this.clientService.logout();
  }
}
