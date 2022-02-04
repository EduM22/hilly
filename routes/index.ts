import { Router } from "../deps.ts";
import * as ProductService from "../services/products.ts";
import Home from "../pages/home.tsx";
import About from "../pages/about.tsx";
import Cart from "../pages/cart.tsx";
import Products from "../pages/products.tsx";
import Product from "../pages/product.tsx";

const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = Home({
    title: "Hilly.shop | Home",
    meta: [{
      name: "description",
      content: "hilly.shop - your site for your shop",
    }],
  });
});

router.get("/about", (ctx) => {
  ctx.response.body = About({
    title: "Hilly.shop | About",
    meta: [{
      name: "description",
      content: "hilly.shop - your site for your shop",
    }],
  });
});

router.get("/products", (ctx) => {
  //const data = ProductService.getAll();

  ctx.response.body = Products({
    title: "Hilly.shop | Products",
    meta: [{
      name: "description",
      content: "hilly.shop - your site for your shop",
    }],
  });
});

router.get("/products/:id", (ctx) => {
  const id = ctx.params.id;

  const data = ProductService.get(id);

  ctx.response.body = Product({
    title: "Hilly.shop | Products",
    meta: [{
      name: "description",
      content: "hilly.shop - your site for your shop",
    }],
  });
});

router.get("/cart", (ctx) => {
  ctx.response.body = Cart({
    title: "Hilly.shop | Cart",
    meta: [{
      name: "description",
      content: "hilly.shop - your site for your shop",
    }],
  });
});

export default router;
