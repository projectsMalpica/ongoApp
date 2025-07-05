import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { GlobalService } from './global.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  public pb: PocketBase;
  private messages$ = new BehaviorSubject<any[]>([]);

  constructor(public global: GlobalService) {
    this.pb = this.global.pb;
    
  }

  /**
   * ✔️ Busca el perfil extendido en usuariosClient
   */
 // chat.service.ts

async getSenderProfileId(): Promise<string> {
  const userId = this.pb.authStore.model?.id;
  if (!userId) throw new Error('Usuario no autenticado');

  try {
      // Busca el perfil del usuario actual
      const profile = await this.pb
          .collection('usuariosClient')
          .getFirstListItem(`id="${userId}"`);

      
      return profile.id;
  } catch (error) {
      console.error('Error al obtener perfil del remitente:', error);
      throw error; // Re-lanza el error para manejarlo en sendMessage
  }
}

async sendMessage(receiverProfileId: string, text: string) {
  const senderProfileId = await this.getSenderProfileId();
  return this.pb.collection('messages').create({
    sender: senderProfileId,
    receiver: receiverProfileId,
    text,
    read: false,
  });
}


async getProfileByUserId(userId: string) {
  return await this.pb.collection('usuariosClient').getFirstListItem(`id="${userId}"`);
}


  /**
   * ✔️ Envía un mensaje usando el id de usuariosClient
   */
 /*  public async sendMessage(userId: string, text: string) {
    try {
      const senderProfileId = await this.getSenderProfileId();

      console.log('⚙️ Enviando mensaje: ', { senderProfileId, userId, text });

      const response = await this.pb.collection('messages').create({
        sender: senderProfileId,
        receiver: userId,
        text: text,
        read: false,
      });

      console.log('✅ Mensaje creado:', response);
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
    }
  }
   */

  /**
   * ✔️ Carga mensajes filtrando correctamente
   */
  async loadMessages(userId: string) {
    const senderProfileId = await this.getSenderProfileId();

    const result = await this.pb.collection('messages').getFullList({
      filter: `(sender = "${senderProfileId}" && receiver = "${userId}") || (sender = "${userId}" && receiver = "${senderProfileId}")`,
      sort: '+created',
    });

    this.messages$.next(result);
    return result;
  }

  /**
   * ✔️ Suscripción optimizada
   */
  async subscribeToMessages(userId: string) {
    const senderProfileId = await this.getSenderProfileId();

    this.pb.collection('messages').subscribe('*', (e) => {
      const message = e.record;

      const isCurrentConversation =
        (message['sender'] === senderProfileId && message['receiver'] === userId) ||
        (message['sender'] === userId && message['receiver'] === senderProfileId);

      if (isCurrentConversation) {
        const currentMessages = this.messages$.getValue();
        this.messages$.next([...currentMessages, message]);
      }
    });
  }

  get messagesObservable() {
    return this.messages$.asObservable();
  }

  unsubscribe() {
    this.pb.collection('messages').unsubscribe('*');
  }
}
