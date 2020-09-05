import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { AbsenceComponent } from "./absence.component";

describe("AbsenceComponent", () => {
    let component: AbsenceComponent;
    let fixture: ComponentFixture<AbsenceComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AbsenceComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(AbsenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
