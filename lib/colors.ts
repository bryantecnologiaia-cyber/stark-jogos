export interface WordColorTheme {
  name: string;
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  glow: string;
}

export const WORD_COLORS: WordColorTheme[] = [
  {
    name: 'Esmeralda',
    bg: 'bg-emerald-500/25',
    border: 'border-emerald-400',
    text: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
  {
    name: 'Âmbar Solar',
    bg: 'bg-amber-500/25',
    border: 'border-amber-400',
    text: 'text-amber-300',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.45)',
  },
  {
    name: 'Ciano Neon',
    bg: 'bg-cyan-500/25',
    border: 'border-cyan-400',
    text: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.45)',
  },
  {
    name: 'Violeta Místico',
    bg: 'bg-purple-500/25',
    border: 'border-purple-400',
    text: 'text-purple-300',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  {
    name: 'Rosa Choque',
    bg: 'bg-pink-500/25',
    border: 'border-pink-400',
    text: 'text-pink-300',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    glow: 'rgba(236, 72, 153, 0.45)',
  },
  {
    name: 'Azul Real',
    bg: 'bg-blue-500/25',
    border: 'border-blue-400',
    text: 'text-blue-300',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    glow: 'rgba(59, 130, 246, 0.45)',
  },
  {
    name: 'Coral Tropical',
    bg: 'bg-orange-500/25',
    border: 'border-orange-400',
    text: 'text-orange-300',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    glow: 'rgba(249, 115, 22, 0.45)',
  },
  {
    name: 'Limão Vibrante',
    bg: 'bg-lime-500/25',
    border: 'border-lime-400',
    text: 'text-lime-300',
    badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
    glow: 'rgba(132, 204, 22, 0.45)',
  },
  {
    name: 'Fúcsia',
    bg: 'bg-fuchsia-500/25',
    border: 'border-fuchsia-400',
    text: 'text-fuchsia-300',
    badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    glow: 'rgba(217, 70, 239, 0.45)',
  },
  {
    name: 'Índigo Noturno',
    bg: 'bg-indigo-500/25',
    border: 'border-indigo-400',
    text: 'text-indigo-300',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    glow: 'rgba(99, 102, 241, 0.45)',
  },
  {
    name: 'Rubi Fogo',
    bg: 'bg-red-500/25',
    border: 'border-red-400',
    text: 'text-red-300',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    glow: 'rgba(239, 68, 68, 0.45)',
  },
  {
    name: 'Turquesa',
    bg: 'bg-teal-500/25',
    border: 'border-teal-400',
    text: 'text-teal-300',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    glow: 'rgba(20, 184, 166, 0.45)',
  },
];

export function getWordColor(index: number): WordColorTheme {
  return WORD_COLORS[index % WORD_COLORS.length];
}
