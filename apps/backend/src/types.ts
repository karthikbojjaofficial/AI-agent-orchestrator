import type { Context } from 'hono';

export type AppContext = {
  Variables: {
    userId: string;
  };
};

export type AppHonoContext = Context<{ Variables: { userId: string } }>;
