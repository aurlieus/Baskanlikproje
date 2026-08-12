# The Directive — Project History & Design Rationale (for Claude Code)

**Purpose of this file:** narrative context. It explains *why* the project looks
the way it does, not just what it currently contains. For hard numbers, exact
constants, and code architecture, see `PROJECT-HANDOVER.md` — this document is
the story behind those numbers.

**Author's situation, unchanged throughout the project:** phone only, no
computer. Every line of code in this project was written by Claude, reviewed
and directed by the author through a chat interface, and tested through
simulation rather than manual play in most cases (manual play happened too,
but simulation caught almost every real bug).

---

## 1. Origin

The project began when the author found a simple mobile game — "President
Simulator Offline" — on Google Play, liked it, and asked whether something
like it could be built entirely with AI. The first response was a genuine
proof of concept: a small React artifact with 13 hand-written crisis events,
built and shown running in the same chat turn, specifically to demonstrate
that this was possible on a free Claude plan with no paid tools.

The author then shared screenshots of a **different, much deeper reference
game** — one with country selection, cabinet building, a Ministry-of-Finance-
style parliament vote with coalition math, policy sliders, an advisor
marketplace, and meta-progression currency. That reference reset the
project's ambition entirely: the goal stopped being "a card-choice game" and
became **"a deep governance simulation."**

**Target:** a real Google Play release. Not a portfolio piece, not a tech demo.

---

## 2. Design-first, not code-first

The author explicitly refused to let coding start before the design was
argued through in conversation. This produced a full design document
(`oyun-tasarim-dokumani-v2.md`, describing state as of engine v21 — now
outdated versus v57, see §8) before any engine code existed. Key decisions
made *in conversation*, before a single line of the engine was written:

- **The core identity**: not a swipe-card game. A document-signing simulation
  where every decision is inspectable before commitment.
- **Determinism over randomness.** Outcomes are never rolled by dice. Every
  outcome has a score function reading live game state; the higher score
  wins. The percentages shown to the player are real, and they change if the
  player changes the country's condition first. The author's own words for
  this: *"kumar değil, satranç"* — not gambling, chess.
- **v1 scope was deliberately narrower than the full vision.** Original
  vision: 5 departments, 5 document types, oversight system, 3-term arc,
  multi-country. v1 was cut to 3 departments (Ekonomi, İçişleri, Siyaset) and
  3 document types (Kanun, Kararname, Operasyon), reasoned explicitly:
  - Those three departments form a **closed loop**: Ekonomi generates money →
    İçişleri turns money into approval → Siyaset turns approval into
    coalition seats → coalition seats let you pass more Kanun → laws grow the
    economy. Removing Askeri didn't break this loop; removing Siyaset would
    have made parliament meaningless.
  - The three document types cover three distinct timing patterns:
    parliament+delay (Kanun), delay-only (Kararname), and instant
    (Operasyon). Program and Antlaşma, cut from v1, are variants of these two
    patterns and were expected to be cheap to add later.
- **Content volume was capped on purpose**: 2 categories × 3 actions per
  department for v1, chosen specifically to be small enough to *test the
  engine*, not to be the final content set.
- **Name:** *The Directive* — cold, bureaucratic, and literally describes the
  core verb of the game (signing directives).
- **Visual identity, decided before any code**: a two-layer language. The
  "shell" (panel, meters, lists) is dark and institutional. The "paper" layer
  (any document, briefing, or newspaper) is cream-toned with a typewriter
  font and a stamp animation — because signing a document is the emotional
  center of the game and should feel physically different from browsing menus.

---

## 3. Building the engine, and the long tail of fixing it

The engine was built with a deliberate architectural choice that mattered a
lot later: **the game logic is pure functions with zero React dependency**,
sitting in one contiguous block of the file between the icon imports and the
storage layer. Throughout development this block was repeatedly extracted
with `sed`, had icon imports stubbed to `null`, and was run **headlessly
under Node** to simulate full 10-turn playthroughs with different play
styles (passive / average / greedy-bot / risky). This is how the author's
"does this feel right" instinct got turned into hard numbers before the
author ever had to play a full session. It is also how several serious bugs
were caught that manual playtesting almost certainly would have missed —
see §5.

