import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { IrcWebsocketService } from '../../service/irc-websocket.service';
import { filter } from 'rxjs';
import { IRCMessage } from '../../models/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface LobbyPlayerInfo {
  mods: string[];
  name: string;
  ready?: string;
  teamColor?: string;
}

@Component({
  selector: 'app-mp-lobby-info',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTableModule, NzTagModule, NzGridModule, NzIconModule],
  templateUrl: './mp-lobby-info.component.html',
  styleUrl: './mp-lobby-info.component.scss'
})
export class MpLobbyInfoComponent implements OnInit {
  @Input() matchID: string = '';
  lobbyName: string = '';
  players: (LobbyPlayerInfo | null)[] = new Array(16).fill(null);
  slots = Array.from({ length: 16 }, (_, i) => i + 1); // Use to iterate over 16 slots
  beatmap: { name: string, link: string } = { name: 'None', link: '' };
  matchSettings: { mode: string, winCon: string } = { mode: '', winCon: '' }
  globalMods: string[] = [];

  private chatService: IrcWebsocketService = inject(IrcWebsocketService);
  messageHandlers = [
    {
      pattern: /Room name:\s*(.+?),\s*History:\s*https:\/\/osu\.ppy\.sh\/mp\/\d+/,
      handler: (message: string) => {
        this.lobbyName = message.match(/Room name:\s*(.+?),\s*History:\s*https:\/\/osu\.ppy\.sh\/mp\/\d+/)![1];
      },
    },
    {
      pattern: /Room name updated to "([^"]+)"/,
      handler: (message: string) => {
        this.lobbyName = message.match(/Room name updated to "([^"]+)"/)![1];
      }
    },
    {
      pattern: /(https:\/\/osu\.ppy\.sh\/b\/\d+)\s+(.*)$/,
      handler: (message: string) => {
        this.beatmap = this.handleBeatmapSetting(message)!;
      },
    },
    {
      pattern: /^Slot\s+(\d{1,2})\s+(Not Ready|Ready|No Map)\s+https:\/\/osu\.ppy\.sh\/u\/\d+\s+(.+?)\s*(?:\[\s*Team\s+(Red|Blue)(?:\s*\/\s*([^\]]+))?\s*|\[\s*([^\]]+)\s*)?\]?\s*$/i,
      handler: (message: string) => {
        this.handlePlayerUpdate(message);
      },
    },
    {
      pattern: /^(.+)\s+joined in slot\s+(\d+)(?:\s+for team\s+(red|blue))?\./i,
      handler: (message: string) => {
        this.handlePlayerJoined(message);
      },
    },
    {
      pattern: /^(.+)\s+moved to slot\s+(\d+)$/i,
      handler: (message: string) => {
        this.handlePlayerMoved(message);
      },
    },
    {
      pattern: /^(.+)\sleft the game\.$/,
      handler: (message: string) => {
        this.handlePlayerLeft(message);
      },
    },
    {
      pattern: /^(.+)\s+changed to\s+(Red|Blue)$/,
      handler: (message: string) => {
        this.handlePlayerChangeColor(message);
      },
    },
    {
      pattern: /^Active mods:\s*(.*)$/,
      handler: (message: string) => {
        this.globalMods = this.getActiveMods(message);
      },
    },
    {
      pattern: /^Enabled\s+(.+?)(?:,\s*disabled.*)?$/i,
      handler: (message: string) => {
        this.globalMods = this.handleModChange(message);
      },
    },
    {
      pattern: /Team mode:\s*(\w+),\s*Win condition:\s*(\w+)/,
      handler: (message: string) => {
        this.matchSettings = this.getTeamModeAndWinCon(message)!;
      },
    },
    {
      pattern: /Changed match settings to \d+ slots,\s*(\w+),\s*(\w+)/,
      handler: (message: string) => {
        this.matchSettings = this.handleTeamModeAndWinConChange(message)!;
      },
    },
    {
      pattern: /, disabled FreeMod/,
      handler: () => {
        this.globalMods = [];
        this.removeModsFromPlayers();
      },
    },
    // Hacky solution needs to be replaced
    {
      pattern: /^All players are ready$/,
      handler: () => {
        this.players.forEach(player => {
          if (player !== null) player.ready = 'Ready';
        });
      },
    },
  ];


  ngOnInit(): void {
    this.chatService.latestMessage$
      .pipe(filter((newMsg: IRCMessage) => (newMsg.target === '#mp_' + this.matchID)))
      .subscribe(newMsg => {
        let message = newMsg.message;
        this.processMessage(message);
      })
  }

  processMessage(message: string) {
    for (const { pattern, handler } of this.messageHandlers) {
      if (pattern.test(message)) {
        handler.call(this, message);
        break;
      }
    }
  }

  refreshLobby() {
    this.chatService.sendMessage('#mp_' + this.matchID, '!mp settings');
  }

  getRoomName(message: string): string {
    let match = message.match(/Room name:\s*(.+?),\s*History:\s*https:\/\/osu\.ppy\.sh\/mp\/\d+/);
    return match ? match[1] : "";
  }

  private validSlot(slot: number) {
    return slot >= 1 || slot <= 16
  }

  handlePlayerJoined(message: string) {
    let match = message.match(/^(.+)\s+joined in slot\s+(\d+)(?:\s+for team\s+(red|blue))?\./i);
    if (!match) return;
    let name = match[1];
    let slot = Number(match[2]);
    let teamColor = match[3] ? match[3][0].toUpperCase() + match[3].slice(1) : undefined;
    if (!this.validSlot(slot)) return;

    this.players[slot - 1] = { name, mods: [], teamColor };
  }

  handlePlayerMoved(message: string) {
    let match = message.match(/^(.+)\s+moved to slot\s+(\d+)$/i);
    if (!match) return;
    let name = match[1];
    let newSlot = Number(match[2]);
    if (!this.validSlot(newSlot)) return;

    let currentIndex = this.players.findIndex(
      (player) => player?.name === name
    );
    if (currentIndex === -1) return;

    this.players[newSlot - 1] = this.players[currentIndex];
    this.players[currentIndex] = null;
  }

  handlePlayerChangeColor(message: string) {
    let match = message.match(/^(\S+)\s+changed to\s+(Red|Blue)$/);
    if (!match) return;
    let name = match[1];
    let team = match[2];

    let currentIndex = this.players.findIndex(
      (player) => player?.name === name
    );
    if (currentIndex === -1) return;
    this.players[currentIndex]!.teamColor = team;

  }

  handlePlayerUpdate(message: string) {
    let match = message.match(/^Slot\s+(\d{1,2})\s+(Not Ready|Ready|No Map)\s+https:\/\/osu\.ppy\.sh\/u\/\d+\s+(.+?)\s*(?:\[\s*Team\s+(Red|Blue)(?:\s*\/\s*([^\]]+))?\s*|\[\s*([^\]]+)\s*)?\]?\s*$/i);
    if (match) {
      let slot = Number(match[1]);
      let ready = match[2];
      let name = match[3];
      let teamColor = match[4];
      let modString = match[5] || match[6] || '';
      let mods = modString.split(',').map(m => m.trim())
      if (!this.validSlot(slot)) return;

      this.players[slot - 1] = { name, mods, ready, teamColor };
      return;
    }
  }

  handlePlayerLeft(message: string) {
    let match = message.match(/^(.+)\sleft the game\.$/);
    if (!match) return;

    let username = match[1];

    this.players = this.players.map(player => {
      if (player && player.name === username) {
        return null;
      }
      return player;
    });
  }

  handleBeatmapSetting(message: string): { name: string, link: string } | undefined {
    let match = message.match(/(https:\/\/osu\.ppy\.sh\/b\/\d+)\s+(.*)$/);
    if (!match) return;
    let link = match[1];
    let name = match[2];
    return { name, link }
  }

  getActiveMods(message: string) {
    let match = message.match(/^Active mods:\s*(.*)$/);
    if (!match) return [];
    return match[1].split(',').map(mod => mod.trim());
  }

  handleModChange(message: string) {
    let match = message.match(/^Enabled\s+(.+?)(?:,\s*disabled.*)?$/i);
    if (!match) return [];
    return match[1].split(',').map(m => m.trim()).filter(Boolean);
  }

  getTeamModeAndWinCon(message: string) {
    let match = message.match(/Team mode:\s*(\w+),\s*Win condition:\s*(\w+)/);
    if (!match) return;
    let mode = match[1];
    let winCon = match[2];
    if (!mode.includes('Team')) this.removeTeamColorsFromPlayers()
    return { mode, winCon };
  }

  handleTeamModeAndWinConChange(message: string) {
    let match = message.match(/Changed match settings to \d+ slots,\s*(\w+),\s*(\w+)/);
    if (!match) return;
    let mode = match[1];
    let winCon = match[2];
    if (!mode.includes('Team')) this.removeTeamColorsFromPlayers()
    return { mode, winCon };
  }

  private removeTeamColorsFromPlayers() {
    this.players = this.players.map(player => {
      if (player) {
        player.teamColor = undefined;
      }
      return player;
    });
  }

  private removeModsFromPlayers() {
    this.players = this.players.map(player => {
      if (player) {
        player.mods = [];
      }
      return player;
    });
  }

}
