import { Router, serve } from "./deps.ts";

const router = Router();

// @ts-ignore The method is not defined in types
router.get("/", (_req: Request) => {
  return new Response(JSON.stringify('home'), { status: 200 });
});

// @ts-ignore The method is not defined in types
router.get("/about", (_req: Request) => {
  return new Response(JSON.stringify('about'), { status: 200 });
});

// @ts-ignore The method is not defined in types
router.get("/products", (_req: Request) => {
  return new Response(JSON.stringify('products'), { status: 200 });
});

// @ts-ignore The method is not defined in types
router.get("/products/:id", (_req: Request) => {
  return new Response(JSON.stringify('product'), { status: 200 });
});

// @ts-ignore The method is not defined in types
router.get("/cart", (_req: Request) => {
  return new Response(JSON.stringify('cart'), { status: 200 });
});

// @ts-ignore The method is not defined in types
router.all("*", () => new Response("Not Found.", { status: 404 }));

// @ts-ignore The method is not defined in types
await serve(router.handle);