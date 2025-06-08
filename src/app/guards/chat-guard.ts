import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { IrcWebsocketService } from '../service/irc-websocket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatGuard implements CanActivate {
  constructor(private chatService: IrcWebsocketService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.chatService.connected$.pipe(
      tap(connected => {
        if (!connected) {
          this.router.navigate(['']); // redirect if NOT connected
        }
      }),
      map(connected => connected)
    );
  }
}
