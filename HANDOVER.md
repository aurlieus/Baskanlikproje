# The Directive — Handover

**Build:** `the-directive-v57.jsx` — one file, ~5800 lines, React artifact.
**Interface language:** Turkish. This document is English.
**Status:** Content-complete and playable start to finish. Not packaged for release.

This is the only current reference document. It replaces `PROJECT-HANDOVER.md`
and `PROJECT-HISTORY-AND-RATIONALE.md`, which described the engine before a
seven-commit audit pass and are now deleted. Every number below was read out of
the source or measured by simulation, not recalled.

---

## 1. What it is

A turn-based governance simulation. You are a president serving one five-year
term — ten turns, each a half-year. The core verb is **signing documents**:
laws, decrees, operations. Each presents a situation and two or three
approaches, and you can inspect the consequences of each before committing.

It is deliberately not a card-swipe game. There are ministries, a parliament
with real seat arithmetic, three voter blocs, a resource economy, an oversight
system that can remove you from office, an opposition that acts on its own
initiative, and a newspaper that narrates what you did — plus a classified file
that narrates what you did but nobody read about.

Reference points: Democracy, Tropico, Reigns — but text-and-document driven.

**Constraints that shaped everything:** mobile-first (phone screens), one
20–30 minute campaign rather than short repeatable runs, intended for a Google
Play release, and the author works from a phone with no computer.

---

## 2. Core loop

```
SCENARIO PICK → PROMISES → PANEL → ministry → action → approach
                                                          ↓
                                          KANUN: parliament vote animation
                                                          ↓
                                          signed document (paper + stamp)
                                                          ↓
  ← PANEL ← [opposition scene] ← [classified file] ← newspaper ← END OF TURN
                                        ↓
                          after 10 turns → ELECTION NIGHT → ending card
```

Between those the player adjusts policy levers, withdraws active documents, and
waits on delayed effects.

---

## 3. Numbers

All verified against source.

### Meters

| Meter | Start | Notes |
|---|---|---|
| Onay (approval) | 58 | **Derived** — weighted mean of the voter blocs. 55% of election performance |
| Hazine (treasury) | $30B | **Can go negative.** Drains ~0.4/turn passively. See §4 |
| İstikrar (stability) | 60 | 25% of election performance |
| Küresel (standing) | 55 | 20% of election performance |
| Nüfuz (influence) | 14 | Spent to act. Cap **30** |
| Koalisyon (seats) | 51 | Out of **101** |

### Voter blocs

`onay` is the weighted mean of three blocs and is never written directly.

| Bloc | Weight | Start |
|---|---|---|
| Kentli | 35% | 54 |
| Muhafazakâr | 35% | 62 |
| Emekçi | 30% | 58 |

`0.35×54 + 0.35×62 + 0.30×58 = 58.0` exactly.

An effect carrying `onay: v` is distributed through a tendency vector — one per
action category, one per approval-affecting lever — **normalised so the weighted
mean of the distributed deltas equals `v` exactly**. That is what keeps the
aggregate behaving as it always did while the interior differentiates.

Keep tendency vectors' weighted sum near 1.0. Normalisation divides by that sum,
so a polarised vector has a small divisor and inflates the result. An early
draft sent a +3 approval effect to a single bloc as +11.5, which breaks the
small-numbers principle and risks blocs clipping at 0/100 — and clipping
silently breaks the mean-preservation guarantee the whole design rests on.

### Department KPIs

`gsyih 55 · istihdam 52 · halkSagligi 58 · hazirlik 55`

### Policy levers (10, two per department)

`gelirVergisi 30 · kurumsalVergi 22 · sosyalYardim 50 · guvenlikButcesi 45 ·
partiSadakati 50 · hukumetSeffafligi 60 · askeriButce 45 · disPolitika 55 ·
yargiBagimsizligi 60 · basinDenetimi 40`

