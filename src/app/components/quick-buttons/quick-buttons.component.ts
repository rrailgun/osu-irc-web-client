import { Component, inject, Input } from '@angular/core';
import { IrcWebsocketService } from '../../service/irc-websocket.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quick-buttons',
  imports: [
    NzButtonModule,
    FormsModule,
    CommonModule
  ],
  standalone: true,
  templateUrl: './quick-buttons.component.html',
  styleUrl: './quick-buttons.component.scss'
})
export class QuickButtonsComponent {
  @Input() channel: string | undefined;

  private chatService: IrcWebsocketService = inject(IrcWebsocketService)

  quickButtons: {
    label: string;
    command: string;
    requiresInput?: boolean;
    inputValue?: number;
  }[] = [
    {
      label: 'Close Lobby',
      command: '!mp close'
    },
    {
      label: 'Timer',
      command: '!mp timer',
      requiresInput: true,
      inputValue: 120
    },
    {
      label: 'Start Map',
      command: '!mp start',
      requiresInput: true,
      inputValue: 10
    }
  ];

  sendCommand(button: typeof this.quickButtons[0]) {
    if (!this.channel || (button.requiresInput && !button.inputValue)) return;

    const command = button.requiresInput
      ? `${button.command} ${button.inputValue ?? ''}`.trim()
      : button.command;

    this.chatService.sendMessage(this.channel, command);
  }
}

