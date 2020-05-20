import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { KretaErrorComponent } from './kreta-error.component';

describe('KretaErrorComponent', () => {
  let component: KretaErrorComponent;
  let fixture: ComponentFixture<KretaErrorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KretaErrorComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(KretaErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
