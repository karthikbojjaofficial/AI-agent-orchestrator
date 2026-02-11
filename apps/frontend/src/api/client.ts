import { hc } from 'hono/client';
import type { AppType } from 'backend/src/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const client = hc<AppType>(API_URL);

export default client;
