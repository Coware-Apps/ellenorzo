import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { EvaluationComponent } from "./evaluation.component";

describe("EvaluationComponent", () => {
    let component: EvaluationComponent;
    let fixture: ComponentFixture<EvaluationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [EvaluationComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(EvaluationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
