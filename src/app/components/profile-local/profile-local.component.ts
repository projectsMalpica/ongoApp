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
export class ProfileLocalComponent implements OnInit, AfterViewInit {
  isEditingPromo: boolean = false;
  editingPromoId: string | null = null;
showSuccessToast = false;
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

newPromo = {
name: '',
description: '',
date: '',
files:[],
userId: '',
};
showPromos = false;

filteredServices: { value: string; label: string }[] = [...this.servicesPartner];
promoImageFile: File | null = null;
successPromoToast = false
private pb = new PocketBase('https://db.ongomatch.com:8090');
promosByPartner: any[] = [];
constructor(
public global: GlobalService,
public auth: AuthPocketbaseService
) {
this.loadPromotionsForPartner();
}

async ngOnInit() {
  this.fetchPartnerData();

  await this.loadProfileDataPartner();
  this.global.initPlanningPartnersRealtime();
}

ngAfterViewInit() {
  // Limpia backdrop y clase modal-open al cerrar cualquier modal relevante
  ['promoModal', 'promoListModal', 'promoOptionsModal'].forEach(id => {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
      });
    }
  });
}
async fetchPartnerData(): Promise<void> {
  try {
    const userId = this.auth.getUserId();
    const partnerRecord = await this.auth.findPartnerByUserId(userId);

    if (partnerRecord) {
      this.global.profileDataPartner = {
        name: partnerRecord.name || '',
        email: partnerRecord.email || '',
        phone: partnerRecord.phone || '',
      };
    }
  } catch (error) {
  }
}

