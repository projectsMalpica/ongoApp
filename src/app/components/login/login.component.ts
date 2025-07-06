import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GlobalService } from '../../services/global.service';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../services/authPocketbase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TermsComponent } from '../terms/terms.component';
import { PrivacyComponent } from '../privacy/privacy.component';
import { ChatPocketbaseService } from 'src/app/services/chat.service';

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
  modalTitle: string = '';
  modalContent: 'terms' | 'privacy' | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthPocketbaseService,
    public global: GlobalService,
    public chatService: ChatPocketbaseService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
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
        console.log('✅ Login correcto, inicializando chat');
        
        await this.chatService.initialize(this.auth.pb);  // Inicializa PocketBase ya autenticado
        this.auth.permision(); // Luego redirige a la página principal
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
  
}