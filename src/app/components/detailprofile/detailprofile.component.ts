import { Component } from '@angular/core';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-detailprofile',
  imports: [],
  templateUrl: './detailprofile.component.html',
  styleUrl: './detailprofile.component.css'
})
export class DetailprofileComponent {
constructor(public global: GlobalService){}
abrirChat(cliente: any) {
  this.global.selectedClient = cliente; // Guarda el cliente seleccionado
  this.global.activeRoute = 'chat-detail'; // Cambia a la vista de chat
}
}
