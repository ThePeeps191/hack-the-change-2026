import "server-only";

export const ok = <T>(data: T, init?: ResponseInit) => Response.json(data, init);
export const noContent = () => new Response(null, { status: 204 });
export const fail = (error: string, status = 400) => Response.json({ error }, { status });

export async function body<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}
