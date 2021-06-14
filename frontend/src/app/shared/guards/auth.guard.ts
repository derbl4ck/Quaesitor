import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ClientService } from '../services/client.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private clientService: ClientService,
    private router: Router,
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!await this.clientService.isLoggedIn()) {
      return this.router.parseUrl('/login');
    } else {
      return true;
    }
  }
}
