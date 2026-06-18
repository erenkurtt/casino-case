export interface GameListItem {
  id: string;
  externalId: number;
  name: string;
  slug: string;
  providerName: string;
  thumbnailUrl: string | null;
  isActive: boolean;
}

interface thumbObj {
    url: string;
}