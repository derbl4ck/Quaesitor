import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export class Page<T> {
  total: number;      // total number of items
  currentPage: number;
  pageSize: number;
  result: Array<T>;  // items for the current page

  maxPages() {
    return Math.ceil(this.total / this.pageSize);
  }
}

export function queryPaginated<T>(
  http: HttpClient,
  baseUrl: string,
  urlOrFilter?: string | object,
  httpOptions?,
): Observable<Page<T>> {

  let params = new HttpParams();
  let url = baseUrl;

  if (typeof urlOrFilter === 'string') {
    // we were given a page URL, use it
    url = urlOrFilter;
  } else if (typeof urlOrFilter === 'object') {
    // we were given filtering criteria, build the query string
    Object.keys(urlOrFilter).sort().forEach(key => {
      const value = urlOrFilter[key];
      if (value !== null) {
        params = params.set(key, value.toString());
      }
    });
  }

  const headers = httpOptions.headers || new HttpHeaders();

  const options = {params: params, headers: headers};
  return http.get<Page<T>>(url, options);
}
