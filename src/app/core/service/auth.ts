import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';

import { AuthResponse, AuthUser, RegistroUser } from '@modules/auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/token/`;
  private registerUrl = `${environment.apiUrl}/api/shoppingcart/auth/register/`;

  private readonly accessToken = signal<string | null>
  (localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token'));

  public readonly user = signal<AuthUser | null>(this.getStoredUser());

  public readonly isLoggedIn = computed(() => !!this.accessToken());
  public readonly isAdmin = computed(() => this.user()?.group === 'admin');

  public login(username: string, password: string, remember: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiUrl, { username, password }).pipe(
      tap((response: AuthResponse) => {
        console.log(response);
        this.setAccessToken(response.access, remember);
        this.setUser(response.user);
      }),
    );
  }

  private setAccessToken(token: string, remember: boolean): void {
    if (remember) {
      localStorage.setItem('access_token', token);
    } else {
      sessionStorage.setItem('access_token', token)
    }
    this.accessToken.set(token);
  }

  public getAccessToken(): string | null {
    return localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token');
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem('user', JSON.stringify(user) as string);
    this.user.set(user);
  }

  public logout(): void {
    this.removeAccessToken();
  }

  private removeAccessToken(): void {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    this.accessToken.set(null);
    localStorage.removeItem('user');
    this.user.set(null);
  }

  private getStoredUser(): AuthUser | null {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;
  }

  public getUser(): AuthUser | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  public register(data: RegistroUser): Observable<any> {
    return this.http.post(this.registerUrl, data);
  }
}
