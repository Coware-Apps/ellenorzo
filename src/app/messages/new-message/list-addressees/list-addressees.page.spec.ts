import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListAddresseesPage } from './list-addressees.page';

describe('ListAddresseesPage', () => {
  let component: ListAddresseesPage;
  let fixture: ComponentFixture<ListAddresseesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListAddresseesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListAddresseesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
