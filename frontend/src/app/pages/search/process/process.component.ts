import { Component, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import { SearchService } from '../../../shared/services/search.service';
import { ScraperSocket } from '../../../shared/sockets/scraper.socket';
import { Image } from '../../../shared/models/image.model';

@Component({
  selector: 't3200-search-process',
  styleUrls: ['./process.component.scss'],
  templateUrl: './process.component.html',
})
export class ProcessComponent implements AfterViewInit {
  pageDataError$ = new Subject<any>();
  scraperErrors = [];
  searchId = null;
  expectedDto = {};
  metadata = {
    created: 0,
    attributes: 0,
    scrapers: 0,
    resultItems: 0,
  };
  images: Image [] = [];

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
    this.socket.on('getAllImageUrls', (imageUrls) => {
      this.images = [];
      imageUrls.forEach((imageUrl) => {
        this.images.push({
          src: imageUrl,
        });
      });
    });
    this.socket.on('finishedSearch', () => {
      this.router.navigate([`../`], { relativeTo: this.route });
    });
    this.socket.on('drawGraph', (args) => {
      this.metadata.resultItems = args[0];
      this.metadata.scrapers = args[1];
      this.resetGraph();
      for (let index = 0; index < this.metadata.resultItems; index++) {
        this.addNode();
      }
    });
    this.socket.on('scraperError', (scraperError) => {
      this.scraperErrors.push(scraperError);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    // TODO: delay promise execution
    this.searchService.getSearch(this.searchId).toPromise().then(data => {
      this.expectedDto = data.expectedDto;
      this.metadata.created = data.created;
      this.metadata.attributes = Object.keys(this.expectedDto).length;

      if (data.finished === 'true') {
        this.router.navigate([`../`], { relativeTo: this.route });
      }
    }).catch(error => {
        console.error(error);
        this.pageDataError$.next(error);
    });
  }

  links = [];
  nodes = [
    {
      id: '1',
      label: 'Diese Suche',
    },
  ];

  addNode(nodeId = uuidv4()) {
    this.nodes.push({
      id: `${nodeId}`,
      label: 'Diese Suche',
    });
    this.links.push({
      id: `${uuidv4()}`,
      source: '1',
      target: `${nodeId}`,
    });
  }

  resetGraph() {
    this.links = [];
    this.nodes = [
      {
        id: '1',
        label: 'Diese Suche',
      },
    ];
  }
}
