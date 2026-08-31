import type { Employee } from '../../src/org/types'

// Deterministic PRNG (mulberry32) so property-test failures are reproducible
// from the seed alone.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SYLLABLES = ['ka', 'ri', 'mo', 'ta', 'lu', 'ne', 'so', 'vi', 'ba', 'du', 'fe', 'zo']

function randomWord(rand: () => number): string {
  const parts = 2 + Math.floor(rand() * 2)
  let word = ''
  for (let i = 0; i < parts; i++) word += SYLLABLES[Math.floor(rand() * SYLLABLES.length)]
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Builds a single-rooted, acyclic department of n employees (1..30) for
 * property tests only — never used for the demo department, so the app
 * never grades its own homework. Each employee after the first picks a
 * parent uniformly from those already created, which makes the tree valid
 * by construction; source order is then shuffled.
 */
export function makeDepartment(seed: number, n: number): Employee[] {
  if (n < 1 || n > 30) throw new Error('makeDepartment: n must be between 1 and 30')
  const rand = mulberry32(seed)
  const created: Employee[] = []
  for (let i = 0; i < n; i++) {
    const managerId = i === 0 ? null : created[Math.floor(rand() * created.length)].employee_id
    created.push({
      employee_id: `G${i}`,
      name: randomWord(rand),
      role: randomWord(rand),
      monthly_salary: 20000 + Math.floor(rand() * 100000),
      manager_id: managerId,
    })
  }
  return shuffle(created, rand)
}
