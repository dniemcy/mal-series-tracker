export class AnimeSeries {
    constructor(firstAnime) {
        this.animeList = [firstAnime];
        this.title = this.getTitle(firstAnime);
        this.isComplete = false;
        this.processedIds = new Set([firstAnime.id]);
    }

    getTitle(anime) {
        return anime.alternative_titles?.en || anime.title || anime.alternative_titles?.ja || 'Unknown Title';
    }

    addAnime(anime) {
        if (!this.processedIds.has(anime.id)) {
            this.animeList.push(anime);
            this.processedIds.add(anime.id);
            this.animeList.sort((a, b) => {
                const dateA = new Date(a.start_date || '9999');
                const dateB = new Date(b.start_date || '9999');
                return dateA - dateB;
            });
            this.title = this.getTitle(this.animeList[0]);
        }
    }

    hasProcessedId(id) {
        return this.processedIds.has(id);
    }
}