All lever effects are computed as deviation from these baselines, so an untouched
lever contributes nothing. Adjustment is capped at net ±5 per turn and costs
**2 nüfuz per point**; reversing within the same turn is free and refunds.

Lever effects apply at full precision. They used to be rounded to one decimal
*before* being applied, which created a dead zone where moves under 3 points on
the divisor-22-to-30 levers vanished while still being paid for.

### Documents

| Type | Parliament | Nüfuz | In force | Completes | Repeat |
|---|---|---|---|---|---|
| OPERASYON | no | 4 | immediately | — | after 2–4 turn cooldown |
| KARARNAME | no | 3 | +1 turn | — | one-time |
| KANUN | **yes** | 5, refunds 1 on passing | +2 turns | +4 turns | one-time |

Read this as influence-per-application, since a law applies its effect twice
(entering force, then completing) and the others once:

- **KANUN** net 4, ×2 → **2.0** — most efficient, but slowest, the only type
  parliament can reject, and holds a capacity slot for 4 turns
- **KARARNAME** net 3, ×1 → **3.0** — cheap, fast, guaranteed, modest
- **OPERASYON** net 4, ×1 → **4.0** — dearest per effect, but instant, takes no
  capacity slot, and repeats

**Capacity: 3 active documents.** Operations are exempt.

A law signed on turn 10 can never take effect, so it is closed with a
"Süre yetmez" label. Turn 9 stays open — it does still apply, at the close of
turn 10.

### Parliament

- 101 seats — odd on purpose, so a tie is arithmetically impossible
- Normal threshold **51**, "büyük kanun" **55** (4 actions are marked `buyuk`)
- Vote = `koalisyon + (partiSadakati−50)/10 + (onay−55)/10`
- Rejected bills are not destroyed; they return after 2 turns

### Coalition drift

```
kayma = (onay − 60)/12 + (partiSadakati − 50)/22 − (unmet promises × 0.08)
```

Accumulated fractionally in the background, applied only as whole seats. The
promise pressure term starts after turn 6.

The threshold is **60**, deliberately above the starting approval of 58. It used
to be 58 — exactly the starting value, with the loyalty pivot also exactly at
its starting value — so drift evaluated to precisely zero and the coalition was
frozen at 51 for an entire passive game. Parliament was a dead number.

Measured now: passive play loses the majority on turn 7 (51 → 49); active play
grows it (51 → 56); pushing `partiSadakati` up offsets the erosion, which is the
first real job that lever has had.

### Influence income

```
5 + (onay > 65 ? 2 : onay > 55 ? 1 : 0) + (koalisyon ≥ 55 ? 1 : koalisyon ≥ 51 ? 0 : −1), floored at 3
```

Returns exactly 6 at the starting state, which is what the old flat value was —
calibrated that way so existing balance references did not shift. A strong
president gets 8, a struggling one 4.

**The floor of 3 equals the decree cost.** A president at rock bottom can always
sign one decree per turn. The game narrows options; it never leaves the player
with no move.

### Suspicion / oversight

| Threshold | Consequence |
|---|---|
| 40 | Investigation. Onay −3, Koalisyon −2 |
| 70 | **Powers restricted 3 turns** — only laws can pass |
| 100 | Removed from office. Game over |

Hidden until the player's first risky move. Decays ~1.5/turn but **only below
70** — past that it must be actively cleaned via Denetim actions.
`yargiBagimsizligi` accelerates accumulation, `basinDenetimi` slows it.

The coalition half of those tier penalties used to be silently discarded — the
effect was applied and then overwritten by a value computed before the tier ran.
Only the approval half landed.

### Election

```
performance = onay×0.55 + istikrar×0.25 + kuresel×0.20
vote%       = 50 + (performance − 57) × 0.85 + 8 per kept promise − 6 per broken
```

The neutral point of 57 models an opposition with a loyal base; stats do not
translate directly into vote share. Coefficients are never shown to the player.

