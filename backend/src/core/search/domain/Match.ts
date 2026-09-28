export type Match = {
  text: string;
  page?: number;
  // A cosine similarity, as the Floor is: higher is nearer.
  score: number;
};
