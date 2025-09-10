import { Anime } from '../types/index.js';

export class AnimeSeries {
  animeList: Anime[];
  title: string;
  isComplete: boolean;
  processedIds: Set<number>;

  constructor(firstAnime: Anime) {
    this.animeList = [firstAnime];
    this.title = this.getTitle(firstAnime);
    this.isComplete = false;
    this.processedIds = new Set([firstAnime.id]);
  }

  getTitle(anime: Anime): string {
    return anime.alternative_titles?.en || anime.title || anime.alternative_titles?.ja || 'Unknown Title';
  }

  addAnime(anime: Anime): void {
    if (!this.processedIds.has(anime.id)) {
      this.animeList.push(anime);
      this.processedIds.add(anime.id);
      this.animeList.sort((a, b) => {
        const dateA = new Date(a.start_date || '9999');
        const dateB = new Date(b.start_date || '9999');
        return dateA.getTime() - dateB.getTime();
      });
      this.title = this.getTitle(this.animeList[0]);
    }
  }

  hasProcessedId(id: number): boolean {
    return this.processedIds.has(id);
  }
}
