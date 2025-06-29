import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';
import { GlobalService } from 'src/app/services/global.service';
import PocketBase from 'pocketbase';
import * as bootstrap from 'bootstrap';
@Component({
  selector: 'app-profile-local',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile-local.component.html',
  styleUrl: './profile-local.component.css'
})
export class ProfileLocalComponent implements OnInit {
  isEditProfile: boolean = false;
  Profile: boolean = false;
  planningPartners: any[] = [];
  newAvatar: File | null = null;
  avatarPreview: string | ArrayBuffer | null = null;
  photosPartner: any[] = Array(6).fill({});
  selectedServices: string[] = [];
  serviceSearch: string = '';
  servicesPartner = [
    { value: 'Eventos', label: 'Eventos' },
    { value: 'Fiesta', label: 'Fiesta' },
    { value: 'Cenas', label: 'Cenas' },
    { value: 'Tragos', label: 'Tragos' }
  ];
  
  filteredServices: { value: string; label: string }[] = [...this.servicesPartner];
  
  private pb = new PocketBase('https://db.ongomatch.com:8090');

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
          avatar: userData['avatar'] || '',
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
        this.global.profileDataPartner.avatar = this.pb.files.getUrl(userData, userData['avatar']);

      // Cargar fotos si existen
      if (userData['files']) {
        const photosData = JSON.parse(userData['files']);
        this.photosPartner = photosData.map((url: string) => ({ url }));
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

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newAvatar = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
  async uploadAvatarFile(): Promise<any> {
    if (!this.newAvatar) return null;
  
    const formData = new FormData();
    formData.append('file', this.newAvatar);
    formData.append('userId', this.auth.currentUser?.id || '');
    formData.append('type', 'avatar');
  
    // PocketBase SDK permite pasar FormData directamente
    const fileRecord = await this.pb.collection('files').create(formData);
    return fileRecord;
  }
  removePhoto(index: number) {
    this.photosPartner[index] = {};
    // Limpiar el input file
    const fileInput = document.getElementById('imageUpload' + index) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  addPhoto() {
    const emptyIndex = this.photosPartner.findIndex(p => !p.url);
    if (emptyIndex !== -1) {
      const inputId = 'imageUpload' + emptyIndex;
      document.getElementById(inputId)?.click();
    } else {
      console.log('Máximo de fotos alcanzado');
    }
  }
  onPhotoSelectedPartner(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      // Crear URL temporal para previsualización
      const url = URL.createObjectURL(file);
      this.photosPartner[index] = {
        url: url,
        file: file
      };
    }
  }
  async saveProfile() {
    try {
      const formData = new FormData();
      formData.append('venueName', this.global.profileDataPartner.venueName || '');
      formData.append('description', this.global.profileDataPartner.description || '');
      formData.append('email', this.global.profileDataPartner.email || '');
      formData.append('phone', this.global.profileDataPartner.phone || '');
      formData.append('address', this.global.profileDataPartner.address || '');
      formData.append('capacity', String(this.global.profileDataPartner.capacity || 0));
      formData.append('openingHours', this.global.profileDataPartner.openingHours || '');
      formData.append('lat', String(this.global.profileDataPartner.lat || 0));
      formData.append('lng', String(this.global.profileDataPartner.lng || 0));
      formData.append('services', this.selectedServices.join(', '));
  
      // Fotos
      const uploadedPhotos = [];
      for (const photo of this.photosPartner) {
        if (photo.file) {
          const photoForm = new FormData();
          photoForm.append('file', photo.file);
          const record = await this.pb.collection('files').create(photoForm);
          const url = this.pb.files.getUrl(record, record['file']);
          uploadedPhotos.push(url);
        } else if (photo.url) {
          uploadedPhotos.push(photo.url);
        }
      }
      formData.append('files', JSON.stringify(uploadedPhotos));
  
      // Avatar
      if (this.newAvatar) {
        formData.append('avatar', this.newAvatar); // Este campo debe ser tipo `file` en PocketBase
      }
  
      const existingProfile = await this.pb.collection('usuariosPartner').getFirstListItem(
        `userId="${this.auth.currentUser?.id}"`,
        { silent: true }
      ).catch(() => null);
  
      if (existingProfile) {
        await this.pb.collection('usuariosPartner').update(existingProfile.id, formData);
      } else {
        formData.append('userId', this.auth.currentUser?.id || '');
        await this.pb.collection('usuariosPartner').create(formData);
      }
      const updated = await this.pb.collection('usuariosPartner').getOne(existingProfile?.id || '');
      this.global.profileDataPartner.avatar = this.pb.files.getUrl(updated, updated['avatar']);

      console.log('Perfil actualizado correctamente');
      this.avatarPreview = null;
      this.newAvatar = null;
      this.isEditProfile = false;
    } catch (error) {
      console.error('Error guardando perfil:', error);
    }
  }
  
cancelEdit() {
  // Volver a cargar los datos originales
  this.loadProfileDataPartner();
  this.isEditProfile = false;
}
activarEdicion() {
  this.isEditProfile = true;
  console.log('isEditProfile:', this.isEditProfile);
}
selectServices(lang: any) {
  this.global.profileDataPartner.services = lang.name;
  // Cerrar el offcanvas después de seleccionar
  const offcanvas = document.getElementById('offcanvasLang');
  const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas as Element);
}
toggleService(service: { value: string; label: string }) {
if (this.selectedServices.includes(service.value)) {
this.selectedServices = this.selectedServices.filter(s => s !== service.value);
} else {
this.selectedServices.push(service.value);
}
}

addService(newService: string) {
    const value = newService.trim();
    if (!value) return;
    if (this.global.allServices.some(s => s.value.toLowerCase() === value.toLowerCase())) return;
    const newObj = { value, label: value };
    this.global.allServices.push(newObj);
    this.filteredServices = [...this.global.allServices];
    this.toggleService(newObj);
    this.serviceSearch = '';
  }

  filterServices() {
    if (!this.serviceSearch) {
      this.filteredServices = [...this.global.allServices];
      return;
    }
    this.filteredServices = this.global.allServices.filter(service => 
      service.value.toLowerCase().includes(this.serviceSearch.toLowerCase())
    );
  }

  showAddServiceOption(): boolean {
    if (!this.serviceSearch) return false;
    return !this.filteredServices.some(s => s.value && typeof s.value === 'string' && s.value.toLowerCase() === this.serviceSearch.toLowerCase());
  }

  saveServices() {
    // Guarda los servicios seleccionados en el perfil global
    this.global.profileDataPartner.services = this.selectedServices.join(', ');
    this.isEditProfile = false;
  }
}
