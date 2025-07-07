import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ChatPocketbaseService } from 'src/app/services/chat.service';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css']
})
export class ChatDetailComponent implements OnInit, AfterViewInit {
  
  @Input() user: any;
  @Input() receiverId: string = '';
  
  @ViewChild('scrollBottom') scrollBottom!: ElementRef;

  form: FormGroup;
  messages: any[] = [];
  currentUserId: string = '';
  
  constructor(
    private chatService: ChatPocketbaseService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({ message: [''] });
  }


  
  /* async ngOnInit() {
    console.log('🟢 Chat iniciado con:', this.receiverId);
  
    this.currentUserId = this.chatService.getCurrentUserId();
    console.log('Usuario actual:', this.currentUserId);
  
    this.chatService.chatReceiverId = this.receiverId;
    await this.chatService.loadMessages(this.receiverId);
  
    this.chatService.messages$.subscribe(messages => {
      console.log('🔍 Mensajes recibidos:', messages);
      this.messages = messages;
      this.scrollToBottom();
    });
  } */
  
    async ngOnInit() {
      this.currentUserId = this.chatService.getCurrentUserId();
      console.log('🔍 currentUserId:', this.currentUserId);
    
      this.chatService.chatReceiverId = this.receiverId;
    
      await this.chatService.loadMessages(this.receiverId);
    
      this.chatService.messages$.subscribe(messages => {
        console.log('🟢 Mensajes actualizados:', messages);
        this.messages = messages;
        this.scrollToBottom();
      });
    }
    
  
  async send() {
    const message = this.form.value.message?.trim();
    if (!message) return;
  
/*     await this.chatService.sendMessage(message, this.receiverId);
 */    
    await this.chatService.pb.collection('messages').create({
      text: message,
      sender: this.currentUserId,
      receiver: this.receiverId
    }).then((record) => {
      const current = this.chatService.messagesSubject.getValue();
      this.chatService.messagesSubject.next([...current, record]);
      this.form.reset();
    });
    
  }
  
    
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.scrollBottom?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

 
}