Turnout is derived from state: participation `78 + (istikrar−50)/5 + (onay−50)/10`
clamped 64–92%, invalid ballots `2 + (100−istikrar)/40`. Population 78,400,000,
electorate 55,664,000. A country in chaos literally has millions fewer voters.

### Other constants

`TOPLAM_TUR 10 · VERIM_ESIGI 70 · ETKI_GECIKMESI 2 · RED_BEKLEME 2 ·
KOL_MALIYET 2 · YIPRANMA_ACIK false · BASLANGIC_YILI 2026`

---

## 4. Systems

### Deterministic outcomes computed from state

Outcomes are **not random**. Each has a `skor(s)` function; the highest score
wins, and the percentages shown to the player are those scores normalised.
Because the scores read live state, the same action produces different outcomes
in different playthroughs.

```js
skor: (s) => 50 + s.ist.hazine / 12        // outcome A: it works
skor: (s) => 50 + (30 - s.ist.hazine) / 6  // outcome B: no doctors found
```

The player sees the odds and can change them — by changing the country first.
The author's phrase: *"kumar değil, satranç"* — chess, not gambling. Do not
replace this with RNG.

### Diminishing returns instead of decay

There is a `YIPRANMA` entropy system in the code but it is **off**
(`YIPRANMA_ACIK = false`), by the author's explicit choice. What stops stats
pinning at 100 instead:

```js
VERIM_ESIGI = 70
// above 70, positive gains shrink: 1 − (value − 70)/40, floored at 0.25
```

At 70 a +3 gives +3.0; at 90 it gives +1.5. Negative effects bypass this
entirely. Nothing is ever taken from the player, but climbing gets harder. The
reasoning on record: decay makes the game feel like a fight against erosion,
diminishing returns makes it feel like slow deliberate construction.

Note this is applied **per bloc** for approval, not to the aggregate.

### Covert acts and the classified file

`gizli` marks an action or a single approach as covert; `ifsa` marks an outcome
as the one where it leaks. A covert move stays out of the newspaper unless that
outcome fires, at which point it becomes public — which is what gives risk a
consequence beyond the suspicion meter.

The newspaper prints what the public knows. The **Gizli Dosya** screen, shown
after the newspaper and skipped when nothing was hidden, prints what actually
happened. The gap between them is the point.

A covert *decree* keeps its Resmî Gazete entry: the decree really is published,
what is hidden is what it was for. Overt authoritarian acts — a riot squad
visible on the street, a published law — are deliberately not marked covert.

### The opposition

Fires **exactly once per game**, on its own initiative. Watches treasury (15),
coalition (45) and approval (45); whichever is proportionally worst fires its
matching scene the moment it crosses. If none crosses by turn 9, the worst fires
anyway, so the moment is guaranteed.

The trigger is transparent by design — it reads meters already on the panel
rather than adding a second hidden gauge alongside suspicion.

The opposition leader is **Nuray Ergin**: three terms as a deputy, two years
chairing the budget committee. The budget background is deliberate — the first
opposition scene is a budget negotiation, so the player meets them on their own
ground.

### Budget deficit

Treasury is **not clamped at zero** — the state can borrow. Debt is not free:
each turn closing in deficit costs interest (10% of the debt), approval
(`1 + debt/20`, capped at 4), stability (`debt/30`, capped at 2), and 1
influence.

Money never *blocks* an action — actions are paid for in influence — because a
hard money gate could deadlock the game: only 10 effect entries anywhere produce
income and seven sit in two one-time tax actions. Overspending is a debt you
service, not a wall you hit.

The escape route already existed in the levers and is what gives five of them a
job for the first time: raising `gelirVergisi` / `kurumsalVergi` lifts income
immediately, cutting `sosyalYardim` / `guvenlikButcesi` / `askeriButce` cuts
expenses. Measured: a player entering deficit and running austerity from turn 4
climbs from 8 back to 29 by turn 10, at a cost of about 5 approval — because
raising income tax pushes approval down every turn through `kolEtki`.

