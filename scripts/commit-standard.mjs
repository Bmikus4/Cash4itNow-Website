// The commit-message standard, as an executable rule set.
//
// One idea: a commit message states what is now TRUE that was not true before. The diff
// already records which lines moved and the task list already records what was asked; a
// message that repeats either of those has spent a reader's attention and told them
// nothing. So the rules below reject the three ways that happens — naming nothing
// ("fix"), naming files ("Update ChatScreen.tsx"), and naming the request ("as
// requested") — and require a body that says what was broken once a change is big enough
// that "what was broken" is not obvious from one line.
//
// The rules are the HoH quote tool's, whose tests/commitMessage.test.ts pins each one with a
// legal example. This repo has no test runner, so change a rule there first and copy it here.
//
// Used two ways:
//   import { checkCommitMessage } from "./commit-standard.mjs"   // pure, testable
//   node scripts/commit-standard.mjs .git/COMMIT_EDITMSG          // the commit-msg hook

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Commits git itself writes. Not authored prose, so not ours to judge — and rejecting a
// merge mid-rebase would wedge the working tree for no benefit.
const MACHINE = /^(merge\b|revert\b|fixup!|squash!|amend!|data:|reembed:|nightly:)/i;

const SUBJECT_MAX = 80;

// A subject that is nothing but a category.
const VACUOUS_WHOLE =
  /^(fix(es|ed)?|updates?|updated|changes?|changed|wip|misc|miscellaneous|cleanup|clean ?up|tweaks?|tweaked|refactors?|refactored|improve[ds]?|improvements?|stuff|patch|various|minor|chore|edits?|polish|touch ?ups?)$/i;

// A vague verb applied to a vague object: "fix it", "update stuff", "fixed the thing".
const VAGUE_VERB =
  "(fix(es|ed)?|update[ds]?|change[ds]?|edit(ed|s)?|adjust(ed|s)?|tweak(ed|s)?|improve[ds]?|refactor(ed|s)?|clean(ed)?(\\s?up)?|correct(ed|s)?|resolve[ds]?|address(ed|es)?|apply|applied|make|makes|made|do|does|did|handle[ds]?|sort(ed)?(\\sout)?)";
const VAGUE_OBJECT =
  "(it|this|that|these|those|thing|things|stuff|bug|bugs|issue|issues|error|errors|typo|typos|problem|problems|code|some|everything|all)";
const VACUOUS_PAIR = new RegExp(
  `^${VAGUE_VERB}(\\s(a|an|the|some|few|couple\\sof))*\\s${VAGUE_OBJECT}\\b`,
  "i",
);

// "various improvements", "misc changes", "minor fixes".
const VACUOUS_QUALIFIED =
  /^(various|misc|miscellaneous|minor|small|some|a few|several|assorted|general)\s+(fix(es)?|update[sd]?|change[sd]?|improvements?|tweaks?|edits?|things?|stuff|cleanup|work)\b/i;

const FILE_TOKEN =
  /^[\w@./\\-]*\.(ts|tsx|js|jsx|mjs|cjs|json|css|scss|md|mdx|sh|ya?ml|html|sql|txt|toml|lock)$/i;

// Describing the conversation instead of the software.
const CONTEXT_REHASH =
  /\b(as\s(you\s)?(requested|asked|discussed|instructed|specified|agreed)|as\sper\s(your|the|our)|per\s(your|the|our)\s(request|message|instruction|ask|note|chat|conversation|discussion)|you\s(asked|wanted|requested|said)|we\sdiscussed|like\s(you|i)\ssaid|what\syou\swanted|as\sagreed)\b/i;

// Ben's standing rule: no emojis anywhere. Deliberately excludes the punctuation ranges
// that carry real typographic meaning here — em dash, curly quotes, arrows.
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2049}\u{203C}]/u;

const TRAILER =
  /^(co-authored-by|signed-off-by|reviewed-by|acked-by|tested-by|reported-by|suggested-by|refs|ref|closes|resolves|see-also|cc|change-id):\s/i;

/** A change small enough that one honest line is the whole story. */
function isTrivial(filesChanged, linesChanged) {
  return filesChanged <= 1 && linesChanged < 20;
}

const normalise = s => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * @param {{message: string, filesChanged?: number, linesChanged?: number}} input
 * @returns {{rule: string, detail: string}[]} empty means the message is legal
 */
