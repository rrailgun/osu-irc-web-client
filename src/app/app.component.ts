import { Component } from '@angular/core';
import { IrcWebsocketService } from './service/irc-websocket.service';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(public chatService: IrcWebsocketService) {}

}
