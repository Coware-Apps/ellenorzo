import { Injectable } from '@angular/core';
import { evaluation } from '../_models/student';


export interface numWeight {
  numVal: number;
  weight: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeighedAvgCalcService {

  public sumOfWeighedGrades = 0;
  public weightSum = 0;
  constructor() { }

  average(evaluations: evaluation[]) {
    this.sumOfWeighedGrades = 0;
    this.weightSum = 0;
    for (let i = 0; i < evaluations.length; i++) {
      if (evaluations[i].Form == "Mark" && evaluations[i].Type == "MidYear" && evaluations[i].IsAtlagbaBeleszamit && evaluations[i].NumberValue) {
        this.sumOfWeighedGrades += evaluations[i].NumberValue * (parseInt(evaluations[i].Weight.split("%")[0]));
        this.weightSum += parseInt(evaluations[i].Weight.split("%")[0]);
      }
    }
    return this.sumOfWeighedGrades / this.weightSum;
  }

  averageNumWeight(data: numWeight[]) {
    this.sumOfWeighedGrades = 0;
    this.weightSum = 0;
    for (let i = 0; i < data.length; i++) {
      this.sumOfWeighedGrades += data[i].numVal * (parseInt(data[i].weight.split("%")[0]));
      this.weightSum += parseInt(data[i].weight.split("%")[0]);
    }
    return this.sumOfWeighedGrades / this.weightSum;
  }
}
