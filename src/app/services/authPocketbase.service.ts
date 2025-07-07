  import PocketBase from 'pocketbase';
  import { Injectable, Inject, PLATFORM_ID, Renderer2, model } from '@angular/core';
  import { isPlatformBrowser } from '@angular/common';
  import { GlobalService } from './global.service';
  import { Observable, from, tap, map } from 'rxjs';
  import { UserInterface } from '../interface/user-interface ';
  import { RecordModel } from 'pocketbase';
  /* import { RealtimeOrdersService } from './realtime-orders.service';  
  */@Injectable({
    providedIn: 'root',
  })
  export class AuthPocketbaseService {
    public pb: PocketBase;
    public currentUser: any; // Usuario actual
    public profile: any = null; // Perfil actual (usuariosClient)
    complete: boolean = false;

    constructor(
  /*     public realtimeOrders: RealtimeOrdersService,
  */    public global: GlobalService) {
      this.pb = new PocketBase('https://db.ongomatch.com:8090');
      // Restaurar sesión y perfil automáticamente al iniciar el servicio
      const token = localStorage.getItem('accessToken');
      const userString = localStorage.getItem('user');
      if (token && userString) {
        this.pb.authStore.loadFromCookie(token);
        this.currentUser = JSON.parse(userString);
        localStorage.setItem('isLoggedin', 'true');
        localStorage.setItem('userId', this.currentUser.id);
        // Intenta cargar perfil
        const profileString = localStorage.getItem('profile');
        if (profileString) {
          this.profile = JSON.parse(profileString);
        } else {
          // Si no hay perfil en localStorage, intenta cargarlo del backend
          this.loadProfileFromBackend();
        }
      }
    }

    async loadProfileFromBackend() {
      if (!this.currentUser?.id) return;
      try {
        const profile = await this.pb.collection('usuariosClient').getFirstListItem(`userId="${this.currentUser.id}"`);
        this.profile = profile;
        localStorage.setItem('profile', JSON.stringify(profile));
      } catch (e) {
        console.warn('No se pudo cargar el perfil del backend:', e);
      }
    }
    async updateUserField(userId: string, updateData: any): Promise<void> {
      await this.pb.collection('users').update(userId, updateData);
    }
    
    async findPartnerByUserId(userId: string): Promise<any> {
      return await this.pb
        .collection('usuariosPartner')
        .getFirstListItem(`id="${userId}"`);
        }
    
    async updatePartnerField(partnerId: string, updateData: any): Promise<void> {
      await this.pb.collection('usuariosPartner').update(partnerId, updateData);
    }
    
    isLogin() {
      return localStorage.getItem('isLoggedin');
    }

    isAdmin() {
      const userType = localStorage.getItem('type');
      return userType === '"admin"';
    }
    isPartner() {
      const userType = localStorage.getItem('type');
      return userType === '"partner"';
    }

    isClient() {
      const userType = localStorage.getItem('type');
      return userType === '"usuariosClient"';
    }

    registerUser(email: string, password: string, type: string, name: string, address: string // Añadimos el parámetro address
    ): Observable<any> {
      const userData = {
        email: email,
        password: password,
        passwordConfirm: password,
        type: type,
        username: name,
        name: name,
      };

      // Crear usuario y luego crear el registro en usuariosPartner o usuariosClient
      return from(
        this.pb
          .collection('users')
          .create(userData)
          .then((user) => {
            const data = {
              name: name,
              venueName: '',
              address: address, 
              capacity: '',
              description: '',
              openingHours: '',
              phone: '', 
              userId: user.id, 
              status: 'pending', 
              birthday: '',
              gender: '',
              orientation: '',
              interestedIn: '',
              lookingFor: '',
              profileComplete: false,
              email: email,
              /* images: {}, */ // Agrega los campos correspondientes aquí
            };
            if (type === 'partner') {
              return this.pb.collection('usuariosPartner').create(data);
            } else if (type === 'client') {
              return this.pb.collection('usuariosClient').create(data);
            } else {
              throw new Error('Tipo de usuario no válido');
            }
          })
      );
    }
    
    profileStatus() {
      return this.complete;
    }

    onlyRegisterUser(
      email: string,
      password: string,
      type: string,
      name: string
    ): Observable<any> {
      const userData = {
        email: email,
        password: password,
        passwordConfirm: password,
        type: type,
        username: name,
        name: name,
      };

      // Crear usuario y devolver el observable con el usuario creado
      return from(
        this.pb
          .collection('users')
          .create(userData)
          .then((user) => {
            // No se necesita crear ningún registro adicional en clinics aquí
            return user; // Devolver los datos del usuario creado
          })
      );
    }

    /* loginUser(email: string, password: string): Observable<any> {
      return from(this.pb.collection('users').authWithPassword(email, password))
        .pipe(
          map((authData) => {
            const pbUser = authData.record;
            const user: UserInterface = {
              id: pbUser.id,
              email: pbUser['email'],
              password: '', // No almacenamos la contraseña por seguridad
              full_name: pbUser['name'],
              phone: pbUser['phone'],
              images: pbUser['images'] || {},
              type: pbUser['type'],
              username: pbUser['username'],
              address: pbUser['address'],
              created: pbUser['created'],
              updated: pbUser['updated'],
              avatar: pbUser['avatar'] || '',
              status: pbUser['status'] || 'active',
              dni: pbUser['dni'],
              gender: pbUser['gender'],
            };
            return { ...authData, user };
          }),
          tap((authData) => {
            this.setUser(authData.user);
            this.setToken(authData.token);
            localStorage.setItem('isLoggedin', 'true');
            localStorage.setItem('userId', authData.user.id);
          })
        );
    } */
        loginUser(email: string, password: string): Observable<any> {
          return from(this.pb.collection('users').authWithPassword(email, password))
            .pipe(
              map((authData) => {
                const pbUser = authData.record;
      
                const user: UserInterface = {
                  id: pbUser.id,
                  email: pbUser['email'],
                  password: '',
                  full_name: pbUser['name'],
                  phone: pbUser['phone'],
                  images: pbUser['images'] || {},
                  type: pbUser['type'],
                  username: pbUser['username'],
                  address: pbUser['address'],
                  created: pbUser['created'],
                  updated: pbUser['updated'],
                  avatar: pbUser['avatar'] || '',
                  status: pbUser['status'] || 'active',
                  dni: pbUser['dni'],
                  gender: pbUser['gender'],
                };
      
                return { ...authData, user };
                
              }),
              tap(async (authData) => {
                this.setUser(authData.user);
                this.setToken(authData.token, authData.record);

                // ✅ Guarda el token y el modelo en el authStore de PocketBase
                this.pb.authStore.save(authData.token, authData.record);
              
                // Además guarda en localStorage por si lo usas después
                localStorage.setItem('accessToken', authData.token);
                localStorage.setItem('isLoggedin', 'true');
                localStorage.setItem('userId', authData.user.id);
                localStorage.setItem('user', JSON.stringify(authData.user));
                // 🚨 AQUÍ CARGAS EL PERFIL DE usuariosClient
                try {
                  const profile = await this.pb.collection('usuariosClient').getFirstListItem(`userId="${authData.user.id}"`);
                  localStorage.setItem('profile', JSON.stringify(profile));
                } catch (error) {
                  console.warn('⚠️ No se encontró el perfil en usuariosClient', error);
                }
                            })
              
            );
        }
      
    logoutUser(): Observable<any> {
      // Limpiar completamente el localStorage
      localStorage.clear();
      
      // Limpiar la autenticación de PocketBase
      this.pb.authStore.clear();
      
      // Redireccionar a home
      this.global.setRoute('login');

      return new Observable<any>((observer) => {
        observer.next(''); // Indicar que la operación de cierre de sesión ha completado
        observer.complete();
      });
    }

    setToken(token: string, model: RecordModel): void {
      this.pb.authStore.save(token, model);
    }
    permision(): void {
      if (!this.isAuthenticated()) {
        this.global.setRoute('home');
        return;
      }

      const currentUser = this.getCurrentUser();
      if (!currentUser || !currentUser.type) {
        this.global.setRoute('home');
        return;
      }

      // Llamar a la API para obtener información actualizada del usuario
      this.pb.collection('users').getOne(currentUser.id).then(updatedUser => {
        switch (updatedUser["type"]) {
          case 'partner':
            this.global.setRoute('profile-local');
            this.complete = true;
            break;
          case 'client':
            this.global.setRoute('profile');
            this.complete = true;
            break;
          default:
            this.global.setRoute('login');
        }
      }).catch(error => {
        console.error('Error checking permissions:', error);
        localStorage.clear();
        this.pb.authStore.clear();
        this.global.setRoute('home');
      });
    }

    isAuthenticated(): boolean {
      return !!this.pb.authStore.isValid;
    }

    setUser(user: UserInterface): void {
      this.currentUser = user; // Almacenamos el usuario en la propiedad pública
      let user_string = JSON.stringify(user);
      let type = JSON.stringify(user.type);
      localStorage.setItem('user', user_string);
      localStorage.setItem('type', type);
    }

    getCurrentUser(): any {
      if (!this.currentUser) {
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      }
      return this.currentUser;
    }

    getCurrentProfile(): any {
      if (!this.profile) {
        this.profile = JSON.parse(localStorage.getItem('profile') || '{}');
      }
      return this.profile;
    }
    
    getUserId(): string {
      const userId = localStorage.getItem('userId');
      return userId ? userId : '';    
    }
    getFullName(): string {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.full_name || 'Usuario';
      }
      return 'Usuario';
    }
    async restoreSession() {
      try {
        const token = localStorage.getItem('accessToken');
        const recordString = localStorage.getItem('record');
        if (token && recordString) {
          const record = JSON.parse(recordString);
          this.pb.authStore.save(token, record);
          this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
          // ✔️ Carga siempre el perfil más reciente
          await this.loadProfileFromBackend();
        }
      } catch (e) {
        console.warn('No se pudo restaurar la sesión:', e);
      }
    }
    
    
    
    
    async waitForAuthUser(retries = 10, delayMs = 300): Promise<boolean> {
      for (let i = 0; i < retries; i++) {
        if (this.currentUser?.id) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      return false;
    }
    
  }
