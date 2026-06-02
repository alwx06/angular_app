import { Component, inject } from '@angular/core';
import {ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors, } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/service/auth';
import { FormErrorService } from '@shared/services/form-error';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly formErrorService = inject(FormErrorService);

  public registerForm = this.fb.nonNullable.group(
    {
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', [Validators.required]],
    },
    { validators: this.passwordsMatch },
  );

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('password_confirm')?.value;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  public get mismatch(): boolean {
    return !!(
      this.registerForm.errors?.['passwordsMismatch'] &&
      this.registerForm.get('password_confirm')?.dirty
    );
  }

  public register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const payload = this.registerForm.getRawValue();

    this.authService.register(payload).subscribe(() => {
      this.router.navigate(['/home']);
    });
  }

  public isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  public getFieldError(field: string): string | null {
    return this.formErrorService.getFieldError(this.registerForm.get(field));
  }
}
