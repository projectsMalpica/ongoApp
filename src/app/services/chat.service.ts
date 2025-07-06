import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatPocketbaseService {

  private pb = new PocketBase('http://db.ongomatch.com:8090'); // Cambia a https cuando tengas SSL
  private messagesSubject = new BehaviorSubject<any[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  public currentUser: any = null;
  public chatReceiverId: string = '';
  constructor() {
  }

 /*  private initRealtime() {
    const userId = this.pb.authStore.model?.id;
    if (!userId) {
      console.error('[ChatPocketbaseService] No autenticado: no se puede suscribir a realtime.');
      return;
    }
    this.pb.collection('messages').subscribe('*', (event) => {
      console.log('Evento realtime:', event);
      if (event.action === 'create') {
        const current = this.messagesSubject.getValue();
        this.messagesSubject.next([...current, event.record]);
      }
    });
  } */
  private initRealtime() {
    const userId = this.pb.authStore.model?.id;
    if (!userId) {
      console.error('[ChatPocketbaseService] No autenticado: no se puede suscribir a realtime.');
      return;
    }
  
    this.pb.collection('messages').subscribe('*', (event) => {
      if (event.action !== 'create') return;
      const record = event.record;
      
      // Solo agregar el mensaje si el usuario es parte del chat actual
      const involved = [record['sender'], record['receiver']];
      if (involved.includes(userId) && involved.includes(this.chatReceiverId)) {
        const current = this.messagesSubject.getValue();
        this.messagesSubject.next([...current, record]);
      }
    });
  }
  
  public async initialize(pbInstance: PocketBase) {
    this.pb = pbInstance;
    this.initRealtime();
  }

  async sendMessage(text: string, receiverId: string) {
    const senderId = this.pb.authStore.model?.id;
    if (!senderId) {
      console.error('[ChatPocketbaseService] No autenticado: no se puede enviar mensaje.');
      return;
    }
    if (!receiverId) {
      console.error('[ChatPocketbaseService] receiverId indefinido: no se puede enviar mensaje.');
      return;
    }
    try {
      await this.pb.collection('messages').create({
        text,
        sender: senderId,
        receiver: receiverId,
      });
      console.log('[ChatPocketbaseService] Mensaje enviado correctamente');
    } catch (error) {
      console.error('[ChatPocketbaseService] Error enviando mensaje:', error);
    }
  }

  async loadMessages(receiverId: string) {
    const userId = this.pb.authStore.model?.id;
    if (!userId) {
      console.error('[ChatPocketbaseService] No autenticado: no se pueden cargar mensajes.');
      this.messagesSubject.next([]);
      return;
    }
    if (!receiverId) {
      console.error('[ChatPocketbaseService] receiverId indefinido: no se pueden cargar mensajes.');
      this.messagesSubject.next([]);
      return;
    }
    try {
      const res = await this.pb.collection('messages').getFullList({
        filter: `(sender="${userId}" && receiver="${receiverId}") || (sender="${receiverId}" && receiver="${userId}")`,
        sort: '-created'
      });
      this.messagesSubject.next(res.reverse());
      console.log(`[ChatPocketbaseService] Mensajes cargados (${res.length})`);
    } catch (error) {
      console.error('[ChatPocketbaseService] Error cargando mensajes:', error);
      this.messagesSubject.next([]);
    }
  }
}
