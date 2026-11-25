// Run once with `bun run tokenize` to print the real token splits and IDs that
// are pasted into src/data/sentence.ts. Uses cl100k_base, the GPT-4 encoding.

import { decode, encode } from 'gpt-tokenizer/encoding/cl100k_base'

const TEXTS: Record<string, string> = {
  prompt: "The dog didn't cross the street because it was too",
  germanWord: 'Donaudampfschifffahrtsgesellschaft',
  nextWordCandidates: ' tired wide busy scared hot',
  secondStepCandidates: '. to and,',
}

for (const [name, text] of Object.entries(TEXTS)) {
  const pieces = encode(text).map((id) => ({ text: decode([id]), id }))
  console.log(`// ${name}: ${JSON.stringify(text)}`)
  console.log(JSON.stringify(pieces))
  console.log()
}
