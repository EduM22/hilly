const cache = new Map<string, string>();

cache.set(
  "1",
  JSON.stringify({
    id: "1",
    data: "test 1",
  }),
);

cache.set(
  "2",
  JSON.stringify({
    id: "2",
    data: "test 2",
  }),
);

export function get(id: string, func: Function) {
  if (cache.has(id)) {
    return cache.get(id);
  } else {
    const data = func();
    /*const res = await func()
    const data = await res.json()*/
    cache.set(id, data);
    return data;
  }
}

export function getAll() {
  return cache;
}
