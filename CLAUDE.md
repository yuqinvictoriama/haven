# Haven

Haven helps a domestic violence survivor in California turn scattered notes about abuse into an organized summary she can bring to a court self-help center or advocate when asking for a restraining order. Claude reads her entries, groups them into patterns (including non-physical abuse like isolation and financial control), flags danger signs, and drafts a description of abuse using only her own words.

This is a 4-hour hackathon project. The current plan lives in PLAN.md. Read it at the start of each session.

## Working style

- Keep it simple. Choose the simplest approach that works. Do not add features, abstractions, or dependencies that the current step does not need.
- Plan before big changes. For anything touching more than one or two files, describe the plan in a few bullets and wait for my OK.
- Work in small steps. Each step should leave the app running. After each step, tell me exactly how to check it.
- Verify, don't assume. Run the app or the code you changed before saying it works. If you could not verify something, say so.
- Stay in scope. Do not refactor or restyle code unrelated to the current task.
- Ask when unclear rather than guessing.
- Commit after each working step with a short, descriptive message. Changes reach main through a pull request (branch → PR → CI → merge; see pipeline.md).

## Code conventions

- React + Vite (JavaScript). Screens live in src/, server code in api/ (Vercel functions). Follow the existing styling. Approved: @anthropic-ai/sdk. No other dependencies without asking first.
- Small, readable components and functions with clear names. Prefer plain code over clever code.
- Handle errors visibly: if a Claude API call fails, show a friendly message in the UI and log the details to the console.
- Put prompts in their own files under /prompts so they are easy to read and edit.

## Security and data

- The Anthropic API key (ANTHROPIC_API_KEY) lives only in .env.local and in Vercel's environment variables, and is read only in api/ code. Never send it to the browser, print it, or commit it.
- Use only synthetic data. Never add real personal or health information, including in tests and examples.

## Product rules

- Not legal advice. Any screen with legal content says: "This is not legal advice. Review with a court self-help center or advocate before filing."
- Never invent facts. Drafts use only what is in the user's entries, and every statement points to the entry it came from.
- Never say something "is illegal". At most: "may be relevant to California Family Code section 6320".
- Err toward safety. If an entry mentions danger signs (for example strangulation, weapons, threats to kill), show the National Domestic Violence Hotline (1-800-799-7233) and "If you are in danger now, call 911". Do not show numeric risk scores.
- Tone is calm, plain, and supportive.
