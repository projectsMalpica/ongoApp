import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';
import { GlobalService } from 'src/app/services/global.service';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string = '';
  message: string = '';
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthPocketbaseService,
    public global: GlobalService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  async onSubmit() {
    const { password, passwordConfirm } = this.resetForm.value;
    const token = localStorage.getItem('resetToken') || '';

    if (!token) {
      this.error = 'Token no encontrado. Por favor, vuelve a solicitar el enlace.';
      return;
    }

    if (password !== passwordConfirm) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    try {
      await this.authService.confirmPasswordReset(token, password, passwordConfirm);
      this.message = '¡Contraseña actualizada correctamente!';
      
      // Limpia el token y redirige a login
      localStorage.removeItem('resetToken');
      setTimeout(() => {
        this.global.setRoute('login');
      }, 1500);
    } catch (error) {
      this.error = 'Error al actualizar la contraseña. Por favor, verifica el enlace o inténtalo más tarde.';
      console.error(error);
    }
  }

}
