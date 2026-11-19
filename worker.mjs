import { AsyncLocalStorage } from 'node:async_hooks';
import app from './.open-next/worker.js';
import { checkRateLimit } from './worker-rate-limit.mjs';

export * from './.open-next/worker.js';

const scope = globalThis.rcDatabaseScope ??= new AsyncLocalStorage();

const worker = {
  async fetch(request, env, ctx) {
    const blocked = await checkRateLimit(request, env);
    if (blocked) return blocked;
    return scope.run({}, async () => {
      const response = await app.fetch(request, env, ctx);
      const state = scope.getStore();
      // Rendering can continue after headers are available. Release connections after streaming.
      const close = () => state.client?.$disconnect();
      if (!response.body) {
        await close();
        return response;
      }
      const stream = new TransformStream();
      ctx.waitUntil(response.body.pipeTo(stream.writable).finally(close));
      return new Response(stream.readable, response);
    });
  },
};
export default worker;
