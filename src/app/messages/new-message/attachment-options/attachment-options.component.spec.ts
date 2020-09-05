import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { AttachmentOptionsComponent } from "./attachment-options.component";

describe("AttachmentOptionsComponent", () => {
    let component: AttachmentOptionsComponent;
    let fixture: ComponentFixture<AttachmentOptionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AttachmentOptionsComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(AttachmentOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