The approval half of the debt bill is routed through the `sosyalYardim` bloc
tendency, so the Emekçi bloc absorbs most of it: wages, benefits and services
are what get cut first.

**Starting treasury is also an input to outcome selection, not just a budget.**
Many `skor` functions read `s.ist.hazine`, so a poorer state makes different
outcomes win. Lowering the start from 40 to 30 left passive play and the
act-every-turn bot untouched but moved the persistently-risky bot from 35.5% to
32.7% — that bot never once went into debt; different content simply fired.
Treat any change to starting treasury as a content change, not just an economic
one, and re-measure.

### Starting scenarios

Picked before promises. All promise targets are relative to `s.baslangic`, so
scenarios cannot make a promise unfairly easy or impossible.

| Scenario | Difficulty | What it changes |
|---|---|---|
| Dengeli Devir | Standart | baseline |
| Yalnız Ülke | Zor | standing 38, stability and readiness up |
| Bölünmüş Meclis | Zor | 46 seats, party loyalty and stability up |
| Yıpranmış Devir | Çok zor | approval 53, treasury 12, stability 57 |

Bölünmüş Meclis is the sharpest: at 46 seats an ordinary bill polls 47/101 and
fails, so rebuilding a majority comes before anything else can be signed.

### Endings

Thirteen: twelve cards from `finalKarti()` plus the removal-from-office screen. Two
axes — the ballot box and the file you leave behind — with the file taking
precedence, because how you won matters more than by how much.

```
won  + powers suspended   Kazandın, dosya kapanmadı
won  + investigated       Gölgede kalan zafer
won  + in debt            Kazandın, borcu devraldın
won  + 60%+               Ezici çoğunlukla yeniden seçildin
won  + ≤52%               Kıl payı kazandın
won                       Yeniden seçildin
lost + powers suspended   Hem koltuğu hem dosyayı bıraktın
lost + investigated       Seçimi kaybettin, soruşturma sürüyor
lost + in debt            Boş bir kasa bırakarak gidiyorsun
lost + ≥47%               Kıl payı kaybettin
lost + <40%               Ağır bir yenilgi
lost                      Seçimi kaybettin
```

### Campaign promises

Five, pick two. All reward +8 / penalise −6, and all targets are relative:

| Promise | Target |
|---|---|
| issizlik | istihdam +12 over start |
| saglik | halkSagligi +12 over start |
| guvenlik | istikrar +8 over start |
| itibar | kuresel +15 over start |
| vergi | average tax 2 points **below** start |

Two rules govern these and both must hold: no promise may be met by ordinary
play that does not pursue it, and every promise must be reachable by a player
who does. Both were established by measurement and are re-checked as
`spread 0.00` (see §7). If you touch promise targets, re-measure.

---

## 5. Architecture

One file, in this order:

1. Palette and constants — all tuning numbers live at the top
2. Voter blocs and tendency vectors
3. Content — `VAATLER`, `BASLANGIC_SENARYOLARI`, `BOLUMLER` (5 departments),
   `MUHALEFET_HAMLELERI`, `MUHALEFET_LIDERI`
4. **Pure engine** — `etkiUygula`, `sonucHesapla`, `meclisOyla`, `turSonu`,
   `secimHesapla`, `finalKarti`, `kademeKontrol`, `muhalefetKontrol`,
   `eylemDurumu`, `takvim`, `sandikBilancosu`, `blokDagit`
5. Storage — `kayitYaz` / `kayitOku` / `kayitSil`
6. UI components
7. Root component `TheDirective`, rendering by `faz`

### Phases

```
yukleniyor → acilis → senaryo → vaatler → panel ⇄ bolum ⇄ eylem
           → oylama → sonuc → gunluk → gizli → muhalefet → secim | azil
```

