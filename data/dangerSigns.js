// Danger signs that advocates treat as serious. The prompt asks Claude to flag
// them, and api/analyze.js also checks every entry for these keywords, so an
// entry is flagged if either one finds a sign.
//
// Keywords are English words or short phrases. They match whole words in any
// capitalization ("kill me" does not match "kill myself"). A few extra matches
// are fine: it is safer to show the hotline too often than too rarely.

export const DANGER_SIGNS = [
  {
    id: 'strangulation',
    label: 'Strangulation or choking, including any hands on or pressure to the neck or throat',
    keywords: [
      'strangle', 'strangled', 'strangles', 'strangling', 'strangulation',
      'choke', 'choked', 'chokes', 'choking', 'chokehold',
      'neck', 'throat', 'windpipe',
      "couldn't breathe", 'couldnt breathe', 'could not breathe',
      "can't breathe", 'cant breathe', 'cannot breathe',
    ],
    reason: 'You wrote about your neck, throat, or breathing, which advocates treat as a serious danger sign even when it leaves no marks.',
  },
  {
    id: 'threats-to-kill',
    label: 'Threats to kill',
    keywords: [
      'kill me', 'kill you', 'kill her', 'kill him', 'kill them', 'kill us', 'kill ya',
      'kill my', 'kill your', 'kill the kids', 'kill the children', 'kill the baby', 'kill everyone',
      'murder me', 'murder you',
      "you're dead", 'you are dead', "you'll be dead", 'end up dead', 'wish you were dead',
    ],
    reason: 'You wrote about a threat to kill, which advocates treat as a serious danger sign.',
  },
  {
    id: 'weapon',
    label: 'A weapon or gun',
    keywords: [
      'gun', 'guns', 'handgun', 'pistol', 'rifle', 'shotgun', 'revolver', 'firearm', 'firearms',
      'bullet', 'bullets', 'knife', 'knives', 'weapon', 'weapons',
      'shoot me', 'shoot you', 'shoot her', 'shoot him', 'shoot us',
    ],
    reason: 'You wrote about a weapon, which advocates treat as a serious danger sign.',
  },
  {
    id: 'suicide-threat',
    label: 'The other person threatening suicide or to hurt themselves',
    keywords: [
      'suicide', 'suicidal',
      'kill himself', 'kill herself', 'kill themselves', 'killing himself', 'killing herself', 'killing themselves',
      'hurt himself', 'hurt herself', 'hurt themselves',
      'end his life', 'end her life', 'end their life', 'end it all',
      "can't live without me", 'cannot live without me', "won't live without me",
    ],
    reason: 'You wrote about a threat of suicide or self-harm, which advocates treat as a serious danger sign.',
  },
  {
    id: 'stalking',
    label: 'Stalking: being followed, watched, or tracked, especially after leaving',
    keywords: [
      'stalk', 'stalked', 'stalking', 'stalks', 'stalker',
      'followed me', 'following me', 'follows me',
      'tracked me', 'tracking me', 'tracks me', 'tracker', 'gps',
      'showed up at my work', 'showed up at my job', 'waiting outside my',
    ],
    reason: 'You wrote about being followed or tracked, which advocates treat as a serious danger sign.',
  },
  {
    id: 'pregnancy',
    label: 'Abuse during pregnancy',
    keywords: ['pregnant', 'pregnancy', 'miscarriage', 'miscarried', 'unborn'],
    reason: 'You mentioned pregnancy, and advocates treat abuse during pregnancy as a serious danger sign.',
  },
]

// One case-insensitive regex per sign. (?<!\w) and (?!\w) make each keyword
// match only as a whole word or phrase; spaces in a phrase match any spacing.
const SIGN_PATTERNS = DANGER_SIGNS.map((sign) => ({
  sign,
  pattern: new RegExp(`(?<!\\w)(?:${sign.keywords.map(toPattern).join('|')})(?!\\w)`, 'i'),
}))

function toPattern(keyword) {
  return keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')
}

// Returns the danger signs whose keywords appear in the text.
export function findDangerSigns(text) {
  const plain = text.replace(/[\u2018\u2019]/g, "'") // phones often type curly apostrophes
  return SIGN_PATTERNS.filter(({ pattern }) => pattern.test(plain)).map(({ sign }) => sign)
}
