import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { GlobalService } from 'src/app/services/global.service';
import { ChatService } from 'src/app/services/chat.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css']
})
export class ChatDetailComponent implements OnInit {
  @Input() user!: any;
  messages: any[] = [];
  newMessage = '';
  private subscription!: Subscription;

  constructor(private chatService: ChatService) {}

  async ngOnInit() {
    this.messages = await this.chatService.loadMessages(this.user.id);
    this.subscription = this.chatService.messagesObservable.subscribe(messages => {
      this.messages = messages;
    });
    this.chatService.subscribeToMessages(this.user.id);
  }

 /*  async sendMessage() {
    if (!this.newMessage.trim()) return;
    await this.chatService.sendMessage(this.user.id, this.newMessage.trim());
    this.newMessage = '';
  } */
  async sendMessage() {
    if (!this.newMessage.trim()) return;
    if (!this.user?.id) return; // ✅ Verifica que user esté definido
  
    await this.chatService.sendMessage(this.user.id, this.newMessage.trim());
    this.newMessage = '';
  }
  
  ngOnDestroy() {
    this.chatService.unsubscribe();
    this.subscription?.unsubscribe();
  }
}

