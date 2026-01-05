import { TestBed } from '@angular/core/testing';

import { WebsiteData } from './website-data';

describe('WebsiteData', () => {
  let service: WebsiteData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebsiteData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
