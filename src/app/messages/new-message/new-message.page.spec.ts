import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NewMessagePage } from './new-message.page';

describe('NewMessagePage', () => {
  let component: NewMessagePage;
  let fixture: ComponentFixture<NewMessagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewMessagePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NewMessagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
