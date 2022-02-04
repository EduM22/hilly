/** @jsx h */
import { Component, h } from "../deps.ts";

export class Navbar extends Component {
  render() {
    return (
      <nav class="">
        <ul>
          <li>
            <a href="">Home</a>
          </li>
          <li>
            <a href="/products">Products</a>
          </li>
        </ul>
      </nav>
    );
  }
}
