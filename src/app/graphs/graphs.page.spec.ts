import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { GraphsPage } from './graphs.page';

describe('GraphsPage', () => {
  let component: GraphsPage;
  let fixture: ComponentFixture<GraphsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(GraphsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