### Systems that were built, then found broken, then fixed
- **The 50/50 parliament tie problem.** Original parliament had 100 seats and
  a 50-vote threshold — a tie was mathematically possible. Fixed by moving to
  **101 seats** (odd), so a tie became arithmetically impossible. No extra
  rule needed; the fix was structural.
- **Rejected laws were being permanently destroyed.** A simulation run
  revealed that a bill rejected by parliament was marked "used" the same way
  a passed one was — meaning a rejected law's content vanished from the game
  forever on a single unlucky vote. Fixed: rejected bills return after a
  cooldown instead.
- **The document capacity cap (originally 6) never actually bound.**
  Simulated play showed a normal player never held more than 4 documents
  active at once. Lowering the cap to **3** was tested against both a
  balanced player (blocked ~once per game — negligible) and a law-stacking
  player (blocked ~7 times — meaningfully constraining). This turned a
  decorative counter into a real constraint.
- **Passive play was winning outright.** The very first full-engine
  simulation showed a player who did *nothing* for 10 turns still winning
  the election, because nothing in the system pushed stats down and multiple
  systems only pushed them up. This forced two different balancing passes
  (see next point and §4).
- **A greedy bot reached 100% election approval.** After content was
  expanded, simulation showed even a "pick the first available action every
  turn" bot maxing every stat. This directly caused the biggest rebalancing
  pass in the project (§4).

---

## 4. The two systems that were built and then deliberately removed

Both of these are fully implemented in git history / earlier file versions
and were removed **not because they were bad ideas, but because their
rhythm was wrong.** Do not re-add either without addressing the specific
failure mode described.

### Crisis / event system (removed)
Fully built: 9 hand-written events, state-driven trigger conditions,
priority ordering, a paper-layer "acil brifing" screen, newspaper
integration. First version fired based on binary threshold conditions with
no cooldown between events, and in simulation **six crises fired back to
back** in a passive playthrough — the author's verdict was blunt:
*"bu kriz olayı oyunu bozdu"* (this crisis thing broke the game). A second
attempt replaced binary thresholds with a graduated "pressure" score plus a
mandatory 3-turn global cooldown between any two events, which fixed the
pacing in simulation (2–3 events per 10-turn game instead of 6+). **This
second version was also removed**, at the author's request, before being
judged on its own merits — the diagnosis on record is that the *concept*
was sound but the *rhythm* needed more iteration than there was appetite for
at the time. The event data still lives in `olaylar.js` and is a reasonable
starting point if this is revisited.

### Semester rhythm (removed)
Turns alternated between a "Yasama Yarıyılı" (legislative half, +seats,
normal tax) and "Bütçe Yarıyılı" (budget half, −seats, 1.45× tax). This was
a deliberate piece of game-feel design — the idea being that players would
learn to save big laws for the legislative half and heavy spending for the
budget half. It worked mechanically but the author found the two repeating
labels visually and narratively flat over a 10-turn game. It was removed
entirely (mechanic and UI) and replaced with **10 unique, never-repeating
session names** (`Göreve Başlama → İlk Adımlar → … → Görev Sonu`) that carry
narrative arc — you can feel the term ending — without any longer touching
game math. Tax income was rebalanced upward to preserve the same total
income across a full game once the ×1.45 budget-half multiplier was gone.

### One thing that stayed off but wasn't removed: entropy/decay
A `YIPRANMA` (entropy) system that silently reduced Onay/İstikrar/Küresel
every turn was built, found necessary (see "passive play was winning" above),
then **disabled by explicit request** in favor of a different mechanic —
diminishing returns above a threshold (`VERIM_ESIGI = 70`) instead of
constant decay. The reasoning given: decay makes the game feel like a fight
against erosion; diminishing returns makes it feel like slow, deliberate
construction that gets harder near the top — closer to what the author
wanted the game to feel like. The decay code is still present, gated behind
`YIPRANMA_ACIK = false`, in case this judgment is revisited.

