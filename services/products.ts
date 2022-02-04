import * as cache from "./cache.ts";

export function get(id: string) {
  const data = cache.get(id, () => {
    return {
      id: "3",
      data: "test 3",
    };
  });
  return data;
}

export function getAll(after?: string) {
  const data = cache.getAll();
  return data;
}
