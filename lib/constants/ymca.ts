/**
 * WNC YMCA reference data - branches, master class list, and normalization utilities.
 * Single source of truth for all YMCA-related constants shared between UI and automation.
 */

// =============================================================================
// Branches
// =============================================================================

export const YMCA_BRANCHES = [
  'Asheville YMCA',
  'Black Mountain YMCA',
  'Corpening Memorial YMCA',
  'Ferguson Family YMCA',
  'Hendersonville Family YMCA',
  'Reuter Family YMCA',
  'Woodfin YMCA',
] as const

export type YMCABranch = typeof YMCA_BRANCHES[number]

// =============================================================================
// Master Class List
// =============================================================================

export interface MasterClass {
  display: string
  normalized: string
}

/**
 * All classes offered across WNC YMCA branches.
 * Display names match exactly what appears on the YMCA schedule.
 * Compiled March 2026 from a full week of schedules across all branches.
 */
export const YMCA_MASTER_CLASSES: MasterClass[] = [
  '567BROADWAY!',
  'Ageless Grace',
  'All-Stars Basketball (50+)',
  'Aqua Fit',
  'Aqua Power Fusion',
  'Aqua Tabata',
  'Aqua Zumba',
  'Athletic Conditioning',
  'Barre',
  'Big FIT Kids Club',
  'BODYBALANCE',
  'BODYCOMBAT',
  'BODYPUMP',
  'BODYPUMP Express',
  'BODYPUMP HEAVY',
  'Booty Barre',
  'Bouncing Books',
  'Bridge Club',
  'Buti Yoga',
  'Cardio Dance',
  'Cardio Fusion',
  'Cardio Splash',
  'Chair Yoga',
  'Core Conditioning',
  'Cycle',
  'Cycle Express',
  'Cycle Fusion',
  'Cycle Interval Training',
  'Deep Water Fitness',
  'Define & Align',
  'Dynamic Dance',
  'Family-Friendly Cardio Dance',
  'FergFit Kids (6yrs+)',
  'FergFit Kids Jr. (ages 3-5)',
  'Ferguson Fit',
  'Flex and Stretch',
  'Fluid Movement',
  'Functional Flow',
  'Gentle Yoga',
  'HIIT',
  'HIT',
  'Hip Hop Fitness',
  'Holy Yoga',
  'Hydro Burn',
  'Intro to Pilates',
  'Kids Yoga 4-8 yrs',
  'Laughter Yoga',
  'Legends Basketball (35+)',
  'Les Mills Pilates',
  'Line Dancing',
  'Little FIT Kids Club',
  'LIVESTRONG at the YMCA',
  'Low Impact Conditioning',
  'Low Impact Fitness',
  'NIA',
  'Open Gym',
  'PAID-LiftMore For Bone Health',
  'Paid Program',
  'PAID PROGRAM Kids Ballet',
  'Pickle Ball',
  'Pilates',
  'PIYO Live',
  'Power Yoga',
  'Racquetball',
  'Restorative Yoga',
  'Rise and Shine',
  'Rock Steady Boxing',
  'RPM',
  'Sit to be Fit',
  'Slow Flow Yoga',
  'Somatic Relief',
  'Step',
  'Step & Pump',
  'Strength and Balance',
  'Strength Fusion',
  'Tai Chi',
  'Tai Chi 101',
  'Tai Chi -Advanced',
  'Tai Chi Club - Advanced',
  'Tai Chi for Energy',
  'Tai Chi-Arthritis & Balance',
  'Teen Strength & Conditioning',
  'The Groove',
  'Total Body Strength',
  'Total Body Training',
  'TRX',
  'TRX Tabata',
  'Vinyasa Yoga',
  'Westridge CrossFit',
  'Yin Yoga',
  'Yoga Nidra',
  'Yoga Sculpt',
  'Yogalates',
  'Zumba',
  'Zumba + Lift\u2122',
  'Zumba Gold',
  'Zumba Toning',
].map((display) => ({ display, normalized: normalizeClassName(display) }))

// =============================================================================
// Normalization & Matching
// =============================================================================

/**
 * Normalize a class name for fuzzy comparison.
 * Strips dashes, special characters (+, TM, !, &, parentheses),
 * lowercases, and collapses whitespace.
 */
export function normalizeClassName(name: string): string {
  let result = name.toLowerCase()

  // Strip known prefixes only when followed by actual content
  result = result.replace(/^canceled:\s*/i, '')
  result = result.replace(/^paid[\s-]*program\s+/i, '')
  result = result.replace(/^paid[\s-]+(?=\S)/i, '')

  return result
    .replace(/[-]/g, ' ')              // replace dashes with spaces (preserve word boundaries)
    .replace(/[+\u2122!&().,]/g, '')   // strip remaining special chars
    .replace(/\s+/g, '')               // strip all whitespace for matching
    .trim()
}

/**
 * Filter master classes by a search query using normalized comparison.
 * Returns classes whose normalized name contains the normalized query.
 */
export function fuzzyMatchClasses(
  query: string,
  classes: MasterClass[] = YMCA_MASTER_CLASSES
): MasterClass[] {
  const normalizedQuery = normalizeClassName(query)
  if (!normalizedQuery) return classes
  return classes.filter((c) => c.normalized.includes(normalizedQuery))
}
