export async function graphql(token, query, variables) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    const transient =
      res.status >= 500 ||
      (res.ok &&
        Array.isArray(json?.errors) &&
        json.errors.length > 0 &&
        json.errors.every((error) =>
          error.message?.startsWith('Something went wrong while executing your query'),
        ));
    if ((!res.ok || json?.errors) && transient && attempt < 2) {
      console.warn(`GraphQL → ${res.status} : erreur temporaire, nouvelle tentative.`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
      continue;
    }
    if (!res.ok || json?.errors || typeof json !== 'object' || json === null) {
      throw new Error(`GraphQL → ${res.status} ${JSON.stringify(json?.errors ?? json)}`);
    }
    return json.data;
  }
}
