import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { AverageGraphsPage } from "./average-graphs.page";

describe("AverageGraphsPage", () => {
    let component: AverageGraphsPage;
    let fixture: ComponentFixture<AverageGraphsPage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AverageGraphsPage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(AverageGraphsPage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
