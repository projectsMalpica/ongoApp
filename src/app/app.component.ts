import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/ui/header/header.component';
import { SidebarComponent } from './components/ui/sidebar/sidebar.component';
import { MenubarComponent } from './components/ui/menubar/menubar.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { GlobalService } from './services/global.service';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthPocketbaseService } from './services/authPocketbase.service';
import { ProfileLocalComponent } from './components/profile-local/profile-local.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatDetailComponent } from './components/chat-detail/chat-detail.component';
import { DetailprofileComponent } from './components/detailprofile/detailprofile.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { DetailprofilelocalComponent } from './components/detailprofilelocal/detailprofilelocal.component';
import { HomeLocalComponent } from './components/home-local/home-local.component';
import { MapsComponent } from './components/maps/maps.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { WalletHistoryComponent } from './components/wallet-history/wallet-history.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    HeaderComponent, 
    SidebarComponent, 
    MenubarComponent, 
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    ProfileLocalComponent,
    FavoritesComponent,
    ChatComponent,
    ChatDetailComponent,
    DetailprofileComponent,
    ExplorerComponent,
    DetailprofilelocalComponent,
    HomeLocalComponent,
    MapsComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    WalletComponent,
    WalletHistoryComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ongo-app';

  constructor(
    public global: GlobalService,
    public auth: AuthPocketbaseService
  ) {
  }
  ngOnInit(): void {
    // Verificar autenticación al iniciar la aplicación
   /*  if (localStorage.getItem('isLoggedin')) {
      this.auth.permision();
    } */
    this.handleVirtualRouting();

    if (!this.global.getRoute()) {
      // Verificar si hay sesión
      if (localStorage.getItem('isLoggedin')) {
        this.auth.permision(); // ✔️ Redirige según el tipo de usuario
      } else {
        this.global.setRoute('register'); // ✔️ Solo si no detectó otra ruta
      }
    }
  }
  private handleVirtualRouting() {
    const hash = window.location.hash;
  
    if (!hash) return;
  
    const parts = hash.substring(1).split('/');
    const route = parts[0]; // 'reset-password'
    const param = parts.slice(1).join('/'); // Toma el resto por si hay más barras
  
    if (route === 'reset-password' && param) {
      console.log('🔑 Token detectado:', param);
      localStorage.setItem('resetToken', param);
      this.global.setRoute('reset-password');
      this.global.clearUrlHash(); // Limpia el hash de la URL
    }
  }
  
  
  
}
