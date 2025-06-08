import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { IRCWebSocketEventTypes } from '../models/irc-event-types';
import { IRCMessage, IRCMessageType } from '../models/message';
import { extractMPId } from '../util/bancho-bot-util';
import { playNotification } from '../util/audio-playing';


@Injectable({
  providedIn: 'root'
})
export class IrcWebsocketService implements OnDestroy {

  @Output() connectionClosed: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output() msgFromUnjoinedChannel: EventEmitter<string> = new EventEmitter<string>();
  @Output() leftChannelEvent: EventEmitter<string> = new EventEmitter<string>();
  loggedInUsername: string = '';

  private wsUrl: string = 'ws://localhost:3000'
  private socket!: WebSocket;

  private connectionStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public connected$: Observable<boolean> = this.connectionStatus.asObservable();

  private joinedChannels: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  public joinedChannels$: Observable<string[]> = this.joinedChannels.asObservable();

  private messageLog: BehaviorSubject<IRCMessage[]> = new BehaviorSubject<IRCMessage[]>([]);
  public messages$: Observable<IRCMessage[]> = this.messageLog.asObservable();
  public latestMessage$ = this.messageLog.pipe(
    map(messages => messages[messages.length - 1]),
    filter(m => !!m)
  );

  ngOnDestroy(): void {
    this.quit();
  }

  connect(username: string, password: string): void {
    if (this.socket) {
      this.socket.close();
    }
    this.loggedInUsername = username;
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {

      // Login to IRC
      this.send({
        type: IRCWebSocketEventTypes.CONNECT,
        username,
        password
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data)
        data.time = new Date()
        // On Connection (Initialize)
        switch (data.type) {
          case 'connected': {
            this.connectionStatus.next(true);
            break;
          }
          case 'privmsg': {
            if (this.loggedInUsername == data.target) this.msgFromUnjoinedChannel.emit(data.nick); // Emit PM to ensure channel tab is opened
            if (data.nick == 'BanchoBot') this.handleBanchoBotMsg(data.message);
            this.messageLog.next([...this.messageLog.getValue(), data])
            if (data.message.includes(` ${this.loggedInUsername} `)) playNotification();
            break;
          }
          case 'close': {
            this.connectionClosed.emit(true);
            break;
          }
        }
      } catch (err) {
        console.error('[WebSocket] Invalid JSON:', event.data);
      }
    };

    this.socket.onerror = (error) => console.error('[WebSocket] Error:', error);
  }

  private send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('sending msg', message)
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, cannot send message');
    }
  }

  joinChannel(channel: string): void {
    this.send({
      type: IRCWebSocketEventTypes.JOIN,
      channel
    });
    this.joinedChannels.next(this.joinedChannels.getValue().concat([channel]))
  }

  quit(reason: string = 'Goodbye'): void {
    this.send({
      type: IRCWebSocketEventTypes.QUIT,
      message: reason
    });
    this.disconnect();
  }

  partChannel(channel: string): void {
    this.send({
      type: IRCWebSocketEventTypes.PART,
      target: channel
    })
    this.leftChannelEvent.emit(channel);
  }

  sendMessage(channel: string, message: string) {
    let ircMsg = {
      nick: this.loggedInUsername,
      message: message.trim(),
      time: new Date(),
      type: 'privmsg' as IRCMessageType,
      from_server: false,
      ident: 'cho',
      hostname: 'ppy.sh',
      target: channel,
      tags: {}
    }
    if (ircMsg.message) {
      this.send({
        type: IRCWebSocketEventTypes.MESSAGE,
        target: channel,
        message: ircMsg.message
      })
      this.messageLog.next([...this.messageLog.getValue(), ircMsg])
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.connectionStatus.next(false)
    }
  }

  private handleBanchoBotMsg(msg: string) {
    if (msg.startsWith('Created the tournament match https://osu.ppy.sh/mp/')) {
      let mpId = extractMPId(msg);
      let mp_lobby_channel = `#mp_${mpId}`;
      this.msgFromUnjoinedChannel.emit(mp_lobby_channel);
      this.sendMessage(mp_lobby_channel, '!mp settings')
    }
  }

}
