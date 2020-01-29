import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HomeworksPage } from './homeworks.page';

describe('HomeworksPage', () => {
  let component: HomeworksPage;
  let fixture: ComponentFixture<HomeworksPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeworksPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeworksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
