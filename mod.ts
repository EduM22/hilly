import { Application } from "./deps.ts";
import shopRoutes from "./routes/store.ts";
import indexRoutes from "./routes/index.ts";

const app = new Application();
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
})
app.use(indexRoutes.routes());
app.use(indexRoutes.allowedMethods());
app.use(shopRoutes.routes());
app.use(shopRoutes.allowedMethods());

app.listen({ port: 8080 });