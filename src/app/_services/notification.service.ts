import { Injectable } from "@angular/core";
import { FormattedDateService } from "./formatted-date.service";
import { LocalNotifications, ILocalNotification } from "@ionic-native/local-notifications/ngx";
import { Lesson } from "../_models/kreta-v3/lesson";
import { TranslateService } from "@ngx-translate/core";

@Injectable({
    providedIn: "root",
})
export class NotificationService {
    constructor(
        private fDate: FormattedDateService,
        private localNotifications: LocalNotifications,
        private translator: TranslateService
    ) {}

    public async onInit() {
        this.subscribeToLocalNotifications();
    }

    public subscribeToLocalNotifications() {
        // Can inject it into the app initializer this way...
        // this.localNotifications.on("click").subscribe(res => {
        //   if (res.data) {
        //     this.router.navigate([res.data.navigateToUrl]);
        //   }
        // });
    }

    public setLocalNotifications(lessons: Lesson[]) {
        // console.groupCollapsed('[SCHEDULED NOTIFICATIONS]');
        let toBeScheduled: ILocalNotification[] = [];
        let notificationTexts = this.translator.instant("services.notification");
        lessons.forEach(lesson => {
            if (lesson.Allapot?.Nev == "TanevRendjeEsemeny") return;

            //10 minutes before the lesson
            let triggerTime = new Date(
                this.fDate.returnCorrectTime(new Date(lesson.KezdetIdopont)).getTime() - 600000
            );
            let stateNameIf =
                lesson.Allapot?.Nev == "Elmaradt"
                    ? ` (${notificationTexts["canceledText"]})`
                    : lesson.HelyettesTanarNeve && lesson.HelyettesTanarNeve != ""
                    ? ` (${notificationTexts["substitutionText"]})`
                    : "";

            //only scheduling notifications that are in the future
            if (new Date(triggerTime).valueOf() > new Date().valueOf()) {
                let notificationOpts: ILocalNotification = {
                    id: +lesson.Uid?.split(",")[0],
                    title:
                        `${notificationTexts["nextLessonText"]}: ` +
                        lesson.Tantargy?.Nev +
                        stateNameIf,
                    text:
                        `${notificationTexts["timeName"]}: ` +
                        this.fDate.getTimetableTime(
                            new Date(lesson.KezdetIdopont),
                            new Date(lesson.VegIdopont)
                        ) +
                        " - " +
                        lesson.TeremNeve,
                    foreground: true,
                    group: "timetable",
                    smallIcon: "res://ic_notification_small",
                    timeoutAfter: 900000,
                    data: {
                        navigateToUrl: "list",
                    },
                    trigger: {
                        at: triggerTime,
                    },
                };

                toBeScheduled.push(notificationOpts);
                // console.log(
                //     `[NOTIFICATION SCHEDULED] ${notificationOpts.title} (${
                //         notificationOpts.id
                //     }) - ${new Date(notificationOpts.trigger.at)}`,
                //     notificationOpts
                // );
            }
        });

        toBeScheduled = toBeScheduled.sort(
            (a, b) => b.trigger.at.valueOf() - a.trigger.at.valueOf()
        );
        this.localNotifications.schedule(toBeScheduled);

        // console.groupEnd();
    }

    public async cancelAllNotifications() {
        await this.localNotifications.cancelAll();
    }

    public async getAllScheduledIds(): Promise<number[]> {
        //This would be ideal, but it crashes the plugin
        //console.log(await this.localNotifications.getAllScheduled());
        return await this.localNotifications.getScheduledIds();
    }

    public async getAllNonDismissed(): Promise<ILocalNotification[]> {
        return await this.localNotifications.getAll();
    }
}
