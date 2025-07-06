import { Component, Input, OnInit } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';
import PocketBase from 'pocketbase';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';
import { SwipesService } from 'src/app/services/SwipesService.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  @Input() clientes: any[] = [];
  currentIndex = 0;
  startX = 0;
  deltaX = 0;
  deltaY = 0;
  startY = 0;
  swipeHistory: { clientId: string; action: 'like' | 'dislike' | 'superlike' }[] = [];
  transform = '';
  threshold = 100; // Distancia mínima para considerar swipe
  isDragging = false;
  superlikeThreshold = -150; // Si se desea implementar vertical
  pb: PocketBase;
  touchStartTime = 0;
constructor(public global: GlobalService,
  public authPocketbaseService: AuthPocketbaseService,
  public swipesService: SwipesService
){
  this.pb = this.global.pb;
}
ngOnInit(): void {
  this.global.clientes$.subscribe((clientes : any[]) => {
    this.clientes = clientes;
  });
}

startDrag(event: MouseEvent | TouchEvent) {
  this.isDragging = true;
  const pos = this.getXY(event);
  this.startX = pos.x;
  this.startY = pos.y;
}

onDrag(event: MouseEvent | TouchEvent) {
  if (!this.isDragging) return;
  const pos = this.getXY(event);
  this.deltaX = pos.x - this.startX;
  this.deltaY = pos.y - this.startY;
  this.transform = `translate(${this.deltaX}px, ${this.deltaY}px) rotate(${this.deltaX / 20}deg)`;
}

async endDrag(event: MouseEvent | TouchEvent, cliente: any) {
  if (!this.isDragging) return;
  this.isDragging = false;

  if (this.deltaY < this.superlikeThreshold) {
    await this.registerSwipe(cliente, 'superlike');
    this.global.selectedClient = cliente;
    this.global.activeRoute = 'chat-detail';
  } else if (this.deltaX > this.threshold) {
    await this.registerSwipe(cliente, 'like');
  } else if (this.deltaX < -this.threshold) {
    await this.registerSwipe(cliente, 'dislike');
  }

  this.nextCard();
}

async registerSwipe(cliente: any, action: 'like' | 'dislike' | 'superlike') {
  await this.swipesService.registerSwipe(cliente.id, action);

  if (action === 'superlike') {
    this.showSuperLikeNotification(cliente);
  }

  this.swipeHistory.push({ clientId: cliente.id, action });
}

nextCard() {
  this.transform = '';
  this.deltaX = 0;
  this.deltaY = 0;
  this.currentIndex = (this.currentIndex + 1) % this.clientes.length;
}

undoLastSwipe() {
  if (this.swipeHistory.length === 0) return;

  const lastSwipe = this.swipeHistory.pop();
  console.log('🔙 Revirtiendo swipe:', lastSwipe);

  this.currentIndex =
    this.clientes.findIndex((c) => c.id === lastSwipe?.clientId) || 0;
  this.transform = '';
}

getXY(event: MouseEvent | TouchEvent): { x: number; y: number } {
  return event instanceof MouseEvent
    ? { x: event.clientX, y: event.clientY }
    : { x: event.touches[0].clientX, y: event.touches[0].clientY };
}
// Útil para touch y mouse
getX(event: MouseEvent | TouchEvent): number {
  return event instanceof MouseEvent
    ? event.clientX
    : event.touches[0].clientX;
}

// Si quieres doble click para SuperLike

/* abrirChat(cliente: any) {
  this.registerSwipe(cliente, 'superlike'); // Doble clic => Super Like
  this.global.selectedClient = cliente;
  this.global.activeRoute = 'chat-detail';
} */
abrirChat(cliente: any) {
  this.registerSwipe(cliente, 'superlike');
  this.global.selectedClient = cliente;
  this.global.activeRoute = 'chat-detail';
  this.global.chatReceiverId = cliente.id;
}
showSuperLikeNotification(cliente: any) {
  const message = `¡Le diste Super Like a ${cliente.name}!`;
  alert(message); // ✅ Sencillo. Puedes reemplazar por una toast más bonita.
}

}