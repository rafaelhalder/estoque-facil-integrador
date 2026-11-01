import { getChatGPTUser, chatGPTSignInPath } from '../chatgpt-auth';
import { inventoryHtml } from '../ui';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  if(!await getChatGPTUser()) return Response.redirect(new URL(chatGPTSignInPath('/estoque'),request.url));
  return new Response(inventoryHtml,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'"}});
}
