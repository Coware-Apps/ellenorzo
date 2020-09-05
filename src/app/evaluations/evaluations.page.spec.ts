import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { EvaluationsPage } from "./evaluations.page";

describe("EvaluationsPage", () => {
    let component: EvaluationsPage;
    let fixture: ComponentFixture<EvaluationsPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EvaluationsPage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(EvaluationsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
