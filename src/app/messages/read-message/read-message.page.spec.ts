import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { ReadMessagePage } from "./read-message.page";

describe("ReadMessagePage", () => {
    let component: ReadMessagePage;
    let fixture: ComponentFixture<ReadMessagePage>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ReadMessagePage],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(ReadMessagePage);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
