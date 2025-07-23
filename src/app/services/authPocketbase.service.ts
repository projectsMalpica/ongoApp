  import PocketBase from 'pocketbase';
  import { Injectable, Inject, PLATFORM_ID, Renderer2, model } from '@angular/core';
  import { isPlatformBrowser } from '@angular/common';
  import { GlobalService } from './global.service';
  import { Observable, from, tap, map, of } from 'rxjs';
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
      return userType === '"client"';
    }

    async findClientByUserId(userId: string): Promise<any> {
      return await this.pb
        .collection('usuariosClient')
        .getFirstListItem(`userId="${userId}"`);
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

    loginUser(email: string, password: string): Observable<any> {
      return from(this.pb.collection('users').authWithPassword(email, password)).pipe(
        map((authData) => {
          const pbUser = authData.record;
          const userTypeRaw = pbUser['type'];
          const userType = Array.isArray(userTypeRaw) ? userTypeRaw[0] : userTypeRaw;
    
          const user: UserInterface = {
            id: pbUser.id,
            email: pbUser['email'],
            password: '',
            name: pbUser['name'],
            phone: pbUser['phone'],
            images: pbUser['images'] || {},
            type: userType,
            username: pbUser['username'],
            address: pbUser['address'],
            created: pbUser['created'],
            updated: pbUser['updated'],
            avatar: pbUser['avatar'] || '',
            status: pbUser['status'] || 'active',
            gender: pbUser['gender'],
          };
    
          return { ...authData, user };
        }),
        tap(async (authData) => {
          const user = authData.user;
          const token = authData.token;
          // 🚪 Limpia cualquier conexión anterior
          await this.pb.realtime.unsubscribe();
          this.pb.authStore.clear();
          this.pb.authStore.save(token, authData.record);
    
          // Guarda en localStorage
          this.setUser(user);
          localStorage.setItem('accessToken', token);
          localStorage.setItem('userId', user.id);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('type', JSON.stringify(user.type));
    
          console.log(`🔎 Login OK. Buscando perfil para tipo=${user.type}, userId=${user.id}`);
    
          // 🧩 Carga perfil asociado
          try {
            const coll = user.type === 'partner'
              ? 'usuariosPartner'
              : user.type === 'client'
              ? 'usuariosClient'
              : null;
    
            if (!coll) throw new Error(`Tipo inválido: ${user.type}`);
    
            const list = await this.pb.collection(coll).getList(1, 1, {
              filter: `userId="${user.id}"`,
            });
    
            if (list.items.length) {
              this.profile = list.items[0];
              console.log('✅ Perfil cargado:', this.profile);
              localStorage.setItem('profile', JSON.stringify(this.profile));
            } else {
              console.warn(`⚠️ Sin perfil en ${coll} para userId ${user.id}`);
            }
          } catch (err) {
            console.error('[AUTH] Error obteniendo perfil:', err);
          }
        })
      );
    }
         
      
    async logoutUser(): Promise<any> {
      await this.pb.realtime.unsubscribe();
      this.pb.authStore.clear();
      localStorage.clear();
      this.global.setRoute('login');
      return of(null);
    }
    
    setToken(token: string, model: RecordModel): void {
      this.pb.authStore.save(token, model);
    }
    async permision() {
      // Espera hasta que authStore esté listo
      await new Promise(resolve => {
        const check = () => this.pb.authStore.isValid ? resolve(true) : setTimeout(check, 50);
        check();
      });
    
      if (!this.isAuthenticated()) {
        this.global.setRoute('home');
        return;
      }
      
      const user = this.getCurrentUser();
      if (!user?.type) {
        this.global.setRoute('home');
        return;
      }
    
      // Redirige según rol
      if (user.type === 'partner') {
        this.global.setRoute('profile-local');
      } else if (user.type === 'client') {
        this.global.setRoute('profile');
      } else {
        this.global.setRoute('login');
      }
    }
    
    
   /*  permision(): void {
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
      });
    } */

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

    async requestPasswordReset(email: string): Promise<void> {
      try {
        await this.pb.collection('users').requestPasswordReset(email);
        console.log('✔️ Solicitud de reseteo enviada correctamente.');
      } catch (error) {
        console.error('❌ Error al solicitar el reseteo de contraseña:', error);
        throw error;
      }
    }

    async confirmPasswordReset(token: string, newPassword: string, confirmPassword: string): Promise<void> {
      try {
        await this.pb.collection('users').confirmPasswordReset(token, newPassword, confirmPassword);
        console.log('✔️ Contraseña actualizada correctamente');
      } catch (error) {
        console.error('❌ Error al actualizar la contraseña:', error);
        throw error;
      }
    }
    
  }
