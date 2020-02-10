import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UserAgentPage } from './user-agent.page';

describe('UserAgentPage', () => {
  let component: UserAgentPage;
  let fixture: ComponentFixture<UserAgentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserAgentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserAgentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
