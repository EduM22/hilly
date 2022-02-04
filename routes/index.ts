import { Router } from "../deps.ts";
import * as ProductService from "../services/products.ts"

const router = new Router()
router.get("/", (ctx) => {
  ctx.response.body = `<!DOCTYPE html>
    <html>
      <head><title>Home</title><head>
      <body>
        <h1>Home</h1>
      </body>
    </html>
  `;
});

router.get("/about", (ctx) => {
  ctx.response.body = `<!DOCTYPE html>
    <html>
      <head><title>About</title><head>
      <body>
        <h1>About</h1>
      </body>
    </html>
  `;
});

router.get("/products", (ctx) => {

  const data = ProductService.getAll()

  ctx.response.body = `<!DOCTYPE html>
    <html>
      <head><title>Products</title><head>
      <body>
        <h1>Products</h1>
        ${JSON.stringify(data)}
      </body>
    </html>
  `;
});

router.get("/products/:id", (ctx) => {
  const id = ctx.params.id

  const data = ProductService.get(id)
  
  ctx.response.body = `<!DOCTYPE html>
    <html>
      <head><title>Product</title><head>
      <body>
        <h1>Product</h1>
        ${data}
      </body>
    </html>
  `;
});

router.get("/cart", (ctx) => {
  ctx.response.body = `<!DOCTYPE html>
    <html>
      <head><title>Cart</title><head>
      <body>
        <h1>Cart</h1>
      </body>
    </html>
  `;
});

export default router