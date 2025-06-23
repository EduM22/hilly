import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";

const VERSION = "v0.1.0";

if (import.meta.main) {
  try {
    const { args } = Deno;

    if (args.length === 0 || args.length < 4 || args.length > 6) {
      console.log(`hilly version: ${VERSION}`)
      console.log(
        "Usage: hilly deploy <entry-point-file> --t <token> --h <domain> (optional)",
      );
      Deno.exit(1);
    }

    if (args[0] !== "deploy") {
      console.log("The first arg must be 'deploy'");
      Deno.exit(1);
    }

    const tokenArg = args.findIndex((x) => x == "--t");
    if (tokenArg == -1) {
      console.log("No argument for token");
      Deno.exit(1);
    }
    const token = args[tokenArg + 1];

    const domainArg = args.findIndex((x) => x == "--d");
    let domain = "https://admin.ecma.run";
    if (domainArg != -1) {
      domain = args[domainArg + 1];
    }

    const result = await esbuild.build({
      entryPoints: [args[1]],
      bundle: true,
      minify: true,
      write: false,
      format: "esm",
      plugins: [denoPlugin()],
    });

    if (result.errors.length > 0) {
      console.error(`Errors from bundle: `);
      result.errors.forEach((error) => {
        console.error(error);
      });

      Deno.exit(1);
    } else {
      if (result.warnings.length > 0) {
        console.warn(`Warnings from bundle:`);
        result.warnings.forEach((warning) => {
          console.warn(warning);
        });
      }

      if (result.outputFiles[0]) {
        const file = result.outputFiles[0];
        const source = file.text.replaceAll('"', "'");
        const link = `${domain}/api/function`;
        const response = await fetch(link, {
          method: "POST",
          headers: {
            "munk-auth": token,
          },
          body: JSON.stringify({
            code: source,
          }),
        });

        if (!response.ok) {
          console.error(
            `Could not upload the code | status: ${response.status}, ${response.statusText}, ${await response
              .text()}`,
          );
          Deno.exit(1);
        }

        const functionId = response.headers.get("munk-function-id");

        console.log(`👋 New function created with id: ${functionId}`);
      } else {
        console.error("No file");
      }
    }
  } catch (ex) {
    console.error(ex);
  }
}
