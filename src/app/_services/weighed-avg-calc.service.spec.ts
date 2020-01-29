import { TestBed } from '@angular/core/testing';

import { WeighedAvgCalcService } from './weighed-avg-calc.service';

describe('WeighedAvgCalcService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WeighedAvgCalcService = TestBed.get(WeighedAvgCalcService);
    expect(service).toBeTruthy();
  });
});
