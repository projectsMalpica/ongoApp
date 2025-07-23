import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  message: string = '';
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthPocketbaseService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async onSubmit() {
    const { email } = this.forgotForm.value;
    this.message = '';
    this.error = '';

    try {
      await this.authService.requestPasswordReset(email);
      this.message = 'Se ha enviado un enlace de restablecimiento a tu correo electrónico.';
    } catch (error) {
      this.error = 'No se pudo enviar el enlace. Verifica tu correo electrónico.';
    }
  }
}


