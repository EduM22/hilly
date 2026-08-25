import * as esbuild from "esbuild";
import { denoPlugin } from "@deno/esbuild-plugin";
import { parse } from "@std/toml";
import { dirname, resolve } from "@std/path";

const VERSION = "v0.8.0";

if (import.meta.main) {
  try {
    const args = Deno.args;

    if (args.length === 0 || hasFlag(args, "--help", "-h", "help")) {
      printHelp();
      Deno.exit(0);
    }

    if (hasFlag(args, "--version", "-v", "version")) {
      console.log(`munk version: ${VERSION}`);
      Deno.exit(0);
    }

    const command = args[0];

    switch (command) {
      case "deploy":
        await handleDeploy(args.slice(1));
        break;
      case "bundle":
        await handleBundle(args.slice(1));
        break;
      case "list":
        await handleList(args.slice(1));
        break;
      case "delete":
        await handleDelete(args.slice(1));
        break;
      case "logs":
        await handleLogs(args.slice(1));
        break;
      case "health":
        await handleHealth(args.slice(1));
        break;
      default:
        console.error(`Unknown command: '${command}'`);
        printHelp();
        Deno.exit(1);
    }
  } catch (ex) {
    console.error(ex instanceof Error ? ex.message : ex);
    Deno.exit(1);
  }
}

function printHelp() {
  console.log(
    `munk ${VERSION} - CLI for munk FaaS service (https://github.com/EduM22/munk-runner/)

Usage:
  munk <command> [options]

Commands:
  deploy <file|munk.toml>   Deploy a function to munk-runner
  bundle <file|munk.toml>   Bundle a function into munk.js locally
  list                      List all deployed functions
  delete <function-id>      Delete a deployed function
  logs [function-id]        View or stream execution logs (function-id optional with -f)
  health                    Check server health status and version

Options:
  --t, --token <token>      Admin authentication token (or set MUNK_TOKEN env)
  --h, --host <domain>      Munk server host domain (default: https://admin.ecma.run or MUNK_HOST env)
  -n, --name <name>         Function name (optional)
  --env-file <file>         Path to .env file for function environment variables
  --cpu-limit <limit>       CPU limit for execution (default: 50ms)
  --wall-limit <limit>      Wall time limit for execution (default: 10s)
  -f, --follow              Stream real-time logs via SSE (logs command only)
  -l, --limit <number>      Max number of historical logs to fetch (logs command only, default: 100)
  -h, --help                Show help information
  -v, --version             Show CLI version
`,
  );
}

function getArgValue(args: string[], ...flags: string[]): string | undefined {
  for (const flag of flags) {
    const idx = args.findIndex((x) => x === flag);
    if (idx !== -1 && idx + 1 < args.length) {
      return args[idx + 1];
    }
  }
  return undefined;
}

function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some((flag) => args.includes(flag));
}

function resolveToken(args: string[], tomlToken?: string): string {
  const token = getArgValue(args, "--t", "--token") ??
    tomlToken ??
    Deno.env.get("MUNK_TOKEN") ??
    Deno.env.get("MUNK_AUTH_HEADER_VALUE");

  if (!token) {
    console.error(
      "Error: Missing authentication token. Provide via '--t <token>', 'token' in munk.toml, or MUNK_TOKEN env var.",
    );
    Deno.exit(1);
  }
  return token;
}

function resolveDomain(args: string[], tomlDomain?: string): string {
  const domain = getArgValue(args, "--h", "--host", "--domain") ??
    tomlDomain ??
    Deno.env.get("MUNK_HOST") ??
    Deno.env.get("MUNK_DOMAIN") ??
    "https://admin.ecma.run";

  return domainCheck(domain);
}

interface TomlConfig {
  app?: {
    path?: string;
    domain?: string;
    token?: string;
    name?: string;
    env?: string;
    cpu?: string;
    wall?: string;
  };
}

