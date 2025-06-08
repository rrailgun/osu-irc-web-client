import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MpLobbyInfoComponent } from './mp-lobby-info.component';

describe('MpLobbyInfoComponent', () => {
  let component: MpLobbyInfoComponent;
  let fixture: ComponentFixture<MpLobbyInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MpLobbyInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MpLobbyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
