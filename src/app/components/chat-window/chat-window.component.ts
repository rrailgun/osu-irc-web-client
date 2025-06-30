import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { User } from '../../models/user';
import { IrcWebsocketService } from '../../service/irc-websocket.service';
import { IRCMessage } from '../../models/message';
import { filter } from 'rxjs';
import { MpLobbyInfoComponent } from '../mp-lobby-info/mp-lobby-info.component';
import { MatchInfoComponent } from "../match-info/match-info.component";

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzListModule,
    NzInputModule,
    NzButtonModule,
    NzAvatarModule,
    MpLobbyInfoComponent,
    MatchInfoComponent
  ],
  providers: [
    DatePipe
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit {

  private chatService: IrcWebsocketService = inject(IrcWebsocketService)
  private datePipe: DatePipe = inject(DatePipe);
  @ViewChild('scrollContainer', { read: ElementRef }) scrollContainer!: ElementRef;
  @Input() channel: string | undefined;
  messages: IRCMessage[] = [];
  newMessage: string = '';
  disableInput: boolean = true;

  ngOnInit(): void {
    this.chatService.connected$
      .pipe(filter(res => res)) //only run callback if true
      .subscribe(res => {
        this.disableInput = false;
        if (this.channel?.charAt(0) === '#') this.chatService.joinChannel(this.channel) //Join a channel if #, otherwise its a PRIV MSG
      })
    this.chatService.latestMessage$
      .pipe(filter(newMsg => (newMsg.target == this.channel && this.channel != this.chatService.loggedInUsername) || (newMsg.target == this.chatService.loggedInUsername && newMsg.nick == this.channel)))
      .subscribe(newMsg => {
        this.messages.push(newMsg);
        this.scrollToBottom()
        if (newMsg.nick === 'BanchoBot' && newMsg.message == 'Closed the match') this.disableInput = true;
      })
  }

  scrollToBottom() {
    setTimeout(() => {
      if (!this.scrollContainer?.nativeElement) return;
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }, 5); //bruh
  }

  sendMessage(): void {
    const message = this.newMessage.trim();
    if (message) {
      this.chatService.sendMessage(this.channel!, message);
      this.newMessage = '';
    }
  }

  shouldShowProfile(i: number): boolean {
    return i === 0 || this.messages[i - 1].nick !== this.messages[i].nick;
  }

  // Component method to group consecutive messages by nick
  get groupedMessages() {
    const groups = [];
    let currentGroup = null;

    for (const msg of this.messages) {
      if (!currentGroup || currentGroup.nick !== msg.nick) {
        currentGroup = { nick: msg.nick, messages: new Array() };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }
    return groups;
  }

  downloadChatLog(filename: string) {
    let lines = this.messages.map(msg => {
      let timeStr = this.datePipe.transform(msg.time, 'mediumTime') || '';
      return `[${timeStr}] ${msg.nick}: ${msg.message}`;
    });

    let blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    let url = window.URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.log`
    a.click();

    window.URL.revokeObjectURL(url);
  }


}
