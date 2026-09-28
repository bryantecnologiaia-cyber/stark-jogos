import { Coordinate, Difficulty, Direction, PlacedWord, WordDefinition, WordSearchGrid } from '@/types/game';

// Normalize Portuguese words: remove accents, spaces, hyphens, and convert to uppercase
export function normalizeWord(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

interface DirectionVector {
  type: Direction;
  dr: number;
  dc: number;
}

const ALL_DIRECTIONS: Record<Difficulty, DirectionVector[]> = {
  facil: [
    { type: 'horizontal', dr: 0, dc: 1 },
    { type: 'vertical', dr: 1, dc: 0 },
  ],
  medio: [
    { type: 'horizontal', dr: 0, dc: 1 },
    { type: 'vertical', dr: 1, dc: 0 },
    { type: 'diagonal-down-right', dr: 1, dc: 1 },
    { type: 'diagonal-up-right', dr: -1, dc: 1 },
  ],
  dificil: [
    { type: 'horizontal', dr: 0, dc: 1 },
    { type: 'horizontal-reverse', dr: 0, dc: -1 },
    { type: 'vertical', dr: 1, dc: 0 },
    { type: 'vertical-reverse', dr: -1, dc: 0 },
    { type: 'diagonal-down-right', dr: 1, dc: 1 },
    { type: 'diagonal-up-right', dr: -1, dc: 1 },
    { type: 'diagonal-down-left', dr: 1, dc: -1 },
    { type: 'diagonal-up-left', dr: -1, dc: -1 },
  ],
  mestre: [
    { type: 'horizontal', dr: 0, dc: 1 },
    { type: 'horizontal-reverse', dr: 0, dc: -1 },
    { type: 'vertical', dr: 1, dc: 0 },
    { type: 'vertical-reverse', dr: -1, dc: 0 },
    { type: 'diagonal-down-right', dr: 1, dc: 1 },
    { type: 'diagonal-up-right', dr: -1, dc: 1 },
    { type: 'diagonal-down-left', dr: 1, dc: -1 },
    { type: 'diagonal-up-left', dr: -1, dc: -1 },
  ],
};

// Brazilian Portuguese letter frequency distribution for natural board appearance
const PORTUGUESE_WEIGHTED_LETTERS = 
  'AAAAAAAAAAAAA' +
  'EEEEEEEEEEE' +
  'OOOOOOOOOO' +
  'SSSSSSSS' +
  'RRRRRRR' +
  'IIIIIII' +
  'NNNNNN' +
  'DDDDD' +
  'MMMMM' +
  'UUUU' +
  'TTTT' +
  'CCCC' +
  'LLLL' +
  'PPPP' +
  'VVV' +
  'GGG' +
  'BBB' +
  'FF' +
  'HH' +
  'ZZ' +
  'JJ' +
  'X' +
  'Q';

function getRandomPortugueseLetter(): string {
  const index = Math.floor(Math.random() * PORTUGUESE_WEIGHTED_LETTERS.length);
  return PORTUGUESE_WEIGHTED_LETTERS[index];
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateWordSearch(
  wordDefinitions: WordDefinition[],
  size: number,
  difficulty: Difficulty
): WordSearchGrid {
  const rows = size;
  const cols = size;

  // Initialize empty grid matrix
  const matrix: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '')
  );

  const availableDirections = ALL_DIRECTIONS[difficulty];
  const placedWords: PlacedWord[] = [];
  const unplacedWords: string[] = [];

  // Filter and normalize words that can fit in the grid
  const validWords = wordDefinitions
    .map(def => ({
      ...def,
      normalized: normalizeWord(def.word),
    }))
    .filter(w => w.normalized.length >= 2 && w.normalized.length <= Math.max(rows, cols));

  // Sort longest words first for higher placement probability
  const sortedWords = [...validWords].sort(
    (a, b) => b.normalized.length - a.normalized.length
  );

  let colorCounter = 0;

  for (const item of sortedWords) {
    const word = item.normalized;
    const len = word.length;
    let placed = false;

    // Try up to 150 random positions & directions for this word
    const shuffledDirs = shuffle(availableDirections);
    
    // Create random start coordinates
    const candidateCoords: Coordinate[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        candidateCoords.push({ row: r, col: c });
      }
    }
    const shuffledCoords = shuffle(candidateCoords);

    for (const dir of shuffledDirs) {
      if (placed) break;

      for (const start of shuffledCoords) {
        // Check if word fits inside boundary with this direction
        const endRow = start.row + dir.dr * (len - 1);
        const endCol = start.col + dir.dc * (len - 1);

        if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) {
          continue;
        }

        // Check for collisions or valid letter sharing
        let canPlace = true;
        const currentPath: Coordinate[] = [];

        for (let i = 0; i < len; i++) {
          const r = start.row + dir.dr * i;
          const c = start.col + dir.dc * i;
          const existingChar = matrix[r][c];

          if (existingChar !== '' && existingChar !== word[i]) {
            canPlace = false;
            break;
          }
          currentPath.push({ row: r, col: c });
        }

        if (canPlace) {
          // Write letters into grid matrix
          for (let i = 0; i < len; i++) {
            const coord = currentPath[i];
            matrix[coord.row][coord.col] = word[i];
          }

          placedWords.push({
            id: `word-${item.normalized}-${placedWords.length}`,
            word: item.normalized,
            displayWord: item.displayWord,
            clue: item.clue,
            trivia: item.trivia,
            start,
            end: { row: endRow, col: endCol },
            direction: dir.type,
            path: currentPath,
            colorIndex: colorCounter++,
            isFound: false,
          });

          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      unplacedWords.push(item.displayWord);
    }
  }

  // Fill empty spots with realistic Portuguese frequency letters
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === '') {
        matrix[r][c] = getRandomPortugueseLetter();
      }
    }
  }

  return {
    matrix,
    rows,
    cols,
    placedWords,
    unplacedWords,
  };
}

