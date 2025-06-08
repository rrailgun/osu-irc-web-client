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
  matchSettings: {mode: string, winCon: string} = {mode: '', winCon: ''}
  globalMods: string[] = [];

  private chatService: IrcWebsocketService = inject(IrcWebsocketService);

  ngOnInit(): void {
    this.chatService.latestMessage$
      .pipe(filter((newMsg: IRCMessage) => (newMsg.target === '#mp_' + this.matchID)))
      .subscribe(newMsg => {
        let message = newMsg.message;
        console.log(JSON.stringify(message));
        switch (true) {
          // !mp settings is ran
          case /Room name:\s*(.*?),\s*History:/.test(message): {
            this.lobbyName = this.getRoomName(message);
            break;
          }
          // beatmap link pasted by banchobot
          case /(https:\/\/osu\.ppy\.sh\/b\/\d+)\s+(.*)$/.test(message): {
            this.beatmap = this.handleBeatmapSetting(message)!;
            break;
          }
          // This happens when !mp settings is ran
          case /^Slot\s+(\d{1,2})\s+(Not Ready|Ready|No Map)\s+https:\/\/osu\.ppy\.sh\/u\/\d+\s+(\S+)(?:\s+\[\s*Team\s+(Red|Blue)(?:\s*\/\s*([^\]]+))?\s*\])?\s*$/.test(message): {
            this.handlePlayerUpdate(message);
            break;
          }
          // This happens when someone joins
          case /^(\S+)\s+joined in slot\s+(\d+)(?:\s+for team\s+(red|blue))?\./i.test(message): {
            this.handlePlayerJoined(message);
            break;
          }
          // This happens when a player moves to a new slot
          case /^(\S+)\s+moved to slot\s+(\d+)$/.test(message): {
            this.handlePlayerMoved(message);
            break;
          }
          // Player leaves
          case /^(\S+)\sleft the game\.$/.test(message): {
            this.handlePlayerLeft(message);
            break;
          }
          // Player changes color
          case /^(\S+)\s+changed to\s+(Red|Blue)$/.test(message): {
            this.handlePlayerChangeColor(message);
            break;
          }
          // Active Mods: ... or Enabled ...
          case /^Active mods:\s*(.*)$/.test(message): {
            this.globalMods = this.getActiveMods(message);
            break;
          }
          // Mod Change
          case /^Enabled\s+(.+?)(?:,\s*disabled.*)?$/i.test(message): {
            this.globalMods = this.handleModChange(message);
            break;
          }
          // mp settings, Team mode + win con
          case /Team mode:\s*(\w+),\s*Win condition:\s*(\w+)/.test(message): {
            this.matchSettings = this.getTeamModeAndWinCon(message)!;
            break;
          }
          case /Changed match settings to \d+ slots,\s*(\w+),\s*(\w+)/.test(message): {
            this.matchSettings = this.handleTeamModeAndWinConChange(message)!;
            break;
          }
          case message === 'Disabled all mods, enabled FreeMod': {
            this.globalMods = ['FreeMod'];
            break;
          }
          case message === 'Disabled all mods, disabled FreeMod': {
            this.globalMods = [];
            break;
          }
          case message === 'All players are ready': {
            this.players.forEach(player => {
              if (player !== null) player.ready = 'Ready';
            })
            break;
          }
        }
      })
  }

  refreshLobby() {
    this.chatService.sendMessage('#mp_'+this.matchID, '!mp settings');
  }

  getRoomName(message: string): string {
    let match = message.match(/Room name:\s*(.*?),\s*History:/);
    return match ? match[1] : "";
  }

  private validSlot(slot: number) {
    return slot >= 1 || slot <= 16
  }

  handlePlayerJoined(message: string) {
    let match = message.match(/^(\S+)\s+joined in slot\s+(\d+)(?:\s+for team\s+(red|blue))?\./i);
    if (!match) return;
    let name = match[1];
    let slot = Number(match[2]);
    let teamColor = match[3] ? match[3][0].toUpperCase() + match[3].slice(1) : undefined;
    if (!this.validSlot(slot)) return;

    this.players[slot - 1] = { name, mods: [], teamColor };
  }

  handlePlayerMoved(message: string) {
    let match = message.match(/^(\S+)\s+moved to slot\s+(\d+)$/);
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
    let match = message.match(/^Slot\s+(\d{1,2})\s+(Not Ready|Ready|No Map)\s+https:\/\/osu\.ppy\.sh\/u\/\d+\s+(\S+)(?:\s+\[\s*Team\s+(Red|Blue)(?:\s*\/\s*([^\]]+))?\s*\])?\s*$/);
    if (match) {
      let slot = Number(match[1]);
      let ready = match[2]; // e.g. "Not Ready"
      let name = match[3];
      let teamColor = match[4];
      let mods = match[5]
        ? match[5].split(',').map(m => m.trim())
        : [];
      if (!this.validSlot(slot)) return;

      this.players[slot - 1] = { name, mods, ready, teamColor };
      return;
    }
  }

  handlePlayerLeft(message: string) {
    let match = message.match(/^(\S+)\sleft the game\.$/);
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
    return {mode, winCon};
  }

  handleTeamModeAndWinConChange(message: string) {
    let match = message.match(/Changed match settings to \d+ slots,\s*(\w+),\s*(\w+)/);
    if (!match) return;
    let mode = match[1];
    let winCon = match[2];
    if (!mode.includes('Team')) this.removeTeamColorsFromPlayers()
    return {mode, winCon};
  }

  private removeTeamColorsFromPlayers() {
    this.players = this.players.map(player => {
      if (player) {
        player.teamColor = undefined;
      }
      return player;
    });
  }

}
