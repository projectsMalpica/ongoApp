import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-home-local',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-local.component.html',
  styleUrl: './home-local.component.css'
})
export class HomeLocalComponent {
  
  constructor(public global: GlobalService) {}

  ngOnInit(): void {
    this.global.initPlanningPartnersRealtime();
  }

}
