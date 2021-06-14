import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ClientService {
    constructor(
      private http: HttpClient,
      private localStorageService: LocalStorageService,
    ) {}

    async isLoggedIn(): Promise<boolean> {
      if (this.localStorageService.getItem('clientId') === null) {
        return false;
      } else {
        if (await this.isClient(this.clientId)) {
          return true;
        } else {
          return false;
        }
      }
    }

    get clientId(): string {
      return this.localStorageService.getItem('clientId');
    }

    async setClientId(value: string) {
      this.localStorageService.setItem('clientId', value);
      await this.addClient(value).catch((err) => {});
    }

    logout() {
      this.localStorageService.removeItem('clientId');
    }

    getAllClientIds(): Promise<string[]> {
      return this.http.get<string[]>(`${environment.httpApi}clients`).toPromise();
    }

    isClient(clientId: string): Promise<boolean> {
      return this.http.get<boolean>(`${environment.httpApi}clients/${clientId}`).toPromise();
    }

    addClient(clientId: string): Promise<string> {
      return this.http.post<string>(`${environment.httpApi}clients`, {
        clientId,
      }).toPromise();
    }

    getAllSearches(clientId: string): Observable<any[]> {
      return this.http.get<any[]>(`${environment.httpApi}clients/${clientId}/searchs`);
    }
}
