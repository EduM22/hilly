# hilly

hilly is a cli for [munk faas service](https://github.com/EduM22/munk-runner/)

## Install cli

run this in the cmd:\
`deno install -g -n hilly --allow-env=ESBUILD_BINARY_PATH,ESBUILD_WORKER_THREADS,DENO_TRACE_PERMISSIONS --allow-read --allow-write --allow-run --allow-net -c deno.json -f ./src/main.ts`

## Deploy

`hilly deploy <entry-point-file> --t <token> --h <domain> (optional) --env-file <file> (optional)`\
`hilly deploy ./munk.toml --t <token>`

### munk.toml template

```
[app]
path = "./<script>.ts"
domain = "http://localhost:3000/" (optional)
env = "./prod.env" (optional)
```
