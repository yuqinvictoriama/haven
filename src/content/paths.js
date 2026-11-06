// The two legal paths Haven's documents support, in the order things are usually done in
// California, with the court or police steps that happen between the documents.
//
// Sources (checked 2026-11-06):
// - California Courts Self-Help: Ask for a restraining order in a domestic violence case
//   https://selfhelp.courts.ca.gov/DV-restraining-order and .../fill-forms
// - California Courts Self-Help: Guide to Protective Orders (EPO, CPO, restraining orders)
//   https://selfhelp.courts.ca.gov/fa/node/2290
// - Judicial Council forms DV-100, DV-101, DV-105, DV-109, DV-110, DV-130, DV-200, CLETS-001,
//   EPO-001, CR-160; Family Code sections 242 (hearing within 21 days, 25 for good cause),
//   6228 (free copy of the police report), 6345 (renewal); CalVCB 1-800-777-9229.
// Wording follows the product rules: no legal conclusions, "may be relevant to", not legal advice.

export const PATHS = [
  {
    id: 'dvro',
    title: 'Restraining order',
    label: 'Restraining order',
    court: 'Civil: family court',
    intro:
      'A Domestic Violence Restraining Order (DVRO) is a civil court order you ask for yourself. No lawyer and no filing fee are needed. A judge usually decides on a temporary order the same day or the next business day, and a hearing follows within about three weeks.',
    steps: [
      { kind: 'safety_plan', why: 'Do this first. The other person will be served with your papers, which can raise the risk for a while.' },
      { kind: 'advocate_summary', why: 'Bring this to a domestic violence advocate or the court self-help center before you fill in the forms.' },
      { kind: 'timeline', why: 'Get the dates straight before writing the forms. The judge reads incidents in order.' },
      { kind: 'exhibit_list', why: 'Number your evidence now so the forms can point to “Exhibit 3” instead of “a screenshot”.' },
      { kind: 'dvro', why: 'The main form the court reads. Copy these answers onto DV-100.' },
      { kind: 'dv101', why: 'Attach to DV-100 when the incidents need more room than the form gives.' },
      {
        info: 'File at the courthouse',
        detail: 'Take DV-100 (with DV-101 and your exhibits), CLETS-001, DV-109, and DV-110 to the clerk. Add DV-105 if you want custody or visitation orders. No fee. The judge decides on a temporary order (DV-110) the same day or the next business day.',
      },
      {
        info: 'Serve the papers',
        detail: 'Someone over 18 who is not you, or the sheriff for free, hands the papers to the other person at least 5 days before the hearing (the date on DV-109). Then file DV-200, Proof of Service.',
      },
      {
        info: 'Court hearing',
        detail: 'Within 21 days of the temporary order (25 with good cause). Bring your exhibit list and exhibits. If granted, the order (DV-130) can last up to 5 years and can be renewed in the 3 months before it ends.',
      },
    ],
  },
  {
    id: 'criminal',
    title: 'Criminal case',
    label: 'Criminal case',
    court: 'Criminal: police and the District Attorney',
    intro:
      'In a criminal case the state brings the charges, not you. It starts with a police report. The District Attorney (DA) decides whether to file, and the court can issue a Criminal Protective Order (CPO). You can have a restraining order and a criminal case at the same time.',
    steps: [
      {
        info: 'If you are in danger now',
        detail: 'Call 911. The officer can ask a judge, any hour, for an Emergency Protective Order (EPO-001). It usually lasts 5 to 7 days, long enough to file for a restraining order.',
      },
      { kind: 'safety_plan', why: 'A report or arrest can change the other person’s behavior. Plan for the days after.' },
      { kind: 'advocate_summary', why: 'DA offices have victim advocates (Victim-Witness Assistance). This page gives them the picture in one read.' },
      { kind: 'timeline', why: 'Officers and detectives take a statement. Dates in order make it accurate.' },
      { kind: 'exhibit_list', why: 'An index of what you can hand over: screenshots, recordings, photos, witnesses.' },
      { kind: 'criminal_case', why: 'Your statement, evidence index, and the offenses police or the DA may consider.' },
      {
        info: 'Police report',
        detail: 'Ask for the report number. You are entitled to a free copy of the domestic violence incident report (Family Code 6228); the face sheet within 48 hours of asking.',
      },
      {
        info: 'District Attorney review',
        detail: 'The DA decides whether to file charges. If a case is filed, the judge usually issues a Criminal Protective Order (CR-160) at the first court date; it can last up to 10 years. Marsy’s Law gives you the right to be told about hearings and to be heard.',
      },
      {
        info: 'Support and costs',
        detail: 'The California Victim Compensation Board (CalVCB, 1-800-777-9229) can help with medical, counseling, and relocation costs. Your advocate can apply with you.',
      },
    ],
  },
]

// Which paths a document belongs to, with its step number in each.
export function pathsFor(kind) {
  const out = []
  for (const p of PATHS) {
    const i = p.steps.findIndex((s) => s.kind === kind)
    if (i >= 0) out.push({ id: p.id, title: p.title, step: i + 1 })
  }
  return out
}
