import { TestBed } from '@angular/core/testing';
import { IrcWebsocketService } from './irc-websocket.service';


describe('IrcServiceService', () => {
  let service: IrcWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IrcWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
