import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickButtonsComponent } from './quick-buttons.component';

describe('QuickButtonsComponent', () => {
  let component: QuickButtonsComponent;
  let fixture: ComponentFixture<QuickButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
