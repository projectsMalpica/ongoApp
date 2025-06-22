import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-profile-local',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-local.component.html',
  styleUrl: './profile-local.component.css'
})
export class ProfileLocalComponent {
  isEditProfile: boolean = false;
  planningPartners: any[] = [];
  constructor(
    public global: GlobalService,
    public auth: AuthPocketbaseService
  ) { }

  async ngOnInit() {
    await this.loadProfileDataPartner();
    this.global.initPlanningPartnersRealtime();
  }
  async loadProfileDataPartner() {
    try {
      // Obtener datos del usuario
      const userData = await this.global.pb.collection('usuariosPartner').getFirstListItem(
        `userId="${this.auth.currentUser?.id}"`
      );
      
      // Dentro de loadProfileData()
        this.global.profileDataPartner = {
          userId: userData['userId'] || '',
          venueName: userData['venueName'] || '',
          files: userData['files'] || [],
          birthday: userData['birthday'] || '',
          address: userData['address'] || '',
          email: userData['email'] || '',
          description: userData['description'] || '',
          phone: userData['phone'] || '',
          capacity: userData['capacity'] || '',
          openingHours: userData['openingHours'] || '',
          lat: userData['lat'] || '',
          lng: userData['lng'] || '',
          services: userData['services'] || '',
        };
      
      // Cargar fotos si existen
      if (userData['files']) {
        const photosData = JSON.parse(userData['files']);
        this.global.photosPartner = photosData.map((url: string) => ({ url }));
      }
      
      // Inicializar servicios seleccionados
      if (this.global.profileDataPartner.services) {
        this.global.selectedServicesPartner = this.global.profileDataPartner.services.split(',').map((i: string) => i.trim());
      }
      // Al final de loadProfileData()
      this.global.profileDataPartner = { ...this.global.profileDataPartner };
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }
}
