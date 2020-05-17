import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HomeSettingsPage } from './home-settings.page';

describe('HomeSettingsPage', () => {
  let component: HomeSettingsPage;
  let fixture: ComponentFixture<HomeSettingsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeSettingsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