async function handleDeploy(args: string[]) {
  if (args.length === 0) {
    console.error("Usage: munk deploy <entry-point-file|munk.toml> [options]");
    Deno.exit(1);
  }

  const target = args[0];
  let code = "";
  let domain = "";
  let token = "";
  let envArr: Array<Record<string, string>> = [];
  let cpu = "50ms";
  let wall = "10s";
  let name: string | undefined = getArgValue(args, "-n", "--name");

  if (target.endsWith("munk.toml")) {
    const text = await Deno.readTextFile(target);
    const obj = parse(text) as TomlConfig;
    const dir_path = dirname(target);
    const app = obj.app ?? {};

    token = resolveToken(args, app.token);
    domain = resolveDomain(args, app.domain);
    cpu = getArgValue(args, "--cpu-limit") ?? app.cpu ?? "50ms";
    wall = getArgValue(args, "--wall-limit") ?? app.wall ?? "10s";
    name = name ?? app.name;

    const app_path = app.path;
    if (!app_path) {
      console.error(
        "Error: 'path' field is required in [app] section of munk.toml",
      );
      Deno.exit(1);
    }
    const scriptPath = resolve(dir_path, app_path);
    code = await bundle(scriptPath);

    const env_path = getArgValue(args, "--env-file") ?? app.env;
    if (env_path) {
      const envPath = resolve(dir_path, env_path);
      envArr = await envs(envPath);
    }
  } else {
    token = resolveToken(args);
    domain = resolveDomain(args);
    cpu = getArgValue(args, "--cpu-limit") ?? "50ms";
    wall = getArgValue(args, "--wall-limit") ?? "10s";

    code = await bundle(target);

    const envPath = getArgValue(args, "--env-file");
    if (envPath) {
      envArr = await envs(envPath);
    }
  }

  await upload(code, domain, token, envArr, cpu, wall, name);
}

async function handleBundle(args: string[]) {
  if (args.length === 0) {
    console.error("Usage: munk bundle <entry-point-file|munk.toml>");
    Deno.exit(1);
  }

  const target = args[0];
  let scriptPath = target;

  if (target.endsWith("munk.toml")) {
    const text = await Deno.readTextFile(target);
    const obj = parse(text) as TomlConfig;
    const dir_path = dirname(target);
    const app_path = obj.app?.path;
    if (!app_path) {
      console.error(
        "Error: 'path' field is required in [app] section of munk.toml",
      );
      Deno.exit(1);
    }
    scriptPath = resolve(dir_path, app_path);
  }

  const code = await bundle(scriptPath);
  await Deno.writeFile("munk.js", new TextEncoder().encode(code));
  console.log("✅ Successfully bundled output to 'munk.js'");
}

async function handleList(args: string[]) {
  const token = resolveToken(args);
  const domain = resolveDomain(args);

  const link = `${domain}/api/functions`;
  const response = await fetch(link, {
    method: "GET",
    headers: {
      "munk-auth": token,
    },
  });

  if (!response.ok) {
    console.error(
      `Could not list functions | status: ${response.status} ${response.statusText}`,
    );
    console.error(await response.text());
    Deno.exit(1);
  }

  const data = await response.json();
  const functions = data.functions || [];

  if (functions.length === 0) {
    console.log("No functions found.");
    return;
  }

  console.log(`📋 Deployed Functions (${functions.length}):`);
  console.log("--------------------------------------------------");
  for (const fn of functions) {
    const nameStr = fn.name ? ` | Name: ${fn.name}` : "";
    const createdStr = fn.created_at ? ` | Created: ${fn.created_at}` : "";
    const wallLimit = fn.limits?.walltime ?? "N/A";
    const cpuLimit = fn.limits?.cputime ?? "N/A";
    console.log(
      `• ID: ${fn.id}${nameStr}${createdStr} (Limits: CPU ${cpuLimit}, Wall ${wallLimit})`,
    );
  }
}

async function handleDelete(args: string[]) {
  if (args.length === 0 || args[0].startsWith("-")) {
    console.error("Usage: munk delete <function-id> [options]");
    Deno.exit(1);
  }

  const functionId = args[0];
  const token = resolveToken(args);
  const domain = resolveDomain(args);

  const link = `${domain}/api/functions/${functionId}`;
  const response = await fetch(link, {
    method: "DELETE",
    headers: {
      "munk-auth": token,
    },
  });

  if (!response.ok && response.status !== 204) {
    console.error(
      `Could not delete function | status: ${response.status} ${response.statusText}`,
    );
    console.error(await response.text());
    Deno.exit(1);
  }

  console.log(`🗑️ Successfully deleted function '${functionId}'`);
}

async function handleLogs(args: string[]) {
  const follow = hasFlag(args, "-f", "--follow");
  const token = resolveToken(args);
  const domain = resolveDomain(args);
  const functionId = args.find((arg) => !arg.startsWith("-"));

  if (follow) {
    await streamLogs(domain, token, functionId);
  } else {
    if (!functionId) {
      console.error(
        "Usage: munk logs <function-id> [--follow / -f] [--limit <n>] [options]",
      );
      Deno.exit(1);
    }
    const limit = getArgValue(args, "-l", "--limit") ?? "100";
    await getLogs(domain, token, functionId, limit);
  }
}

