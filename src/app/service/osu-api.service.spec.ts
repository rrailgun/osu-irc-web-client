import { TestBed } from '@angular/core/testing';

import { OsuApiService } from './osu-api.service';

describe('OsuApiService', () => {
  let service: OsuApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OsuApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