Saves record the UI phase and restore it from a whitelist of screens that draw
purely from state (`panel`, `gunluk`, `gizli`, `muhalefet`). Resuming used to
force the panel, which permanently destroyed the once-per-game opposition scene
for anyone who saved during it.

### The engine is testable in isolation — keep it that way

Everything between the icon imports and the `KAYIT KATMANI` comment is **pure
functions with no React dependency**. Every balance claim in this document came
from extracting that block, stubbing the icons, and running it headlessly under
Node — not from reasoning about it.

`scratchpad/sim/cikar.sh` does the extraction, locating the boundary by grepping
for the `KAYIT KATMANI` banner rather than a hardcoded line number, which kept
breaking as the file grew. The harnesses alongside it (`trace.js`, `harness.js`,
`senaryo.js`) reimplement the component-level `eylemUygula` faithfully; **if you
change that function, change them too**, or you will be measuring a game that
does not exist.

This discipline has caught, at various points: passive players winning,
parliament never rejecting anything, laws being permanently destroyed on
rejection, removal from office being mathematically unreachable, capacity limits
that never bound, and a frozen coalition. In every case intuition was wrong and
simulation was right.

### Data shape of an action

```js
{
  id: "eko-vergi-1",
  kategori: "Vergi",         // also selects the voter-bloc tendency vector
  tur: "KANUN",              // KANUN | KARARNAME | OPERASYON
  buyuk: true,               // optional — needs 55 votes
  riskli: true,              // optional — shows RİSKLİ badge
  gizli: true,               // optional — covert, stays out of the newspaper
  bekleme: 3,                // OPERASYON only — cooldown turns
  ad: "…",
  metin: "…",                // situation, opens on a scene
  secenekler: [{
    ad: "…",
    riskli: true,            // optional, per approach
    gizli: true,             // optional, per approach
    sonuclar: [{
      metin: "…",            // factual sentence — appears on the document
      alinti: "…",           // human quote — appears ONLY in the newspaper
      ifsa: true,            // optional — this outcome is the one that leaks
      skor: (s) => …,
      etki: { onay: 2, hazine: -4, supheDegisim: 9 },
      gecikmeli: { istihdam: 3 },   // optional, applies 2 turns later
      gecikmeliMetin: "…",          // its newspaper line
    }]
  }]
}
```

---

## 6. Content

**5 departments · 30 player actions · 3 opposition scenes · 72 approaches ·
144 outcomes · 5 promises · 4 scenarios**

| Department | Actions | Categories | KPIs | Levers |
|---|---|---|---|---|
| Ekonomi | 6 | Vergi / İstihdam | gsyih, istihdam | gelirVergisi, kurumsalVergi |
| İçişleri | 6 | Sağlık / İç Güvenlik | halkSagligi, istikrar | sosyalYardim, guvenlikButcesi |
| Askeri | 6 | Savunma / Diplomasi | hazirlik, kuresel | askeriButce, disPolitika |
| Yönetim | 6 | Denetim / Olağanüstü Yetki | suphe, istikrar | yargiBagimsizligi, basinDenetimi |
| Siyaset | 6 | Parti / Gizli İşler | koalisyon, onay | partiSadakati, hukumetSeffafligi |

Also: 4 büyük kanun · 10 delayed effects · 10 covert approaches · 7 exposure
outcomes · 12 scenes carrying a risky approach.

The three opposition scenes live outside `BOLUMLER` and are not player-initiated.
Their `tur` / `buyuk` / `bekleme` fields are inert metadata — they do not go
through the vote or document lifecycle.

### Writing rules

1. **The situation opens on a scene**, never on an institution name.
   *"A village headman's petition has been waiting six months: nearest hospital
   two hours away."*
2. **Every outcome splits in two.** `metin` is one factual sentence and appears
   on the signed document; `alinti` is a quote from someone named by role and
   appears **only** in the newspaper. This split exists because the document
   screen and the newspaper were repeating the same sentence.
