import { TestBed } from '@angular/core/testing';

import { AntiSpamService } from './anti-spam.service';

describe('AntiSpamService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AntiSpamService = TestBed.get(AntiSpamService);
    expect(service).toBeTruthy();
  });
});
