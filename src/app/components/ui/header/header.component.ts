import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalService } from '../../../services/global.service';
import { AuthPocketbaseService } from 'src/app/services/authPocketbase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
constructor(public global: GlobalService, public auth: AuthPocketbaseService) {}
}