3. **The speaker matches the action's domain**, not a generic official.
4. **On success the speaker is usually unaware of the political mechanics.** On
   failure they are the victim or an insider exposing it.
5. **Rotate the six attribution verbs:** dedi · diye konuştu · sözleriyle
   anlattı · diye ifade etti · kaydetti · diye sitem etti.
6. **No exclamation marks. No hype.** Concrete small details — "forty-seven
   districts", "eleven documents" — not "many" or "several".
7. **Even success costs something** — treasury, approval or suspicion. Three
   deliberate exceptions: the clean alternatives inside Gizli İşler actions,
   which must stay costless or the safe path loses its meaning.

Stat effects stay in the **1–3** range; treasury effects 1–5, shown as `$B`.

**Turkish quotation marks are « ».** Straight double quotes inside a
double-quoted JS string will break the file — this has happened twice.

### The newspaper's registers

- **Document (paper layer):** bureaucratic, `metin` only, stamp animation.
- **Newspaper headline and other news:** journalism, carries `alinti` in a
  red-ruled pull quote.
- **"Resmî Gazete'den":** formal register only — law number, formal title, the
  real vote count (`51/101`), effective date. No narrative, no quotes.
  Operations never appear here; they are not published documents.
- **Gizli Dosya:** what the public did not read.

Crisis headlines fire only on the turn a threshold is **crossed**. They used to
test current state, so once the coalition fell below the threshold the same
headline ran every remaining turn and buried everything else.

---

## 7. Balance references

Re-measure these after any engine change. They are the contract.

| Playstyle | Result |
|---|---|
| Passive — no actions at all | **38.8%** loses |
| Acts every turn, ignores its promises | **46.8%** loses |
| Persistently risky | **32.7%** loses |
| Pursuing its promises | 73–82% depending on the pair |

**Promise-choice spread: 0.00** across all ten promise pairs, in all four
scenarios. This is the single most fragile invariant in the game and the one
most worth re-checking.

Per scenario (passive / greedy / spread / opening vote):

```
Dengeli Devir     38.8%  46.8%  0.00  51/101 passes
Yıpranmış Devir   35.8%  39.2%  0.00  51/101 passes
Bölünmüş Meclis   39.6%  40.0%  0.00  47/101 FAILS
Yalnız Ülke       36.7%  43.2%  0.00  51/101 passes
```

Blocs separate by playstyle over ten turns:

```
                  Kentli  Muhafazakâr  Emekçi
security-focused    55.6      68.6      61.8
reform-focused      78.5      70.0      69.3
social-focused      64.3      73.0      75.9
```

Session shape: roughly 16–18 moves across 10 turns and 25–27 minutes, and a
single campaign surfacing about a third of the content. **Both figures are
carried over from earlier documentation and were not re-measured in the audit**
— document costs and the action count have since changed, so treat them as
indicative rather than current.

---

## 8. Deliberately removed or switched off

Do not re-add these without addressing the specific failure described.

**Crisis / event system.** Fully built twice — 9 hand-written events, pressure
triggering, cooldowns, a briefing screen, newspaper integration. The first
version fired six crises back to back in a passive playthrough; the author's
verdict was blunt: *"bu kriz olayı oyunu bozdu."* A second version fixed the
pacing in simulation (2–3 per game) and was still removed. The diagnosis on
record is that the concept was sound and the rhythm was not.

The opposition system (§4) is the deliberate answer to the same problem, and it
sidesteps that failure mode by firing exactly once rather than repeating.

**Semester rhythm.** Turns alternated legislative and budget halves with
different seat and tax multipliers. It worked mechanically but read as flat over
ten turns. Replaced by ten unique non-repeating session names that carry
narrative arc and no mechanics. Tax rates were raised to preserve total income.

**Entropy (`YIPRANMA`).** Still in the code behind a flag, off by request. See
§4 for the reasoning and what replaced it.

