/** @jsx h */
import { Component, h, Helmet, renderSSR } from "../deps.ts";

export class App extends Component {
  render() {
    return (
      <div>
        <Helmet>
          <title>{this.props.title ?? "hilly.shop"}</title>
          {this.props.meta?.map((tag: { name: string; content: string }) => {
            return <meta name={tag.name} content={tag.content} />;
          })}
        </Helmet>

        <h3>Products</h3>
        <hr />
        <h4>products list</h4>
        <hr />
        <h4>footer and/or form</h4>
      </div>
    );
  }
}

function product(params: {
  title: string;
  meta: [{ name: string; content: string }];
}) {
  const ssr = renderSSR(<App title={params.title} meta={params.meta} />);
  const { body, head, footer } = Helmet.SSR(ssr);

  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${head.join("\n")}
    </head>
    <body>
      ${body}
      ${footer.join("\n")}
    </body>
  </html>`;

  return html;
}

export default product;
