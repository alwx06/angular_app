export interface AuthUser {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    group: string;
    groups: string[];
  }
  
  export interface AuthResponse {
    refresh: string;
    access: string;
    user: AuthUser;
  }

  export interface RegistroUser {
  username: string,
  email: string,
  password: string,
  password_confirm: string,
  first_name: string,
  last_name: string
}