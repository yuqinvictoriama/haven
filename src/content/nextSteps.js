// Guidance for after the survivor has filed or reported. Same sources as paths.js
// (California Courts Self-Help, Judicial Council forms, Family Code 242/6345, CalVCB),
// plus LawHelpCA.org and the State Bar of California's certified lawyer referral services.
// Wording follows the product rules: calm and plain, no legal conclusions, not legal advice.

export const NEXT_STEPS_INTRO =
  'Once you have filed for a restraining order or reported to the police, these are the steps that usually come next. Every county works a little differently, so check with your court self-help center or an advocate.'

export const NEXT_STEP_SECTIONS = [
  {
    id: 'court',
    title: 'Court steps for a restraining order',
    badge: 'Civil',
    intro: 'After you file DV-100, the judge decides on a temporary order and sets a hearing date.',
    items: [
      'Pick up your papers from the clerk: the temporary order (DV-110, if granted) and the notice of hearing (DV-109). Keep a copy with you at all times.',
      'Have the papers served. Someone over 18 who is not you, or the sheriff for free, hands them to the other person at least 5 days before the hearing. Then file DV-200 (Proof of Service).',
      'Get ready for the hearing. Bring three copies of your exhibit list and exhibits, your description of abuse, and the names of any witnesses. You can ask the clerk for a free interpreter.',
      'At the hearing, the judge may ask you questions about what happened. It is okay to read from your notes. An advocate can often come with you.',
      'If the order is granted, keep the final order (DV-130) with you. If the other person does not follow it, call 911 and show the order.',
      'An order can last up to 5 years. You can ask to renew it in the 3 months before it ends.',
    ],
  },
  {
    id: 'prosecutor',
    title: 'Working with the prosecutor',
    badge: 'Criminal',
    intro: 'In a criminal case, the District Attorney (DA) decides whether to file charges. You are a witness, not a party, but you have rights.',
    items: [
      'Write down the police report number and the officer’s name. Ask the DA’s office for the case number once a case is filed.',
      'Ask for the DA’s Victim-Witness advocate. They can explain each court date, help with safety planning, and keep you informed.',
      'Under Marsy’s Law you can ask to be told about hearings, to be present, and to be heard, including at sentencing.',
      'If you get a subpoena, it means you are being asked to testify. Call the Victim-Witness office with any questions or safety concerns before the date.',
      'Ask whether the judge issued a Criminal Protective Order (CR-160) and get a copy. It can be in place at the same time as a restraining order.',
      'The California Victim Compensation Board (CalVCB, 1-800-777-9229) may help with medical, counseling, and relocation costs. Your advocate can apply with you.',
    ],
  },
  {
    id: 'lawyer',
    title: 'Finding a free or low-cost lawyer',
    badge: 'Optional',
    intro: 'You do not need a lawyer for either path. Some people want one, especially if the other person has a lawyer or there are children involved.',
    items: [
      'LawHelpCA.org lists free legal aid organizations by county, including ones that focus on domestic violence.',
      'Local domestic violence organizations often have lawyers on staff or can refer you to a pro bono (free) lawyer.',
      'Your court self-help center can tell you about free legal clinics nearby.',
      'The State Bar of California lists certified lawyer referral services. Many offer a low-cost first meeting.',
      'Bring your Haven documents to the first meeting so the conversation starts from the facts.',
    ],
  },
]
