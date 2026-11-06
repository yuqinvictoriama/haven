// The four patterns Haven groups entries into. Used by the prompt (names and
// descriptions), the answer schema (names) and legalLinks (subsections).
//
// Keep the names exactly as they are: the Review screen shows them as-is.
// Subsections point to parts of California Family Code section 6320. The law
// text itself is not stored here.

export const CATEGORIES = [
  {
    name: 'Physical harm',
    description: "Hitting, pushing, grabbing, choking, or any other force used on someone's body.",
    subsections: ['6320(a)'],
  },
  {
    name: 'Threats & intimidation',
    description: 'Threats to hurt, kill, or punish someone, showing a weapon, or blocking, cornering, or breaking things to make someone afraid.',
    subsections: ['6320(a)', '6320(c)(4)'],
  },
  {
    name: 'Isolation & control',
    description: 'Cutting someone off from family, friends, or work, or watching and controlling where they go, who they talk to, or their phone.',
    subsections: ['6320(c)(1)', '6320(c)(3)'],
  },
  {
    name: 'Financial control',
    description: "Taking or controlling someone's money, pay, bank accounts, or basic needs, or making them ask for money.",
    subsections: ['6320(c)(2)', '6320(c)(3)'],
  },
]

export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name)
