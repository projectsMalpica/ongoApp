import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
activeRoute: string = 'register';
pb = new PocketBase('https://db.ongomatch.com:8090');
private clientesSubject = new BehaviorSubject<any[]>([]);
clientes$ = this.clientesSubject.asObservable();
private partnersSubject = new BehaviorSubject<any[]>([]);
partners$ = this.partnersSubject.asObservable();
private promosSubject = new BehaviorSubject<any[]>([]);
promos$ = this.promosSubject.asObservable();
private planningPartnersSubject = new BehaviorSubject<any[]>([]);
planningPartners$ = this.planningPartnersSubject.asObservable();
private planningClientsSubject = new BehaviorSubject<any[]>([]);
planningClients$ = this.planningClientsSubject.asObservable();
public selectedPartner: any = null;
public selectedServicesPartner: string[] = [];
public selectedClient: any =null;
public photosPartner: any[] = [];
public allServices: { value: string; label: string }[] = [];
public profileData: any = {
  name: '',
  gender: '',
  userId: '',
  status: '',
  photos: [],
  birthday: '',
  interestedIn: '',
  email: '',
  orientation: '',
  lookingFor: '',
  address: '',
  language: '',
  about: '',
  age: null,
  interests: [],
  avatar: '',
};

profileDataPartner: any = {
  avatar: '',
  venueName: '',
  userId: '',
  status: '',
  files: [],
  birthday: '',
  address: '',
  email: '',
  description: '',
  phone: '',
  capacity: '',
  openingHours: '',
  lat: '',
  lng: '',
  services: '',
  about: '',    
  
};

  constructor(
   
  ) { 
    this.initClientesRealtime();
    this.initPartnersRealtime();
    this.initPromosRealtime();
    this.initPlanningPartnersRealtime();
    this.initPlanningClientsRealtime();
  }
  setRoute(route: string) {
    this.activeRoute = route;
  }
  async initClientesRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('usuariosClient').getFullList();
    this.clientesSubject.next(result);

    // Suscripción realtime
    this.pb.collection('usuariosClient').subscribe('*', (e: any) => {
      let current = this.clientesSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.clientesSubject.next(current);
    });
  }
  async initPartnersRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('usuariosPartner').getFullList();
    this.partnersSubject.next(result);

    // Suscripción realtime
    this.pb.collection('usuariosPartner').subscribe('*', (e: any) => {
      let current = this.partnersSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.partnersSubject.next(current);
    });
  }
  previewPartner(partner: any) {
    this.selectedPartner = partner;
    this.activeRoute = 'detail-profile-local';
  }
  previewClient(client: any) {
    this.selectedClient = client;
    this.activeRoute = 'detail-profile';
  }
  async initPromosRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('promos').getFullList();
    this.promosSubject.next(result);

    // Suscripción realtime
    this.pb.collection('promos').subscribe('*', (e: any) => {
      let current = this.promosSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.promosSubject.next(current);
    });
  }
  async initPlanningPartnersRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('planningPartners').getFullList();
    this.planningPartnersSubject.next(result);

    // Suscripción realtime
    this.pb.collection('planningPartners').subscribe('*', (e: any) => {
      let current = this.planningPartnersSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.planningPartnersSubject.next(current);
    });
  }
  async initPlanningClientsRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('planningClients').getFullList();
    this.planningClientsSubject.next(result);

    // Suscripción realtime
    this.pb.collection('planningClients').subscribe('*', (e: any) => {
      let current = this.planningClientsSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.planningClientsSubject.next(current);
    });
  }
 
}
