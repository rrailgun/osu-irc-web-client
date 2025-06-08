import { Component, ViewChild } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IrcWebsocketService } from '../../service/irc-websocket.service';
import { ChannelModalComponent } from '../channel-modal/channel-modal.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';

@Component({
  selector: 'app-chat-dashboard',
  imports: [ChatWindowComponent, NzTabsModule, NzIconModule, ChannelModalComponent],
  templateUrl: './chat-dashboard.component.html',
  styleUrl: './chat-dashboard.component.scss'
})
export class ChatDashboard {
  @ViewChild('modal') modal!: ChannelModalComponent;

  private keyListener = (e: KeyboardEvent) => this.onKeydown(e);

  title = 'osu-tourney-irc';
  selectedIndex = 0;
  ircChannels: Set<string> = new Set(['BanchoBot']); //enforce unique channels

  constructor(public chatService: IrcWebsocketService) {
    this.chatService.msgFromUnjoinedChannel.subscribe(newChannel => {
      this.newChannelEvent(newChannel);
    })
    this.chatService.leftChannelEvent.subscribe(channelToLeave => {
      this.ircChannels.delete(channelToLeave);
    })
  }

  ngOnInit() {
    window.addEventListener('keydown', this.keyListener);
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.keyListener);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.shiftKey && event.key === 'Tab') {
      event.preventDefault(); // avoid browser tab switch
      this.nextTab();
    }
  }

  nextTab() {
    const totalTabs = [...this.ircChannels].length;
    this.selectedIndex = (this.selectedIndex + 1) % totalTabs;
  }

  closeChannel({ index }: { index: number }) {
    this.chatService.partChannel([...this.ircChannels][index]);
  }

  private newChannelEvent(newChannel: string): void {
    if (!this.ircChannels.has(newChannel)) {
      this.ircChannels.add(newChannel);
      this.selectedIndex = [...this.ircChannels].length - 1;
    }
  }

  joinChannelRequest(newChannel: string) {
    this.newChannelEvent(newChannel);
  }

  openModal(): void {
    this.modal.show();
  }
}
