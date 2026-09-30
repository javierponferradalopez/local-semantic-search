export type Match = {
  text: string;
  page?: number;
  // The score of the model that judges the group: higher is nearer.
  score: number;
};
