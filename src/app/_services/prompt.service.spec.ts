import { TestBed } from '@angular/core/testing';

import { PromptService } from './prompt.service';

describe('PromptService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PromptService = TestBed.get(PromptService);
    expect(service).toBeTruthy();
  });
});
