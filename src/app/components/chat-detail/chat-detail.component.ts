import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatService } from 'src/app/services/chat.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css']
})
export class ChatDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() user!: any;
  @ViewChild('scrollBottom') scrollBottom!: ElementRef;

  messages: any[] = [];
  newMessage = '';
  private subscription!: Subscription;
  currentUserId!: string;

  constructor(private chatService: ChatService) {
    
  }

  async ngOnInit() {
    if (!this.user) {
      console.error('❌ user no definido al iniciar');
      return;
    }
  
    this.initChat();
  }
  
  private async initChat() {
    try {
      this.currentUserId = this.chatService.pb.authStore?.model?.id || '';
      this.messages = await this.chatService.loadMessages(this.user.id);
  
      this.subscription = this.chatService.messagesObservable.subscribe(messages => {
        this.messages = messages;
        this.scrollToBottom();
      });
  
      this.chatService.subscribeToMessages(this.user.id);
    } catch (error) {
      console.error('Error inicializando chat:', error);
    }
  }
  
  

async sendMessage() {
  if (!this.newMessage.trim()) {
      console.error('Mensaje vacío');
      return;
  }
  
  if (!this.user?.id) {
      console.error('ID de usuario no disponible');
      return;
  }

  if (!this.chatService.pb.authStore.isValid) {
      console.error('Usuario no autenticado');
      return;
  }

  try {
      console.log('Enviando mensaje a:', this.user);
      await this.chatService.sendMessage(this.user.userId || this.user.id, this.newMessage.trim());
      this.newMessage = '';
  } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Puedes mostrar un mensaje al usuario aquí
  }
}
  
    
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.scrollBottom?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  ngOnDestroy() {
    this.chatService.unsubscribe();
    this.subscription?.unsubscribe();
  }
}