async function getLogs(
  domain: string,
  token: string,
  functionId: string,
  limit: string,
) {
  const link = `${domain}/api/logs?id=${encodeURIComponent(functionId)}&limit=${encodeURIComponent(limit)
    }`;
  const response = await fetch(link, {
    method: "GET",
    headers: {
      "munk-auth": token,
      "munk-function-id": functionId,
    },
  });

  if (!response.ok) {
    console.error(
      `Could not fetch logs | status: ${response.status} ${response.statusText}`,
    );
    console.error(await response.text());
    Deno.exit(1);
  }

  const data = await response.json();
  const logs = data.logs || [];

  if (logs.length === 0) {
    console.log(`No logs found for function '${functionId}'.`);
    return;
  }

  console.log(
    `📜 Execution Logs for function '${functionId}' (${logs.length}):`,
  );
  console.log("--------------------------------------------------");
  for (const log of logs) {
    const prefix = log.is_error ? "❌ [ERROR]" : "ℹ️ [INFO]";
    const timeStr = log.created_at ?? "";
    console.log(`${timeStr} ${prefix} ${log.message}`);
  }
}

async function streamLogs(domain: string, token: string, functionId?: string) {
  const link = `${domain}/api/logs/stream`;
  const response = await fetch(link, {
    method: "GET",
    headers: {
      "munk-auth": token,
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      `Could not stream logs | status: ${response.status} ${response.statusText}`,
    );
    console.error(await response.text());
    Deno.exit(1);
  }

  if (!response.body) {
    console.error("Error: Response body is empty.");
    Deno.exit(1);
  }

  const targetStr = functionId
    ? `for function '${functionId}'`
    : "for all functions";
  console.log(
    `📡 Streaming real-time logs ${targetStr}... (Press Ctrl+C to stop)`,
  );
  console.log("--------------------------------------------------");

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;

        try {
          const log = JSON.parse(dataStr);
          const logFnId = log.function_id ?? log.functionId;
          if (functionId && logFnId && logFnId !== functionId) {
            continue;
          }

          const prefix = log.is_error ? "❌ [ERROR]" : "ℹ️ [INFO]";
          const timeStr = log.created_at ?? new Date().toISOString();
          const fnIdStr = !functionId && logFnId ? `[${logFnId}] ` : "";
          console.log(`${timeStr} ${prefix} ${fnIdStr}${log.message}`);
        } catch {
          console.log(dataStr);
        }
      }
    }
  }
}

async function handleHealth(args: string[]) {
  const domain = resolveDomain(args);
  const link = `${domain}/health`;

  const response = await fetch(link, {
    method: "GET",
  });

  if (!response.ok) {
    console.error(
      `Health check failed | status: ${response.status} ${response.statusText}`,
    );
    console.error(await response.text());
    Deno.exit(1);
  }

  const data = await response.json();
  console.log(`🟢 Runner Status: ${data.status || "ok"}`);
  if (data.version) console.log(`📦 Version: ${data.version}`);
  const uptimeVal = data.uptime_secs ?? data.uptime;
  if (uptimeVal !== undefined) {
    const secs = Number(uptimeVal);
    if (!isNaN(secs)) {
      console.log(`⏱️ Uptime: ${formatUptime(secs)}`);
    }
  }
}

function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const totalSecs = Math.floor(seconds);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(" ");
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
    console.error("Errors from bundle:");
    result.errors.forEach((error) => console.error(error));
    Deno.exit(1);
  } else {
    if (result.warnings.length > 0) {
      console.warn("Warnings from bundle:");
      result.warnings.forEach((warning) => console.warn(warning));
    }

    if (result.outputFiles[0]) {
      return result.outputFiles[0].text;
    } else {
      console.error("No output file generated by esbuild");
      Deno.exit(1);
    }
  }
}

async function upload(
  code: string,
  domain: string,
  token: string,
  envs: Array<Record<string, string>>,
  cpu: string,
  wall: string,
  name?: string,
) {
  const link = `${domain}/api/functions`;
  const bodyPayload: Record<string, unknown> = {
    code,
    envs,
    limits: {
      walltime: wall,
      cputime: cpu,
    },
  };

  if (name) {
    bodyPayload.name = name;
  }

  const response = await fetch(link, {
    method: "POST",
    headers: {
      "munk-auth": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    console.error(
      `Could not upload the code | status: ${response.status}, ${response.statusText}, ${await response
        .text()}`,
    );
    Deno.exit(1);
  }

  const functionId = response.headers.get("munk-function-id");

  console.log(
    `👋 New function created with id: ${functionId}${name ? ` (name: ${name})` : ""
    }`,
  );
  console.log(
    `🚀 Call it by setting the header 'munk-function-id': '${functionId}' in your call to ${domain}`,
  );
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

async function envs(path: string): Promise<Array<Record<string, string>>> {
  try {
    const data = await Deno.readTextFile(path);
    const lines = data.split("\n");
    const envs: Array<Record<string, string>> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key) {
        envs.push({ [key.trim()]: rest.join("=").trim() });
      }
    }

    return envs;
  } catch (error) {
    console.error(`Error reading env file '${path}':`, error);
    return [];
  }
}
