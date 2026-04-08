import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftSendComponent } from './gift-send.component';

describe('GiftSendComponent', () => {
  let component: GiftSendComponent;
  let fixture: ComponentFixture<GiftSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GiftSendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
