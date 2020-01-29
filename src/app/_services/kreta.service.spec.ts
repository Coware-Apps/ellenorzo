import { TestBed } from '@angular/core/testing';

import { KretaService } from './kreta.service';

describe('KretaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KretaService = TestBed.get(KretaService);
    expect(service).toBeTruthy();
  });
});
