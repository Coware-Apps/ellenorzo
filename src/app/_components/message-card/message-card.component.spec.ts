import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";

import { MessageCardComponent } from "./message-card.component";

describe("MessageCardComponent", () => {
    let component: MessageCardComponent;
    let fixture: ComponentFixture<MessageCardComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [MessageCardComponent],
            imports: [IonicModule.forRoot()],
        }).compileComponents();

        fixture = TestBed.createComponent(MessageCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
