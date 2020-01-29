import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AveragesPage } from './averages.page';

describe('AveragesPage', () => {
  let component: AveragesPage;
  let fixture: ComponentFixture<AveragesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AveragesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AveragesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
