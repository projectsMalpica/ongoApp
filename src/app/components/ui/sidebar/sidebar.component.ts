import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { AuthPocketbaseService } from '../../../services/authPocketbase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  clientes: any[] = [];
  constructor(
    public global: GlobalService,
    public auth: AuthPocketbaseService
  ) { }

  ngOnInit(): void {
    // Verificar si hay un usuario logueado
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.auth.setUser(currentUser); // Actualizar el usuario en el servicio
    }
    this.global.clientes$.subscribe((clientes : any[]) => {
      this.clientes = clientes;
    });
    
    console.log('Avatar en profileData:', this.global.profileData.avatar);

  }
}
