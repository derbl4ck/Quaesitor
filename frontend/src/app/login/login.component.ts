import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '../shared/services/client.service';

@Component({
  selector: 't3200-login',
  styleUrls: ['./login.component.scss'],
  templateUrl: './login.component.html',
})
export class LoginComponent implements AfterViewInit {
  username = '';
  selectedItem = '';
  availableClientIds = [];
  input_errors = '';

  constructor(
    private clientService: ClientService,
    private router: Router,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (await this.clientService.isLoggedIn()) {
      this.router.navigateByUrl('/');
    }

    this.availableClientIds = await this.clientService.getAllClientIds();
    document.getElementById('nb-global-spinner').style.display = 'none';
  }

  async saveUsername() {
    this.input_errors = '';
    const selectedUsername = this.selectedItem !== '' ? this.selectedItem : this.username;

    if (selectedUsername.length < 3) {
      this.input_errors = 'Dein Nutzername sollte mehr als 3 Zeichen lang sein.';
    } else {
      await this.clientService.setClientId(selectedUsername);
      this.router.navigateByUrl('/');
    }
  }
}
