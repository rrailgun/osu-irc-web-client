import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MatchDetailResponse } from '../models/multiplayer-lobby';

@Injectable({
  providedIn: 'root',
})
export class OsuApiService {
  private readonly baseUrl = 'http://chat-api.rrailgun.com';

  constructor(private http: HttpClient) {}

  getMatchInfo(matchId: string): Observable<MatchDetailResponse> {
    // Hardcoded full endpoint URL here
    const url = `${this.baseUrl}/api/match/${matchId}`;
    return this.http.get<any>(url).pipe(
      map((res: MatchDetailResponse) => ({
        ...res,
        events: [
          ...res.events.filter((e) => e.game).reverse(),
          ...res.events.filter((e) => !e.game)
        ]
      }))
    );
  }
}
