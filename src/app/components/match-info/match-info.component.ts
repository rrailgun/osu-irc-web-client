import { Component, inject, Input } from '@angular/core';
import { GameScore, MatchDetailResponse, MatchUser, MatchGame } from '../../models/multiplayer-lobby';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { BehaviorSubject, filter } from 'rxjs';
import { OsuApiService } from '../../service/osu-api.service';
import { IrcWebsocketService } from '../../service/irc-websocket.service';
import { IRCMessage } from '../../models/message';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

interface TeamDisplay {
  key: string;
  label: string;
  color: string;
  scores: GameScore[];
  totalScore: number;
}

@Component({
  selector: 'app-match-info',
  templateUrl: './match-info.component.html',
  standalone: true,
  imports: [CommonModule, DecimalPipe, NzListModule, NzCardModule, NzAvatarModule, NzEmptyModule],
  styleUrls: ['./match-info.component.scss']
})
export class MatchInfoComponent {
  osuApiService: OsuApiService = inject(OsuApiService);
  chatService: IrcWebsocketService = inject(IrcWebsocketService);
  @Input() matchID: string | undefined;
  matchData$: BehaviorSubject<MatchDetailResponse | undefined> = new BehaviorSubject<MatchDetailResponse | undefined>(undefined);

  ngOnInit() {
    this.getData();
    this.chatService.latestMessage$
      .pipe(filter((newMsg: IRCMessage) => (newMsg.target === '#mp_' + this.matchID && newMsg.nick === 'BanchoBot')))
      .subscribe(newMsg => {
        if (newMsg.message === 'The match has finished!') this.getData();
      })
  }

  getData() {
    if (!this.matchID) return;
    this.osuApiService.getMatchInfo(this.matchID).subscribe(res => {
      this.matchData$.next(res);
    })
  }

  getUser(userId: number, users: MatchUser[]): MatchUser | undefined {
    return users.find(u => u.id === userId);
  }

  getTotalScore(scores: GameScore[]): number {
    return scores.reduce((sum, s) => sum + s.score, 0);
  }

  hasEventsWithGame(matchData: MatchDetailResponse): boolean {
    return matchData?.events?.some(e => !!e.game);
  }

  getTeams(game: MatchGame): TeamDisplay[] {
    if (game.team_type != 'team-vs') {
      return [{
        key: 'all',
        label: 'Players',
        color: '#000',
        scores: game.scores,
        totalScore: this.getTotalScore(game.scores)
      }];
    } else {
      const redScores = game.scores.filter(s => s.match.team === 'red');
      const blueScores = game.scores.filter(s => s.match.team === 'blue');

      const teams: TeamDisplay[] = [
        { key: 'red', label: 'Red Team', color: '#f5222d', scores: redScores, totalScore: this.getTotalScore(redScores) },
        { key: 'blue', label: 'Blue Team', color: '#1890ff', scores: blueScores, totalScore: this.getTotalScore(blueScores) }
      ];
      return teams.sort((a, b) => b.totalScore - a.totalScore);
    }
  }

  formatTeamType(teamType: string): string {
    if (!teamType) return '';
    return teamType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
