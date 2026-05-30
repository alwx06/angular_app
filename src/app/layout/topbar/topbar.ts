import { Component,inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/service/auth'
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  public authService = inject(AuthService)
  private router = inject(Router);


  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

}
