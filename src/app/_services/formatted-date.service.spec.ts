import { TestBed } from '@angular/core/testing';

import { FormattedDateService } from './formatted-date.service';

describe('FormattedDateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FormattedDateService = TestBed.get(FormattedDateService);
    expect(service).toBeTruthy();
  });
});
