import { handleRequest } from './_handler';

export const onRequest: PagesFunction = ({ request }) => handleRequest(request);
