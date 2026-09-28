'use client';

import React, { useState } from 'react';
import { Wand2, Sparkles, Loader2, Play } from 'lucide-react';
import { Category, Difficulty, WordDefinition } from '@/types/game';
import { sounds } from '@/lib/soundEffects';

interface CustomThemeModalProps {
  onStartCustomGame: (category: Category, difficulty: Difficulty, words: WordDefinition[]) => void;
}

const PRESET_IDEAS = [
  'Mundo dos Games & RPGs',
  'Praias do Litoral Brasileiro',
  'Filmes de Ficção Científica',
  'Carros e Velocidade',
  'Rock & Guitarras',
  'Mitologia Nórdica e Deuses',
];

export const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ onStartCustomGame }) => {
  const [themeInput, setThemeInput] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medio');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (targetTheme: string) => {
    const trimmed = targetTheme.trim();
    if (!trimmed) {
      setErrorMsg('Por favor, digite um tema ou escolha uma sugestão.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: trimmed }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar palavras');
      }

      const data = await res.json();
      const generatedWords: WordDefinition[] = data.words || [];

      if (generatedWords.length === 0) {
        throw new Error('Nenhuma palavra foi gerada para este tema');
      }

      const customCategory: Category = {
        id: `custom-${Date.now()}`,
        name: data.theme || trimmed,
        description: `Caça-palavras temático personalizado sobre ${trimmed}.`,
        iconName: 'Sparkles',
        color: 'purple',
        bgGradient: 'from-purple-950 via-slate-900 to-slate-950',
        words: generatedWords,
      };

      sounds.playSelectLetter(0);
      onStartCustomGame(customCategory, difficulty, generatedWords);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Não foi possível gerar este tema agora. Tente outro tema ou escolha uma sugestão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Gerador com Inteligência Artificial</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Crie seu Caça-Palavras com Qualquer Tema
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Digite um tema do seu interesse e a IA criará uma lista de palavras personalizadas com curiosidades e pistas em português!
          </p>
        </div>

        {/* Input & Form */}
        <div className="flex flex-col gap-3">
          <label htmlFor="custom-theme-input" className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Qual tema você deseja jogar?
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="custom-theme-input"
              type="text"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder="Ex: Culinária Japonesa, Animes dos Anos 90, Instrumentos Musicais..."
              maxLength={70}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-400 text-sm"
            />

            <button
              onClick={() => handleGenerate(themeInput)}
              disabled={loading || !themeInput.trim()}
              type="button"
              className={`
                flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all
                ${!loading && themeInput.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando Palavras...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Grade</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 mt-1 font-semibold">{errorMsg}</p>
          )}
        </div>

        {/* Difficulty Selector */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300">Dificuldade Desejada:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['facil', 'medio', 'dificil', 'mestre'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`
                  py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all
                  ${difficulty === d
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-black'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}
                `}
              >
                {d === 'facil' ? 'Fácil (10x10)' : d === 'medio' ? 'Médio (12x12)' : d === 'dificil' ? 'Difícil (14x14)' : 'Mestre (16x16)'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Ideas suggestions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400">Sugestões Rápidas:</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => {
                  setThemeInput(idea);
                  handleGenerate(idea);
                }}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-slate-800 transition-all cursor-pointer"
              >
                + {idea}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