async loadProfileDataPartner() {
  const user = this.auth.getCurrentUser();
  console.log('Cargando perfil de usuario:', user);

  if (!user?.id) {
    console.error('No hay usuario autenticado');
    return;
  }

  try {
    const userData = await this.pb.collection('usuariosPartner').getFirstListItem(`userId="${user.id}"`);

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
      this.global.profileDataPartner = this.global.profileDataPartner;

      } catch (error) {
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
this.showSuccessToast = true;
setTimeout(() => {
this.showSuccessToast = false;
}, 3000); // Desaparece después de 3 segundos

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

async savePromotion() {
  try {
    // Si estamos editando, actualiza la promo existente
    if (this.isEditingPromo && this.editingPromoId) {
      let imageUrl = '';
      if (this.promoImageFile) {
        const fileForm = new FormData();
        fileForm.append('file', this.promoImageFile);
        fileForm.append('userId', this.auth.currentUser?.id || '');
        fileForm.append('type', 'promo');
        const fileRecord = await this.pb.collection('files').create(fileForm);
        imageUrl = this.pb.files.getUrl(fileRecord, fileRecord['file']);
      }
      const promoForm: any = {
        name: this.newPromo.name,
        description: `${this.newPromo.description}\nFecha: ${this.newPromo.date}`,
        userId: this.auth.currentUser?.id || '',
      };
      if (imageUrl) {
        promoForm.files = [imageUrl];
      }
      await this.pb.collection('promos').update(this.editingPromoId, promoForm);
      this.loadPromotionsForPartner();
      this.isEditingPromo = false;
      this.editingPromoId = null;
      this.newPromo = { name: '', description: '', date: '', files: [], userId: '' };
      this.promoImageFile = null;
      // Cierra modal y muestra toast igual que antes
      const modalEl = document.getElementById('promoModal');
      if (modalEl) {
        const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl) || (window as any).bootstrap?.Modal?.getInstance(modalEl);
        if (modalInstance) {
          modalInstance.hide();
        }
      }
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('modal-open');
      this.showSuccessToast = false;
      setTimeout(() => {
        this.successPromoToast = true;
        setTimeout(() => this.successPromoToast = false, 3000);
      }, 100);
      return;
    }
    // Si no, crear promo nueva como antes

    let imageUrl = '';
    // 1. Subir primero la imagen si existe
    if (this.promoImageFile) {
      const fileForm = new FormData();
      fileForm.append('file', this.promoImageFile);
      fileForm.append('userId', this.auth.currentUser?.id || '');
      fileForm.append('type', 'promo');
      // Subir archivo a la colección de archivos
      const fileRecord = await this.pb.collection('files').create(fileForm);
      // Obtener la URL del archivo subido
      imageUrl = this.pb.files.getUrl(fileRecord, fileRecord[   'file']);
    }

    // 2. Guardar la promoción con el enlace de la imagen
    const promoForm = new FormData();
    promoForm.append('name', this.newPromo.name);
    promoForm.append('description', `${this.newPromo.description}\nFecha: ${this.newPromo.date}`);
    promoForm.append('userId', this.auth.currentUser?.id || '');
    if (imageUrl) {
      // Guardar el enlace como array de string (JSON)
      promoForm.append('files', JSON.stringify([imageUrl]));
    }

    const result = await this.pb.collection('promos').create(promoForm);
    console.log('Promo guardada con imagen:', result);

    // Reset
    this.newPromo = { name: '', description: '', date: '', files: [], userId: '' };
    this.promoImageFile = null;

    // Cerrar modal y limpiar backdrop
    const modalEl = document.getElementById('promoModal');
    if (modalEl) {
      const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl) || (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    // Eliminar backdrop manualmente si quedó
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    document.body.classList.remove('modal-open');

    // Mostrar mensaje distinto
    this.showSuccessToast = false;
    this.loadPromotionsForPartner();
    setTimeout(() => {
      this.successPromoToast = true;
      setTimeout(() => this.successPromoToast = false, 3000);
    }, 100);
  } catch (error) {
    console.error('Error guardando la promoción:', error);
  }
}


onPromoImageSelected(event: any) {
const file = event.target.files[0];
if (file) {
this.promoImageFile = file;
}
}
async loadPromotionsForPartner() {
    try {
      const userId = this.auth.currentUser?.id;
      if (!userId) return;
  
      const records = await this.pb.collection('promos').getFullList({
        filter: `userId="${userId}"`,
        sort: '-created'
      });
  
      this.global.promosByPartner = records.map((promo: any) => ({
        id: promo.id, 
        name: promo.name,
        description: promo.description,
        files: promo.files, 
        userId: promo.userId

      }));
    } catch (error) {
      console.error('Error cargando promociones:', error);
    }
  }
  cancelPromo() {
  this.newPromo = {
    name: '',
    description: '',
    date: '',
    files: [],
    userId: '',
  };
  this.promoImageFile = null;
  this.isEditingPromo = false;
  this.editingPromoId = null;

  // Cerrar el modal si está abierto y limpiar el backdrop
  const modalEl = document.getElementById('promoModal');
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl) || (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    }
  }
  // Eliminar backdrop manualmente si quedó
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
  document.body.classList.remove('modal-open');
}
async deletePromo(promo: any) {
  try {
    await this.pb.collection('promos').delete(promo.id);
    this.loadPromotionsForPartner();
    this.successPromoToast = false;
    setTimeout(() => {
      this.successPromoToast = true;
      setTimeout(() => this.successPromoToast = false, 3000);
    }, 100);

    // Cerrar el modal de la lista de promociones si está abierto
    const promoListModalEl = document.getElementById('promoListModal');
    if (promoListModalEl) {
      const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(promoListModalEl) || (window as any).bootstrap?.Modal?.getInstance(promoListModalEl);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    // Eliminar backdrop manualmente si quedó
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    document.body.classList.remove('modal-open');
  } catch (error) {
    console.error('Error eliminando promoción:', error);
  }
}


editPromo(promo: any) {
  // Llena el formulario con la info existente
  this.newPromo = {
    name: promo.name,
    description: promo.description.split('\nFecha:')[0] || '',
    date: promo.description.split('\nFecha:')[1]?.trim() || '',
    files: promo.files || [],
    userId: promo.userId || '',
  };
  this.editingPromoId = promo.id;
  this.isEditingPromo = true;
  this.promoImageFile = null;
  // Abre el modal
  setTimeout(() => {
    const modalEl = document.getElementById('promoModal');
    if (modalEl) {
      const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl) || (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (modalInstance) {
        modalInstance.show();
      }
    }
  }, 100);
}
openPromoModal() {
  // Limpieza antes de abrir
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) backdrop.remove();
  document.body.classList.remove('modal-open');

  const modalEl = document.getElementById('promoModal');
  if (modalEl) {
    const modalInstance = (window as any).bootstrap?.Modal?.getOrCreateInstance(modalEl) || (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.show();
    }
  }
}

}