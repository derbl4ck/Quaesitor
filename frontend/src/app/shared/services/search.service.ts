import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class SearchService {
    constructor(
      private http: HttpClient,
    ) {}

    getSearch(searchId: string): Observable<any> {
      return this.http.get<any>(`${environment.httpApi}searchs/${searchId}`);
    }

    async addSearch(clientId: string): Promise<string> {
      const result = await this.http.post<any>(`${environment.httpApi}searchs/${clientId}`, {}).toPromise();
      return result.searchId;
    }

    getSearchResultSet(searchId: string): Observable<any> {
      return this.http.get<any>(`${environment.httpApi}searchs/${searchId}/result-items`);
    }
}
