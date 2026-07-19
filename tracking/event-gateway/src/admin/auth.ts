import type { FastifyReply, FastifyRequest } from "fastify";

export function readBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export function requireAdminToken(expectedToken: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const token = readBearerToken(request);

    if (token !== expectedToken) {
      await reply.code(401).send({ error: "unauthorized" });
    }
  };
}

