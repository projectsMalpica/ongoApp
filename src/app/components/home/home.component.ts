import { Component, Input, OnInit } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';
import PocketBase from 'pocketbase';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  @Input() clientes: any[] = [];
  currentIndex = 0;
  startX = 0;
  deltaX = 0;
/*   clientes: any[] = [];
 */  pb: PocketBase;
  touchStartTime = 0;
constructor(public global: GlobalService){
  this.pb = this.global.pb;
}
ngOnInit(): void {
  this.global.clientes$.subscribe((clientes : any[]) => {
    this.clientes = clientes;
  });
}
abrirChat(cliente: any) {
  console.log('Abriendo chat con:', cliente); // ✅ Para confirmar en consola
  this.global.selectedClient = cliente;
  this.global.activeRoute = 'chat-detail';
  
}

 
}


