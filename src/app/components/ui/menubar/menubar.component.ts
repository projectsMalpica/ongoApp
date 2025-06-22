import { Component } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menubar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menubar.component.html',
  styleUrl: './menubar.component.css'
})
export class MenubarComponent {
isPartner: boolean = false;
constructor(
  public global: GlobalService,
  public auth: AuthPocketbaseService
) { 
  this.isPartner = this.auth.isPartner();
}
}

