import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { AbsencesPage } from "./absences.page";

describe("AbsencesPage", () => {
    let component: AbsencesPage;
    let fixture: ComponentFixture<AbsencesPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AbsencesPage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(AbsencesPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