---

## 9. Open issues

### An unverified reference

Earlier documentation claimed a persistently risky player is removed from office
around turn 7. **No simulation in the audit reproduced this** — the risky bot
peaked at roughly 48 suspicion against a threshold of 100 and was never removed.
Either that bot is far tamer than whatever produced the original figure, or the
claim no longer holds. It was not resolved. Removal from office may currently be
much harder to reach than intended; measure before trusting it.

### Content distribution

Measured across the whole dataset:

- **`onay` is over-served and overwhelmingly negative** — 93 effect entries, 58
  of them negative, net −50, touching 31 of the 33 scenes. The bloc system gives
  it interior structure but does not fix the underlying skew.
- **KPIs are a ratchet.** `istihdam` is 21 positive to 1 negative,
  `halkSagligi` 19 to 1. They are nearly impossible to lose, while approval is
  nearly impossible to hold.
- **Money-making is an Ekonomi monopoly.** 90 entries touch treasury and only 10
  are positive; 7 of those sit in two tax actions.
- **Suspicion is one-way pressure** — 48 entries, net +237, with only 16 reducing
  entries and all of them in the Yönetim department. Fixing the discarded tier penalty made
  this harsher without a compensating pass.
- **`hazirlik` is thin** — 11 entries across 4 actions, all in the military line.

### Smaller known defects, not yet fixed

- `eylemDurumu` never checks `KAPASITE`, so at full capacity laws still look
  clickable and the player must open the card and back out — exactly what that
  function's own comment says it exists to prevent.
- The restriction branch runs before the permanent-state branch, so during a
  restriction an already-used decree shows a "Tur X" label implying it will
  reopen.
- `meclisOyla` rounding favours the player: `Math.round(-0.5)` is `-0`, so
  loyalty 45 costs nothing while loyalty 55 pays a bonus.
- Dead code: `resmiBaslik` is never called; `rapor.supheYatisma` is never read;
  `rapor.kolEtki` is computed and applied but never shown to the player, so
  nothing tells them their levers moved anything; the `YIPRANMA` branch in the
  newspaper's observer note is permanently false.

### Before release

1. **Onboarding.** Nothing explains influence, coalition, capacity, document
   lifetimes or the voter blocs. Required before any public release.
2. **Packaging.** Verified path for a phone-only developer: build a PWA, host it
   (GitHub Pages or Netlify, both browser-configurable), then **PWABuilder**
   produces a signed Android package in the cloud with no Android Studio. Google
   Play personal accounts created after 13 Nov 2023 must run a closed test with
   12 testers for 14 continuous days before production access. Developer account
   is a one-time $25.
3. **Content rating.** The design contains detention of opposition figures and
   covert press operations. Execution was removed from the design on purpose.
   Expect these themes to affect the rating.
4. **Native port** was deliberately deferred, not rejected — balance and content
   are still moving, and a native build/test cycle is far slower than the current
   loop. Confirm with the author that balance has actually stabilised before
   starting it.

---

## 10. Working with the author

Stated repeatedly across the project:

- **Ask the 3–4 most critical questions before large changes.** Not every
  possible question — the important ones. Then propose with reasoning.
- **Never guess silently.** If something is unclear, ask.
- **Keep replies short and in bullets.** This does not apply to files, which
  should be as detailed as the task needs.
- **Verify after every edit.** Programmatic string replacements in this file have
  failed silently more than once because a target string had drifted. Assert the
  old string exists before writing, then syntax-check afterwards:
  `esbuild --bundle` and `tsc --noEmit --jsx react-jsx` (only `TS1xxx` codes
  indicate a real syntax break; missing `@types/react` noise is expected).
- **Prefers small numbers**, no fractional displays, plain language over jargon.
- **Re-simulate before asserting anything about balance.** The project's own
  assumptions have been wrong repeatedly and simulation caught it every time.
