# munk-cli

`munk` (or `munk-cli`) is a CLI for
[munk FaaS service](https://github.com/EduM22/munk-runner/).

## Install CLI

Run this command:

```bash
deno install -g -n munk --allow-env --allow-read --allow-write --allow-run --allow-net -c deno.json -f ./src/main.ts
```

## Commands

### 1. Deploy

Deploy a function to a `munk-runner` instance:

```bash
munk deploy ./munk.toml --t <token>
# OR
munk deploy ./script.ts --t <token> --name "my-func" --h http://localhost:3000/
```

### 2. Bundle

Bundle a script locally without uploading:

```bash
munk bundle ./munk.toml
# OR
munk bundle ./script.ts
```

### 3. List

List all active functions deployed on the runner:

```bash
munk list --t <token> --h http://localhost:3000/
```

### 4. Delete

Delete a function by ID (and purge its logs):

```bash
munk delete <function-id> --t <token> --h http://localhost:3000/
```

### 5. Logs

View execution log history or stream logs in real-time via SSE:

```bash
# View historical logs (default limit: 100)
munk logs <function-id> --limit 50 --t <token>

# Stream real-time logs for all functions (SSE)
munk logs --follow --t <token>
# OR stream real-time logs for a specific function
munk logs <function-id> --follow --t <token>
```

### 6. Health

Check server status, version, and uptime:

```bash
munk health --h http://localhost:3000/
```

---

## Authentication & Configuration

Authentication tokens and server host URLs can be specified via:

1. CLI flags: `--t` / `--token` and `--h` / `--host`
2. `munk.toml` fields: `token` and `domain`
3. Environment variables: `MUNK_TOKEN` and `MUNK_HOST`

### `munk.toml` Template

```toml
[app]
path = "./script.ts"
name = "my-func"            # (optional) Function name
domain = "http://localhost:3000/" # (optional) Server host URL
token = "your-admin-token"  # (optional) Auth token
env = "./prod.env"          # (optional) Path to env file
cpu = "50ms"                # (optional) CPU time limit
wall = "10s"                # (optional) Wall time limit
```
