import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Caça-Palavras Infinito | Níveis Progressivos e Temas',
  description: 'Jogo de caça-palavras moderno e dinâmico em português com níveis progressivos de dificuldade, trilha de aventura, temas variados e gerador de desafios.',
  openGraph: {
    title: 'Caça-Palavras Infinito',
    description: 'Jogo de caça-palavras moderno e dinâmico em português com níveis progressivos de dificuldade, trilha de aventura, temas variados e gerador de desafios.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Caça-Palavras Infinito',
    description: 'Jogo de caça-palavras moderno e dinâmico em português com níveis progressivos de dificuldade e temas variados.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950 min-h-screen">
        {children}
      </body>
    </html>
  );
}
