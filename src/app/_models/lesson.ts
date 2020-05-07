export class Lesson {
    //subj
    public Subject: string;
    //which lesson?
    public Count: number;
    //startT
    public StartTime: Date;
    //endt
    public EndTime: Date;
    //class/group name
    public ClassGroup: string;
    //classrom, sometimes it works
    public ClassRoom: string;
    //teacher
    public Teacher: string;
    //dep. teacher
    public DeputyTeacher: string;
    //'Elmarad' etc
    public StateName: string;
    public State: string;

    //optional
    public LessonId?: number;

    //for timetable
    DayOfWeek?: number;

    //homeworks
    IsTanuloHaziFeladatEnabled?: boolean;
    TeacherHomeworkId?: string;
    Homework?: string;
    CalendarOraType?: string;
    Theme?: string;
    IsHaziFeladatMegoldva: boolean;
}
