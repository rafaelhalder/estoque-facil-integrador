import type { Metadata } from 'next';
export const metadata: Metadata = {
  title:'Estoque Fácil · teste do projeto',
  description:'Teste o controle de estoque e conte como foi usar o sistema.',
  icons:{icon:'/favicon.svg'},
};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><head><link rel="stylesheet" href="/style.css" /></head><body>{children}</body></html>;
}
