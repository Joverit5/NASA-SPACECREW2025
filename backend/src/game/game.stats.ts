export class GameStats {
  private scores: Record<string, number> = {};

  addScore(playerId: string, points: number) {
    if (!this.scores[playerId]) this.scores[playerId] = 0;
    this.scores[playerId] += points;
  }

  getScores() {
    return this.scores;
  }
}
