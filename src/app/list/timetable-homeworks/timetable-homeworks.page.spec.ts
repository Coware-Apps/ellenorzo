import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TimetableHomeworksPage } from './timetable-homeworks.page';

describe('TimetableHomeworksPage', () => {
  let component: TimetableHomeworksPage;
  let fixture: ComponentFixture<TimetableHomeworksPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimetableHomeworksPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TimetableHomeworksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
