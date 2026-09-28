import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { theme } = await req.json();

    if (!theme || typeof theme !== 'string' || theme.trim().length === 0) {
      return NextResponse.json({ error: 'Tema não fornecido' }, { status: 400 });
    }

    const cleanTheme = theme.trim().slice(0, 80);

    // If no API key configured, use intelligent fallback
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        words: getFallbackWords(cleanTheme),
        theme: cleanTheme,
        source: 'fallback',
      });
    }

    const ai = new GoogleGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Gere uma lista de 10 a 14 palavras em Português do Brasil para um jogo de caça-palavras sobre o tema: "${cleanTheme}".
Cada palavra deve ter entre 4 e 12 letras, ser única e estritamente relevante ao tema.
Forneça também uma pista curta e uma curiosidade educativa para cada uma.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: 'Palavra em maiúsculas sem espaços ou pontuação especial' },
                  displayWord: { type: Type.STRING, description: 'Palavra com acentuação e grafia correta em português' },
                  clue: { type: Type.STRING, description: 'Dica ou definição curta (máx 60 caracteres)' },
                  trivia: { type: Type.STRING, description: 'Fato curioso ou educativo sobre a palavra (1 a 2 frases)' },
                },
                required: ['word', 'displayWord', 'clue', 'trivia'],
              },
            },
          },
          required: ['words'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');

    if (!data.words || !Array.isArray(data.words) || data.words.length === 0) {
      return NextResponse.json({
        words: getFallbackWords(cleanTheme),
        theme: cleanTheme,
        source: 'fallback',
      });
    }

    return NextResponse.json({
      words: data.words,
      theme: data.theme || cleanTheme,
      source: 'gemini',
    });
  } catch (err: unknown) {
    console.error('Error generating words with Gemini:', err);
    // Return friendly fallback
    return NextResponse.json({
      words: getFallbackWords('Palavras Criativas'),
      theme: 'Palavras Criativas',
      source: 'fallback',
    });
  }
}

function getFallbackWords(theme: string) {
  // Safe generic Portuguese words relevant to games and exploration
  return [
    { word: 'DESAFIO', displayWord: 'Desafio', clue: 'Prova ou estímulo para a mente', trivia: 'Jogos de caça-palavras estimulam o foco e a memória de trabalho.' },
    { word: 'AVENTURA', displayWord: 'Aventura', clue: 'Jornada repleta de novidades e exploração', trivia: 'A busca por novidades libera dopamina no cérebro humano.' },
    { word: 'VITORIA', displayWord: 'Vitória', clue: 'Sucesso conquistado com dedicação', trivia: 'Comemorar pequenas vitórias fortalece a persistência.' },
    { word: 'ENIGMA', displayWord: 'Enigma', clue: 'Mistério a ser desvendado', trivia: 'Os enigmas fascinam a humanidade desde os tempos da Esfinge grega.' },
    { word: 'TESOURO', displayWord: 'Tesouro', clue: 'Riqueza valiosa ou bem precioso', trivia: 'O maior tesouro de um jogo é a diversão do aprendizado.' },
    { word: 'ESTRELA', displayWord: 'Estrela', clue: 'Astro luminoso no céu noturno', trivia: 'O Sol é a estrela mais próxima de nós, a 150 milhões de km.' },
    { word: 'HORIZONTE', displayWord: 'Horizonte', clue: 'Linha onde o céu e a terra parecem se encontrar', trivia: 'Em mar aberto, o horizonte visível fica a cerca de 4,7 km de distância.' },
    { word: 'SABEDORIA', displayWord: 'Sabedoria', clue: 'Conhecimento aplicado com discernimento', trivia: 'A sabedoria cresce conforme associamos novas ideias à experiência.' },
    { word: 'HARMONIA', displayWord: 'Harmonia', clue: 'Equilíbrio e beleza entre diferentes partes', trivia: 'Na música e na arte, a harmonia cria sensações de completude.' },
    { word: 'MISTERIO', displayWord: 'Mistério', clue: 'Algo que desperta a curiosidade e o raciocínio', trivia: 'O cérebro adora preencher lacunas e resolver quebra-cabeças.' },
  ];
}