---

## 5. Rebalancing — what actually happened, and why it took so many passes

This was the single largest sustained effort in the project, done almost
entirely through the simulate → read numbers → adjust → re-simulate loop
described in §3. Rough order of what changed and why:

1. **Diminishing returns above 70** replaced decay (see §4).
2. **Election formula changed from a direct average to a deviation model.**
   The original formula (`onay×0.55 + istikrar×0.25 + kuresel×0.20`) was
   used *directly* as vote share — meaning an average stat value of 70 gave
   exactly 70% of the vote. This was unrealistic (a real opposition has a
   loyal base regardless of performance) and mathematically made winning
   too easy. It was rebuilt as a **deviation from a neutral point (57)**,
   scaled by 0.85 — so an average performance of 70 now yields roughly 61%,
   not 70%. This single change was responsible for most of the difficulty
   curve finally landing correctly.
3. **Starting resources were tightened twice.** Treasury dropped from $420B
   → $200B → $40B (the last drop paired with a 1/10 rescale of the *entire*
   economy so gameplay stayed identical, just with smaller on-screen
   numbers — see point 5). Nüfuz (Influence) dropped from 60 → 34 → 14, with
   matching cuts to action costs, specifically because simulation showed
   nüfuz — not treasury — was the actual binding constraint, and the pacing
   (moves-per-turn) was uneven early vs late game.
4. **A specific author complaint drove the final numeric compression:**
   large swingy numbers (+30, −50) were said to feel like "cliché," not
   rewarding — the author's phrase was that they didn't produce dopamine,
   they just felt arbitrary, and that a couple of actions were enough to
   make the rest of the game pointless. In response, **every stat effect in
   the game was mechanically recompressed into the 1–3 range** (money
   effects into 1–5, shown as `$B`), preserving relative ordering
   (an effect that used to be 15 became 5, one that used to be 6 became 2,
   etc.) via a scripted pass over the whole action dataset, not by rewriting
   144 outcomes by hand.
5. **The whole economy was rescaled ×1/10** (treasury, income, costs) purely
   so on-screen numbers would look like a believable national budget after
   the compression above, without touching the underlying balance ratios.
6. Throughout all of this, **the same four playstyles were re-simulated
   after every change**: passive (no actions), average (middling choices),
   greedy bot (always acts), and — once it existed — persistently risky
   (always takes the risky option). The end-state distribution the project
   settled on: passive loses (~39%), average narrowly loses (~48%), good
   play wins (~62–80% depending on how good), and persistently risky play
   gets removed from office around turn 7. This spread was treated as "done"
   as of v57, though the author has said balance may still move.

---

## 6. Content: how it was written, and the rules behind it

Content was written **after** a separate style guide was produced (jointly
with the author — the source file is `eylem-tarz-rehberi.md`) and then
applied action-by-action, department-by-department, with an automated audit
after each department confirming compliance (no unescaped/missing quote
separation, no exclamation marks, no cost-free successes except deliberate
exceptions). The rules, condensed:

1. **The situation text opens on a scene**, never on an institution name —
   *"A village headman's petition has been waiting six months…"*, not
   *"The Ministry of Health…"*
2. **Every outcome is split in two fields, deliberately, on later request**:
   `metin` (one factual sentence — this is what appears on the signed paper
   document) and `alinti` (a quote from a named-by-role person — this
   appears *only* in the newspaper, never on the document itself). This
   split did not exist in the first content pass; the author asked for it
   specifically after noticing the document screen and the newspaper were
   repeating the exact same sentence, which read as redundant.
