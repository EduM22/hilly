import client from "../utils/client.ts";

export async function getProducts(params: {
  id: string,
  limit: number,
  offset: string
}) {
  try {
    await client.connect();
  
    const results = await client.queryObject({
      text: "SELECT * FROM product WHERE uid = $1 LIMIT $2 OFFSET $3",
      args: [params.id, params.limit, params.offset],
    });

    return results.rows[0];
  } catch (error) {
    throw new Error("DB error", {
      cause: error
    });
  } finally {
    await client.end();
  }
}