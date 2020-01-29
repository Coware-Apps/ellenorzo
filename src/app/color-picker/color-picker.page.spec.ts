import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ColorPickerPage } from './color-picker.page';

describe('ColorPickerPage', () => {
  let component: ColorPickerPage;
  let fixture: ComponentFixture<ColorPickerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColorPickerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorPickerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
