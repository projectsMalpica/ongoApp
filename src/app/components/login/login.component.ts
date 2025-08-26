import { Component, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GlobalService } from '../../services/global.service';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../services/authPocketbase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsComponent } from '../terms/terms.component';
import { PrivacyComponent } from '../privacy/privacy.component';
import { ChatPocketbaseService } from 'src/app/services/chat.service';
import { firstValueFrom } from 'rxjs';
type UserType = 'admin' | 'partner'  | 'client';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TermsComponent, PrivacyComponent],  
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showModal: boolean = false;
  loading = false;
  modalTitle: string = '';
  modalContent: 'terms' | 'privacy' | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthPocketbaseService,
    public global: GlobalService,
    public chatService: ChatPocketbaseService,
    private renderer: Renderer2
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
    //, { updateOn: 'submit' });
    
  }

  openTermsModal(type: 'terms' | 'privacy') {
    console.log('Opening modal with type:', type);
    this.modalContent = type;
    switch (type) {
      case 'terms':
        this.modalTitle = 'Términos y Condiciones';
        break;
      case 'privacy':
        this.modalTitle = 'Política de Privacidad';
        break;
    }
    this.showModal = true;
    console.log('Modal state:', { showModal: this.showModal, modalTitle: this.modalTitle, modalContent: this.modalContent });
  }

  closeModal() {
    this.showModal = false;
    this.modalContent = null;
  }

   onSubmit() {
    if (this.loginForm.invalid) return;
  
    const { email, password } = this.loginForm.value;
  
    this.auth.loginUser(email, password).subscribe({
      next: async () => {
        await this.auth.permision();
        await this.global.loadProfile();
        await this.global.initClientesRealtime();
        await this.global.initPartnersRealtime();
      },
      error: (error) => {
        console.error('Error en el login:', error);
        Swal.fire({
          title: 'Error',
          text: 'Correo o contraseña incorrectos',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
  
  
   /*  async onSubmit() {
      if (this.loginForm.invalid || this.loading) return;
      this.loading = true;
    
      const { email, password, remember } = this.loginForm.value as {
        email: string; password: string; remember: boolean;
      };
    
      try {
        // ⬇️ Convierte el Observable a Promise
        const resp: any = await firstValueFrom(this.auth.loginUser(email, password));
        // resp debe traer { token, record } desde tu servicio
        const token  = resp?.token;
        const record = resp?.record;
    
        const userType = (record?.type || 'client') as UserType;
    
        // ✅ Guarda lo mínimo para que el nombre se muestre en la UI
        this.global.currentUser = {
          id: record?.id,
          email: record?.email ?? '',
          username: record?.username ?? record?.name ?? '',
          type: userType
        };
    
        // (Opcional) Persistencia simple según "remember"
        const store = remember ? localStorage : sessionStorage;
        store.setItem('user', JSON.stringify(this.global.currentUser));
        if (token) store.setItem('pb_token', token);
    
        // Ajuste de layout
        this.renderer.setAttribute(document.body, 'class', 'fixed sidebar-mini sidebar-collapse');
    
        // Enrutamiento por tipo
        switch (userType) {
          case 'admin':
            this.global.setRoute('dashboard/admin');
            break;
          case 'partner':
            this.global.setRoute('profile-local');
            break;
          case 'client':
          default:
            this.global.setRoute('explorer');
            break;
        }
    
      } catch (err: any) {
        console.error('Error en login:', err);
        Swal.fire({
          title: 'Error',
          text: err?.message || 'Correo o contraseña incorrectos',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      } finally {
        this.loading = false;
      }
    } */
  
    goToForgotPassword() {
      this.global.setRoute?.('forgot-password');
    }
}