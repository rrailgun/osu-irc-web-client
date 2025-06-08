import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IrcWebsocketService } from '../../service/irc-websocket.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loggingIn: boolean = false;

  constructor(private router: Router, private chatService: IrcWebsocketService) {
    this.chatService.connected$
      .pipe(filter(connected => connected))
      .subscribe(() => {
        // Redirect automatically to /chat once connected
        this.router.navigate(['/chat']);
      });
    this.chatService.connectionClosed
    .subscribe( res => {
      this.error = 'Unable to login'
      this.loggingIn = false;
    })
  }

  login() {
    this.chatService.connect(this.username,this.password);
    this.loggingIn = true;
  }
}
