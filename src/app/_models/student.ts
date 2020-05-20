import { Injectable } from "@angular/core";

export interface CollapsibleStudent {
    index: number;
    header: string;
    data: any[];
    firstEntryCreatingTime: number;
    showEvaluations: boolean;
    showAbsences: boolean;
    showNotes: boolean;
    showAll: boolean;
}

export interface evaluation {
    //don't use this for id
    EvaluationId: number;
    //This can be "Mark" which is a regular grade or "Text" or "Percent"
    Form: string;
    FormName: string;
    //HalfYear/MidYear/EndYear
    Type: string;
    //subject
    Subject: string;
    //What in tarnation?
    IsAtlagbaBeleszamit: boolean;
    //description
    Mode: string;
    //100%
    Weight: string;
    //grade
    NumberValue: number;
    //teacher
    Teacher: string;
    //difference between Date and Creatingtime, (creatingtime has time and date, Date has only date but why?)
    //2019-06-07T00:00:00
    Date: string;
    //2019-06-07T08:00:00.000
    CreatingTime: string;
    //Jelleg{}, Jellegnev, Ertekfajta are all useless, why?

    //optional
    //If the Form is 'Text'
    Value?: string;
    Theme?: string;
    TypeName?: string;

    Jelleg?: Jelleg;
}
export interface SubjectAverage {
    Subject: string;
    Value: number;
    ClassValue: number;
    Difference: number;
}
export interface Absence {
    AbsenceId: number;
    //"Hiányzás"
    TypeName: string;
    //"Absence"
    Type: string;
    //"Tanórai mulasztás"
    ModeName: string;
    Subject: string;
    DelayTimeMinutes: number;
    Teacher: string;
    LessonStartTime: string;
    /*"UnJustified"/"BeJustified"/"Justified"*/
    JustificationState: string;
    JustificationStateName: string;
    /*when have the parents seen it? if they haven't, it's null*/
    SeenByTutelaryUTC: string;

    JustificationType?: string;
    JustificationTypeName?: string;
}
export interface Note {
    NoteId: number;
    /*"Elektronikus üzenet"*/
    Type: string;
    Title: string;
    Content: string;
    //When have the parents seen it?
    SeenByTutelaryUTC: string;
    Teacher: string;
    //Again, why are there 2 and what's the difference
    Date: string;
    CreatingTime: string;

    //not from the server
    opened?: boolean;
}
export interface FormTeacherTemplate {
    TeacherId: number;
    Name: string;
    Email: string;
    PhoneNumber: string;
}
export interface Tutelary {
    TutelaryId: number;
    Name: string;
    Email: string;
    PhoneNumber: string;
}
export interface AddressData {
    Address: string;
}
export interface Jelleg {
    Id: number;
    Nev: string;
    Leiras: string;
}

@Injectable()
export class Student {
    //studentID
    public StudentId: number;
    //name
    public Name: string;
    public NameOfBirth?: string;
    public PlaceOfBirth?: string;
    public MothersName?: string;
    public AddressDataList?: AddressData[];
    public DateOfBirthUtc?: Date;
    //inst. name
    public InstituteName: string;
    //evaluations
    public Evaluations: evaluation[];
    //averages by subject
    public SubjectAverages: SubjectAverage[];
    public Absences: Absence[];
    public Notes: Note[];
    public FormTeacher: FormTeacherTemplate;
    public Tutelaries: Tutelary[];

    public SchoolYearId?: number;
}
