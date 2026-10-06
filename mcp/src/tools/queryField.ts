import {z} from 'zod';

export const queryField = z
  .string()
  .regex(/\S/, 'The query must have at least one character that is not a space');
