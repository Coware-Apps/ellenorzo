import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MonthlyAveragePage } from './monthly-average.page';

describe('MonthlyAveragePage', () => {
  let component: MonthlyAveragePage;
  let fixture: ComponentFixture<MonthlyAveragePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonthlyAveragePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyAveragePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
