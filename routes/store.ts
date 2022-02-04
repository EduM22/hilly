import { Router } from "../deps.ts";

const router = new Router({
  prefix: "/shop",
});
router.get("/", (ctx) => {
  ctx.response.body = `<!DOCTYPE html>
    <html>
      <head><title>Hello oak!</title><head>
      <body>
        <h1>SHOP</h1>
      </body>
    </html>
  `;
});

export default router;