/**
 * Calculates a straight path between two coordinates if they are on a line (horizontal, vertical, or 45-degree diagonal).
 * Returns null if not aligned.
 */
export function getSelectionPath(start: Coordinate, end: Coordinate): Coordinate[] | null {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;

  // Single cell selection
  if (dRow === 0 && dCol === 0) {
    return [start];
  }

  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);

  // Check valid directions: horizontal, vertical, or 45-degree diagonal
  const isHorizontal = dRow === 0;
  const isVertical = dCol === 0;
  const isDiagonal = absRow === absCol;

  if (!isHorizontal && !isVertical && !isDiagonal) {
    return null; // Not aligned in a straight line
  }

  const stepRow = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
  const stepCol = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;
  const steps = Math.max(absRow, absCol);

  const path: Coordinate[] = [];
  for (let i = 0; i <= steps; i++) {
    path.push({
      row: start.row + stepRow * i,
      col: start.col + stepCol * i,
    });
  }

  return path;
}

/**
 * Checks whether two coordinate paths are identical (either forward or backward)
 */
export function arePathsEqual(pathA: Coordinate[], pathB: Coordinate[]): boolean {
  if (pathA.length !== pathB.length) return false;

  // Check forward match
  let forwardMatch = true;
  for (let i = 0; i < pathA.length; i++) {
    if (pathA[i].row !== pathB[i].row || pathA[i].col !== pathB[i].col) {
      forwardMatch = false;
      break;
    }
  }
  if (forwardMatch) return true;

  // Check reverse match
  let reverseMatch = true;
  for (let i = 0; i < pathA.length; i++) {
    const revIdx = pathA.length - 1 - i;
    if (pathA[i].row !== pathB[revIdx].row || pathA[i].col !== pathB[revIdx].col) {
      reverseMatch = false;
      break;
    }
  }
  return reverseMatch;
}

/**
 * Extracts the concatenated uppercase string for a given path from the matrix
 */
export function getWordFromPath(matrix: string[][], path: Coordinate[]): string {
  return path.map(p => matrix[p.row][p.col]).join('');
}
