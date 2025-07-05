import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-detailprofile',
  imports: [CommonModule, ],
  templateUrl: './detailprofile.component.html',
  styleUrl: './detailprofile.component.css'
})
export class DetailprofileComponent {
constructor(public global: GlobalService){}
abrirChat(cliente: any) {
  console.log('Abriendo chat con:', cliente); // ✅ Para confirmar en consola
  this.global.selectedClient = cliente;
  this.global.activeRoute = 'chat-detail';
}

}
