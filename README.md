# hilly

hilly is a cli for [munk faas service](https://github.com/EduM22/munk-runner/)

## Install cli

run this in the cmd:\
`deno install -g -n hilly --allow-env=ESBUILD_BINARY_PATH,ESBUILD_WORKER_THREADS,DENO_TRACE_PERMISSIONS --allow-read --allow-net -c deno.json -f ./src/main.ts`

## Deploy

`hilly deploy <entry-point-file> --t <token> --h <domain> (optional)`\
`hilly deploy ./munk.toml`

### munk.toml template

```
[app]
path = "./<script>.ts"
domain = "http://localhost:3000/" (optional)
token = "<test123>"
```