export function checkCommitMessage({ message, filesChanged = 1, linesChanged = 0 }) {
  const violations = [];
  const add = (rule, detail) => violations.push({ rule, detail });

  // git appends a commented template; it is not part of the message.
  const lines = String(message ?? "")
    .split(/\r?\n/)
    .filter(l => !l.startsWith("#"));

  const subject = (lines[0] ?? "").trim();

  if (subject.length === 0) {
    add("SUBJECT_LENGTH", "the message is empty; say what is now true that was not before");
    return violations;
  }

  if (MACHINE.test(subject)) return violations;

  if (subject.length > SUBJECT_MAX) {
    add(
      "SUBJECT_LENGTH",
      `the subject is ${subject.length} characters; keep it to ${SUBJECT_MAX} and move the detail into the body`,
    );
  }

  if (EMOJI.test(lines.join("\n"))) {
    add("NO_EMOJI", "no emojis anywhere, including the body");
  }

  if (VACUOUS_WHOLE.test(subject) || VACUOUS_PAIR.test(subject) || VACUOUS_QUALIFIED.test(subject)) {
    add(
      "VACUOUS",
      `"${subject}" names a category, not an outcome; say what behaves differently now`,
    );
  }

  const words = subject.split(/[\s,;]+/).filter(Boolean);
  const fileWords = words.filter(w => FILE_TOKEN.test(w));
  if (fileWords.length > 0 && fileWords.length >= Math.ceil(words.length / 2)) {
    add(
      "FILE_SUBJECT",
      `the subject is mostly file names (${fileWords.join(", ")}); the diff already lists those`,
    );
  }

  if (CONTEXT_REHASH.test(subject)) {
    add(
      "CONTEXT_REHASH",
      "the subject describes the request, not the result; a reader in six months has no request to refer to",
    );
  }

  if (!isTrivial(filesChanged, linesChanged)) {
    const bodyLines = lines
      .slice(1)
      .filter(l => l.trim().length > 0 && !TRAILER.test(l.trim()));
    const bodyText = bodyLines.join(" ").trim();
    const informative =
      bodyText.length >= 20 && normalise(bodyText) !== normalise(subject);
    if (!informative) {
      add(
        "BODY_REQUIRED",
        `${filesChanged} files / ${linesChanged} lines changed: the body must say what was broken and what happens now`,
      );
    }
  }

  return violations;
}

// --- hook entry point -----------------------------------------------------------------

function stagedStats() {
  try {
    const out = execFileSync("git", ["diff", "--cached", "--numstat"], { encoding: "utf8" });
    const rows = out.split(/\r?\n/).filter(Boolean);
    let lines = 0;
    for (const r of rows) {
      const [add, del] = r.split(/\t/);
      // "-" is git's marker for a binary file: no line count exists.
      lines += (add === "-" ? 0 : Number(add) || 0) + (del === "-" ? 0 : Number(del) || 0);
    }
    return { filesChanged: rows.length, linesChanged: lines };
  } catch {
    // Cannot read the index (amend, unusual hook context). Assume non-trivial: the worst
    // case is being asked for a body we did not strictly need.
    return { filesChanged: 2, linesChanged: 50 };
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (invokedDirectly) {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node scripts/commit-standard.mjs <path-to-commit-message-file>");
    process.exit(2);
  }
  const message = readFileSync(path, "utf8");
  const violations = checkCommitMessage({ message, ...stagedStats() });

  if (violations.length > 0) {
    const subject = message.split(/\r?\n/).find(l => !l.startsWith("#"))?.trim() ?? "";
    console.error("\nThis commit message does not meet the repo standard.\n");
    console.error(`  subject: ${subject || "(empty)"}\n`);
    for (const v of violations) console.error(`  ${v.rule}\n    ${v.detail}\n`);
    console.error("A good message says what is now true that was not true before. From this");
    console.error("repo's own history:\n");
    console.error("  No draft means a NEW quote, not a new conversation on yesterday's quote");
    console.error("  You could not set a client, a venue or a recipient from a phone");
    console.error("  One SSE reader, and the CRM chat stops dropping half an event\n");
    console.error("The standard, with the reasoning: ~/.claude/CLAUDE.md, \"Writing things down\"");
    console.error("To bypass once (and you should need a reason): git commit --no-verify\n");
    process.exit(1);
  }
}
