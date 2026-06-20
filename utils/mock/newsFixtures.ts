/*
    What the News widget component renders. Shapred to match exactly what the
    future /server/api/news.get.ts route will return, so swapping fixtures
    for the real fetch later requires no component changes.

    This is separate from "seeded history" (see docs)
    this is what the user SEES; seeded history is what the ALGORITHM has
    observed over time.
*/

export interface MockArticle {
    title: string;
    link: string;
    source: string;
    publishedAt: number;
    tokens: string[]; // the keywords the widget extracted from this article
}

export const mockNewsFixtures: MockArticle[] = [
    {
        title: 'AI regulation talks accelerate globally',
        link: '#',
        source: 'BBC',
        publishedAt: Date.now() - 3_600_6000,
        tokens: ['ai', 'regulation', 'accelerate', 'global']
    },
    {
        title: 'Stoicism sees a quiet resurgence among young readers',
        link: '#',
        source: 'The Guardian',
        publishedAt: Date.now() - 7_200_000,
        tokens: ['stoicism', 'philosophy', 'reading'],
    },
    {
        title: 'Toronto transit expansion faces fresh delays',
        link: '#',
        source: 'CBC',
        publishedAt: Date.now() - 10_800_000,
        tokens: ['toronto', 'transit', 'infrastructure'],
    }
]