3. **The speaker matches the action's domain**, and — this is treated as
   important — **on a successful outcome, the speaker is usually unaware of
   the political mechanics behind what just happened to them.** On a failed
   outcome, they are typically either the victim of the failure or an
   insider exposing it.
4. Six quote-attribution verbs are rotated to avoid monotony: *dedi, diye
   konuştu, sözleriyle anlattı, diye ifade etti, kaydetti, diye sitem etti.*
5. **No exclamation marks, ever.** No hype language. Concrete small details
   are preferred over adjectives — "forty-seven districts," "eleven
   documents," not "many districts," "several documents."
6. **Even a successful outcome should cost something** — Treasury, Approval,
   or Suspicion. This was explicitly softened to "duruma göre değişsin" (can
   vary by situation) rather than an absolute rule, and **three intentional
   exceptions exist**: the "clean" (non-risky) alternative inside each
   Gizli İşler (Covert Affairs) action is allowed to be cost-free, because
   the entire narrative point of offering a safe alternative to a risky
   choice is that it *is* safer — forcing a cost on it would erase the
   contrast that makes the risky/clean choice meaningful.

**Result:** 5 departments, 33 actions, 74 approaches, 144 outcome texts, 5
promises, all audited clean against the rules above except the three
intentional exceptions. Writing happened department by department in this
order: Ekonomi → İçişleri → Askeri → Yönetim → Siyaset (Yönetim was written
carefully because of its direct coupling to the suspicion mechanic, see §7).

### The newspaper's two registers
The turn-end newspaper (`Başkent Günlüğü`) itself was split into three zones
after the author pointed out a duplication bug: the headline (journalism,
carries the `alinti` quote), "Günün Diğer Haberleri" (other news, same
voice), and **"Resmî Gazete'den"** — a formal register section with a
generated law number, a formal title (*"X Hakkında Kanun"*), the **actual
parliament vote result** (e.g. `51/101`, taken from the real vote
calculation, not invented), and an effective date. This section deliberately
contains **no quotes and no narrative voice** — it is meant to read like an
actual government gazette. Operations never appear in this section, because
operations are not published documents in the fiction of the game; they only
appear as ordinary news.

---

## 7. The oversight system (Yönetim department + Suspicion)

Added specifically because simulation and design review both converged on
the same conclusion documented as the project's single biggest weakness:
**nothing in the game pushed back against the player.** Crises had been
removed (§4); this was built as a different kind of counter-force —
internal, not external.

- A hidden `suphe` (suspicion) meter, **invisible until the player's first
  risky move**, so a clean playthrough never sees it.
- Three thresholds with real consequences: 40 → investigation (cosmetic-ish
  penalty), 70 → **a 3-turn ban on Kararname and Operasyon**, only Kanun can
  be passed, 100 → **removed from office, game ends.**
- Decay only happens *below* the 70 threshold — once the file is serious,
  the player must actively clean it via Denetim (Oversight) actions, not
  wait it out.
- Verified in simulation that recovery is genuinely possible but not free:
  a sequence of risky moves that raises suspicion to 38 can be fully
  cleaned by three Denetim actions, at the cost of nufuz, turns, and in some
  cases coalition seats.
- Six new actions written across two categories (Denetim / Olağanüstü
  Yetki), each carefully tuned so that the "safe" oversight actions reduce
  suspicion and the "emergency powers" actions raise it, with the levers
  `yargiBagimsizligi` (judicial independence) and `basinDenetimi` (press
  control) acting as accelerant/dampener on the background decay rate.
