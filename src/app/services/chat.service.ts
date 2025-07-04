import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { GlobalService } from './global.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private pb: PocketBase;
  private messages$ = new BehaviorSubject<any[]>([]);

  constructor(private global: GlobalService) {
    this.pb = this.global.pb;
  }

  async sendMessage(receiverId: string, text: string) {
    await this.pb.collection('messages').create({
      sender: this.pb.authStore.model?.id,
      receiver: receiverId,
      text: text,
      read: false,
    });
  }

  async loadMessages(receiverId: string) {
    const senderId = this.pb.authStore.model?.id;
    const result = await this.pb.collection('messages').getFullList({
      filter: `(sender.id = "${senderId}" && receiver.id = "${receiverId}") || (sender.id = "${receiverId}" && receiver.id = "${senderId}")`,
      sort: '+created',
    });
    this.messages$.next(result);
    return result;
  }

  subscribeToMessages(receiverId: string) {
    const senderId = this.pb.authStore.model?.id;
    const filter = `(sender.id = "${senderId}" && receiver.id = "${receiverId}") || (sender.id = "${receiverId}" && receiver.id = "${senderId}")`;

    this.pb.collection('messages').subscribe('*', (e) => {
      if (e.action === 'create' && (e.record['sender'] === senderId || e.record['receiver'] === senderId)) {
        this.loadMessages(receiverId);
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
