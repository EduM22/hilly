import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";
import { parse } from "@std/toml";
import { dirname, resolve } from "@std/path";

const VERSION = "v0.2.0";

if (import.meta.main) {
  try {
    const { args } = Deno;

    if (args.length === 0 || args.length < 1 || args.length > 6) {
      console.log(`hilly version: ${VERSION}`);
      console.log(
        "Usage: hilly deploy <entry-point-file> --t <token> --h <domain> (optional)",
      );
      console.log(
        "Usage: hilly deploy ./munk.toml",
      );
      Deno.exit(1);
    }

    if (args[0] !== "deploy") {
      console.log("The first arg must be 'deploy'");
      Deno.exit(1);
    }

    if (args[1].endsWith("munk.toml")) {
      const text = await Deno.readTextFile(args[1]);
      const obj = parse(text);

      const dir_path = dirname(args[1]);

      const app = obj.app;
      //@ts-expect-error not on type
      let domain = app.domain ?? "https://admin.ecma.run";
      //@ts-expect-error not on type
      const token = app.token ?? "";
      domain = domainCheck(domain);
      //@ts-expect-error not on type
      const app_path = app.path;
      const path = resolve(dir_path, app_path);

      const code = await bundle(path);
      await upload(code, domain, token);
    } else {
      const tokenArg = args.findIndex((x) => x == "--t");
      if (tokenArg == -1) {
        console.log("No argument for token");
        Deno.exit(1);
      }
      const token = args[tokenArg + 1];

      const domainArg = args.findIndex((x) => x == "--h");
      let domain = "https://admin.ecma.run";
      if (domainArg != -1) {
        domain = args[domainArg + 1];
        domain = domainCheck(domain);
      }

      const code = await bundle(args[1]);
      await upload(code, domain, token);
    }
  } catch (ex) {
    console.error(ex);
  }
}

async function bundle(file: string): Promise<string> {
  const result = await esbuild.build({
    entryPoints: [file],
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

      return source;
    } else {
      console.error("No file");
      Deno.exit(1);
    }
  }
}

async function upload(code: string, domain: string, token: string) {
  const link = `${domain}/api/functions`;
  const response = await fetch(link, {
    method: "POST",
    headers: {
      "munk-auth": token,
    },
    body: JSON.stringify({
      code: code,
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
}

function domainCheck(domain: string): string {
  if (!domain.startsWith("http://") && !domain.startsWith("https://")) {
    domain = `https://${domain}`;
  }

  if (domain.endsWith("/")) {
    domain = domain.slice(0, -1);
  }

  return domain;
}