- Execution was **removed from the original oversight design** (the
  original three-tier consequence brainstorm included "removal + prison or
  execution") specifically because of anticipated Google Play content
  rating impact — the final version is "removed from office + legal
  proceedings," with no execution mechanic anywhere in the game.

---

## 8. What is out of date, and what is genuinely unresolved

- `oyun-tasarim-dokumani-v2.md` describes the game as of engine **v21**. It
  predates the military department, the oversight system, the delayed-
  effect mechanic, the newspaper split, the whole-seat coalition fix, the
  save system, and the entire final content pass. Treat it as historical
  design reasoning, not a current spec — `PROJECT-HANDOVER.md` and this file
  reflect v57.
- **Nothing external pushes back on the player.** This remains the single
  most-cited weakness of the design as of v57. The author chose, in the
  session that produced this file, to defer building a replacement — see
  next point.
- **Native (Kotlin) port was deliberately deferred**, not rejected. The
  reasoning given directly by the author: balance and content are still in
  active iteration, and a native build/test cycle (cloud-session Android
  SDK setup, Gradle build, APK install to test a single text change) is
  drastically slower than the current React-artifact loop, where a change
  is visible immediately. The stated plan is: keep iterating in the current
  environment until balance is genuinely stable, *then* port. If you are
  Claude Code reading this because that port is now happening, confirm with
  the author that this condition has actually been met — it had explicitly
  **not** been met as of v57.
- One session-level meta-decision worth knowing: the author was directed
  toward a **Claude Projects** workspace (shared knowledge base + custom
  instructions across chats) specifically because repeatedly re-uploading
  files and re-pasting instructions into fresh chats was losing "how we
  think," even though the reference documents preserved "what we decided."
  If you are picking this project up in a fresh context, ask whether a
  Project was set up, and if so, whether its custom instructions match the
  behavioral rules in §9.

---

## 9. Working style the author has consistently asked for

Stated explicitly and repeated multiple times across the project:

- **Ask the 3–4 most critical clarifying questions before large changes.**
  Not every possible question — the most important ones. Then propose, with
  reasoning, after getting answers.
- **Never guess or assume silently.** If something is unclear, ask instead
  of filling the gap.
- **Keep conversational responses short and in bullet points.** This does
  not apply to files/artifacts, which can and should be as detailed as the
  task needs.
- **Verify, don't assume, after every code edit.** Programmatic string-
  replace edits in this project failed silently more than once because a
  target string had drifted from what was assumed to be in the file. The
  working pattern that held up: assert the exact old string exists before
  writing, then re-open and syntax-check the file afterward. For this
  codebase specifically, syntax-check by copying to a `.tsx` extension and
  running `tsc --noEmit --jsx react-jsx` with lib-checking errors filtered
  out (missing `@types/react` etc. are expected noise; `TS1xxx` codes are
  the only ones that indicate a real syntax break).
- **Use Turkish guillemets « » for in-game quotes, never straight double
  quotes inside a double-quoted JS string** — this broke the build twice in
  this project.
- Every non-trivial balance claim in this project's documentation was
  produced by **extracting the pure engine and running it headlessly under
  Node**, not by reasoning about it in the abstract or by a single manual
  playthrough. If you change a number, re-run a simulation before asserting
  the game is still balanced — the author's own intuition and the project's
  own early assumptions were both wrong multiple times, and simulation is
  what caught it every time (parliament never rejecting anything, passive
  players winning, removal-from-office being unreachable, capacity limits
  that never bound, laws being permanently destroyed on rejection).

---

## 10. One-paragraph summary, if you only read this section

*The Directive* is a Turkish-language, mobile-first, deterministic
governance simulation built for a real Google Play release by a developer
working from a phone only, entirely through conversational AI-assisted
development. It went through a fully-argued design phase before any code,
then a long simulation-driven balancing phase where the engine's pure
functions were repeatedly extracted and run headlessly to catch bugs no
manual playtest would have found, then a careful content-writing phase
governed by an explicit style guide splitting "document" language from
"newspaper" language. Two significant systems (a crisis/event system and a
semester-based turn rhythm) were fully built, judged to have the right idea
but the wrong pacing, and deliberately removed rather than half-fixed. As of
v57 the game is content-complete for its five departments but has one
acknowledged central weakness — nothing external opposes the player — and a
deliberately deferred decision to port from the current React prototype to
native Kotlin once balance work slows down.
