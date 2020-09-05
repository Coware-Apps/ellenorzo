import { Injectable } from "@angular/core";
import { evaluation } from "../_models/kreta-v2/student";
import { Evaluation } from "../_models/kreta-v3/evaluation";

export interface numWeight {
    numVal: number;
    weight: string;
}

@Injectable({
    providedIn: "root",
})
export class WeighedAvgCalcService {
    public sumOfWeighedGrades = 0;
    public weightSum = 0;
    constructor() {}

    average(evaluations: evaluation[]) {
        this.sumOfWeighedGrades = 0;
        this.weightSum = 0;
        for (let i = 0; i < evaluations.length; i++) {
            if (
                evaluations[i].Form == "Mark" &&
                evaluations[i].Type == "MidYear" &&
                evaluations[i].IsAtlagbaBeleszamit &&
                evaluations[i].NumberValue
            ) {
                this.sumOfWeighedGrades +=
                    evaluations[i].NumberValue * parseInt(evaluations[i].Weight.split("%")[0]);
                this.weightSum += parseInt(evaluations[i].Weight.split("%")[0]);
            }
        }
        return this.sumOfWeighedGrades / this.weightSum;
    }

    averageV3(evaluations: Evaluation[]) {
        this.sumOfWeighedGrades = 0;
        this.weightSum = 0;
        for (let i = 0; i < evaluations.length; i++) {
            if (
                evaluations[i].SzamErtek &&
                evaluations[i].SzamErtek != 0 &&
                evaluations[i].ErtekFajta?.Nev == "Osztalyzat" &&
                evaluations[i].Tipus.Nev == "evkozi_jegy_ertekeles"
            ) {
                const weight = evaluations[i].SulySzazalekErteke
                    ? evaluations[i].SulySzazalekErteke
                    : 100;
                this.sumOfWeighedGrades += evaluations[i].SzamErtek * weight;
                this.weightSum += weight;
            }
        }
        return this.sumOfWeighedGrades / this.weightSum;
    }

    averageNumWeight(data: numWeight[]) {
        this.sumOfWeighedGrades = 0;
        this.weightSum = 0;
        for (let i = 0; i < data.length; i++) {
            this.sumOfWeighedGrades += data[i].numVal * parseInt(data[i].weight.split("%")[0]);
            this.weightSum += parseInt(data[i].weight.split("%")[0]);
        }
        return this.sumOfWeighedGrades / this.weightSum;
    }
}
