import { handleRequest } from './_handler';
import type { Env } from './_order-repository';

export const onRequest: PagesFunction<Env> = ({ request, env }) => handleRequest(request, env);
