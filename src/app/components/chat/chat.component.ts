import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';
import { ChatPocketbaseService } from 'src/app/services/chat.service';
import { RecordModel } from 'pocketbase';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages: RecordModel[] = [];
  currentUserId: string = '';
constructor(public global: GlobalService,
  public chatService: ChatPocketbaseService
) {
  this.currentUserId = this.chatService.getCurrentUserId();
}

ngOnInit(): void {
  this.chatService.messages$.subscribe((messages) => {
    this.messages = messages;
  });
}
}