import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddresseeSelectorPage } from './addressee-selector.page';

describe('AddresseeSelectorPage', () => {
  let component: AddresseeSelectorPage;
  let fixture: ComponentFixture<AddresseeSelectorPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddresseeSelectorPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddresseeSelectorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
