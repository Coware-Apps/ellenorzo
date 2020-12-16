import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Homework } from "src/app/_models/kreta-v3/homework";
import { IonSlides, MenuController } from "@ionic/angular";
import { DataService } from "src/app/_services/data.service";
import { PromptService } from "src/app/_services/prompt.service";
import { UserManagerService } from "src/app/_services/user-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { Lesson } from "../_models/kreta-v3/lesson";
import { JwtDecodeHelper } from "../_helpers/jwt-decode-helper";
import { FirebaseService } from "../_services/firebase.service";
import { AppService } from "../_services/app.service";
import { FileOpener } from "@ionic-native/file-opener/ngx";

@Component({
    selector: "app-timetable-homeworks",
    templateUrl: "./timetable-homeworks.page.html",
    styleUrls: ["./timetable-homeworks.page.scss"],
})
export class TimetableHomeworksPage implements OnInit {
    @ViewChild("slides", { static: true }) slides: IonSlides;

    public focused: number;
    public sans: boolean;
    public homeworkText: string = "";
    public lesson: Lesson;
    public homeworks: Homework[];

    constructor(
        public app: AppService,
        private actRoute: ActivatedRoute,
        private userManager: UserManagerService,
        private data: DataService,
        private firebase: FirebaseService,
        private prompt: PromptService,
        private menuCtrl: MenuController,
        private translator: TranslateService,
        private jwtHelper: JwtDecodeHelper,
        private FileOpener: FileOpener,
    ) {
        this.focused = 0;
        this.sans = true;
    }

    async ngOnInit() {
        this.menuCtrl.enable(false);
        this.actRoute.queryParams.subscribe(async params => {
            let id = params["id"];

            this.lesson = this.data.getData(id);

            if (this.lesson.HaziFeladatUid) {
                this.homeworks = await this.userManager.currentUser.getHomeworksV3(
                    null,
                    null,
                    "uid",
                    +this.lesson.HaziFeladatUid
                );
            }

            this.homeworks.forEach(hw => {
                if (hw.IsMegoldva) this.lesson.IsHaziFeladatMegoldva = true;
            });
            this.sans = false;
        });
        this.firebase.setScreenName("timetable-homeworks");
    }

    isStudent() {
        return (
            this.jwtHelper.decodeToken(this.userManager.currentUser.tokens.access_token).role ==
            "Student"
        );
    }

    ionViewWillEnter() {
        this.slides.update();
    }

    async ionViewWillLeave() {
        await this.menuCtrl.enable(true);
    }
    showInfo(homework: Homework) {
        this.prompt.homeworkV3Alert(homework);
    }
    async getData(index: number) {
        if ((await this.slides.getActiveIndex()) == this.focused) {
            //the segment's ionChange event wasn't fired by a slide moving
            this.focused = index;
            this.slides.slideTo(index);
        }
    }

    async ionSlideWillChange() {
        this.focused = await this.slides.getActiveIndex();
    }

    getHomeworkText(t: string) {
        return t.replace(/\n/g, "<br>").replace(/<br\/>/g, "<br>");
    }

    async getFile(id: number, fullName: string, homeworkId: string) {
        let attachment = this.homeworks.find(hw => hw.Uid == homeworkId).Csatolmanyok.find(x => x.Uid == id);
        attachment.loading = true;

        const fileEntry = await this.userManager.currentUser.getHomeworkAttachment(
            id,
            fullName
        );

        this.firebase.logEvent("open_message_attachment");

        fileEntry.file(file => {
            this.FileOpener.open(fileEntry.nativeURL, file.type).catch(error => {
                console.error("Couldnt open file", error);

                this.prompt.showDetailedToast(
                    this.translator.instant("pages.read-message.cannotOpenFile.title"),
                    this.translator.instant("pages.read-message.cannotOpenFile.text"),
                    3000
                );

                throw error;
            });
        });
        attachment.loading = false;
    }

    // async addHomework() {
    //     await this.userManager.currentUser.clearUserCacheByCategory("lesson");
    //     let loading = await this.loadingCtrl.create({
    //         message: this.translator.instant("pages.timetable-homeworks.loadingText"),
    //         spinner: "crescent",
    //     });
    //     loading.present();

    //     try {
    //         if (this.homeworkText != null && this.homeworkText != "") {
    //             //"2020. 01. 17. 0:00:00" TODO
    //             let sTBefore = this.lesson.StartTime;
    //             let StartTime = this.fDate.formatDateKRETA(new Date(this.lesson.StartTime));

    //             let lesson = {
    //                 teacherHomeworkId: this.lesson.TeacherHomeworkId,
    //                 Subject: this.lesson.Subject,
    //                 IsTanuloHaziFeladatEnabled: this.lesson.IsTanuloHaziFeladatEnabled,
    //                 lessonId: this.lesson.LessonId,
    //                 CalendarOraType: this.lesson.CalendarOraType,
    //                 StartTime: StartTime,
    //             };

    //             console.log("homeworkText", this.homeworkText);

    //             await this.userManager.currentUser.addStudentHomework(lesson, this.homeworkText);

    //             this.prompt.toast(
    //                 this.translator.instant("pages.timetable-homeworks.successfullyAddedToastText"),
    //                 true
    //             );
    //             this.homeworkText = null;
    //             this.sans = true;

    //             this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(
    //                 null,
    //                 null,
    //                 +this.lesson.TeacherHomeworkId
    //             );

    //             this.sans = false;
    //         } else {
    //             this.prompt.missingTextAlert(
    //                 this.translator.instant("pages.timetable-homeworks.checkFieldAlertText")
    //             );
    //         }
    //     } catch (error) {
    //         throw error;
    //     } finally {
    //         loading.dismiss();
    //     }
    // }

    // async deleteHomework(id: number) {
    //     let loading = await this.loadingCtrl.create({
    //         message: this.translator.instant("pages.timetable-homeworks.loadingText"),
    //         spinner: "crescent",
    //     });
    //     loading.present();
    //     try {
    //         await this.userManager.currentUser.deleteStudentHomework(id);
    //         this.prompt.toast(
    //             this.translator.instant("pages.timetable-homeworks.successfullyDeletedToastText"),
    //             true
    //         );
    //         this.sans = true;
    //         this.studentHomeworks = await this.userManager.currentUser.getStudentHomeworks(
    //             null,
    //             null,
    //             +this.lesson.TeacherHomeworkId
    //         );
    //         this.sans = false;
    //     } catch (error) {
    //         console.error(error);
    //         throw error;
    //     } finally {
    //         loading.dismiss();
    //     }
    // }

    async changeState() {
        await this.userManager.currentUser.changeHomeworkStateV3(
            +this.lesson.HaziFeladatUid,
            !this.homeworks[0].IsMegoldva
        );
        this.homeworks[0].IsMegoldva = !this.homeworks[0].IsMegoldva;
    }

    showCompletedBar() {
        return (
            this.jwtHelper.decodeToken(this.userManager.currentUser.v3Tokens?.access_token)?.role ==
            "Tanulo"
        );
    }
}
