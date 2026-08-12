# The Directive — Project Handover

**Current build:** `the-directive-v57.jsx` · single-file React artifact
**Interface language:** Turkish (all in-game text). This document is English for handover purposes.
**Status:** v1 content-complete. Playable start to finish. Not yet packaged for distribution.

---

## 1. What this is

A turn-based **deep governance simulation**. You play a president over one five-year
term. The core verb is **signing documents**: laws, decrees, operations. Every document
presents a situation and two-to-three approaches; every approach has consequences you
can inspect before committing.

It is deliberately *not* a card-swipe game. It has ministries, a parliament, coalition
arithmetic, a resource economy, an oversight system that can remove you from office, and
a newspaper that narrates what you did.

**Reference points:** Democracy, Tropico, Reigns — but text-and-document driven.

**Design constraints that shaped everything:**
- Mobile-first (phone screens)
- One 20–30 minute campaign, not short repeatable runs
- Intended for Google Play release
- Author has phone only — no computer

---

## 2. Core loop

```
PANEL  →  pick a ministry  →  pick an action  →  choose an approach
                                                        ↓
                                          KANUN: parliament vote animation
                                                        ↓
                                          signed document (paper layer + stamp)
                                                        ↓
        ← END OF HALF-YEAR ← newspaper (Başkent Günlüğü) ←
                    ↓
        after 10 turns → ELECTION NIGHT
```

Between those, the player can adjust **policy levers**, cancel active documents, and
watch delayed effects mature.

---

## 3. Numbers (all verified against v57 source)

### Meters
| Meter | Start | Notes |
|---|---|---|
| Onay (Approval) | 58 | 55% of election performance |
| Hazine (Treasury) | $40B | Real constraint; drains over a game |
| İstikrar (Stability) | 60 | 25% of election performance |
| Küresel (Global standing) | 55 | 20% of election performance |
| Nüfuz (Influence) | 14 | Spent to act. Cap **30** |
| Koalisyon (Coalition seats) | 51 | Out of **101** |

### Department KPIs
`gsyih 55 · istihdam 52 · halkSagligi 58 · hazirlik 55`

### Policy levers (10 total, 2 per department)
`gelirVergisi 30 · kurumsalVergi 22 · sosyalYardim 50 · guvenlikButcesi 45 ·
partiSadakati 50 · hukumetSeffafligi 60 · askeriButce 45 · disPolitika 55 ·
yargiBagimsizligi 60 · basinDenetimi 40`

Levers start at their baseline, and **all lever effects are computed as deviation from
baseline** — so if the player never touches them, nothing drifts. Adjustment is capped at
**net ±5 per turn** and costs **2 nüfuz** per step. Reversing within the same turn is free
and refunds the influence.

### Documents
| Type | Parliament | Nüfuz | Takes effect | Completes | Repeat |
|---|---|---|---|---|---|
| OPERASYON | no | 4 | immediately | — | after 2–4 turn cooldown |
| KARARNAME | no | 4 | +1 turn | — | one-time |
| KANUN | **yes** | 5 | +2 turns after passing | +7 turns | one-time |

**Capacity: 3 active documents.** Operations are exempt. Tuned by simulation: blocks a
law-stacking player ~7 times per game, a balanced player ~1 time.

### Parliament
- 101 seats — **odd on purpose, so a tie is arithmetically impossible**
- Normal threshold **51**, "büyük kanun" threshold **55** (4 laws are marked `buyuk`)
- Vote = `coalition + (partiSadakati−50)/10 + (onay−55)/10`
- Coalition drifts each turn by `(onay−58)/12 + (partiSadakati−50)/22`, accumulated
  **fractionally in the background but only applied as whole seats**
- Rejected bills are **not destroyed** — they return after 2 turns (`RED_BEKLEME`)

### Suspicion / oversight
| Threshold | Consequence |
|---|---|
| 40 | Investigation opened. Onay −3, Koalisyon −2 |
| 70 | **Powers restricted for 3 turns** — only laws can be passed |
| 100 | Removed from office. Game over |

- The gauge is **hidden until the player's first risky move**
- Decays ~1.5/turn, **but only below the 70 threshold** — once the file is serious it must
  be actively cleaned via Denetim actions
- `yargiBagimsizligi` accelerates accumulation, `basinDenetimi` slows it

### Election
```
performance = onay×0.55 + istikrar×0.25 + kuresel×0.20
vote%       = 50 + (performance − 57) × 0.85
            + 8 per kept promise, − 6 per broken promise
```
The neutral point (57) models an opposition with a loyal base — stats do not translate
directly into vote share. Coefficients are **never shown to the player**.

**Turnout is derived from state:** participation `78 + (istikrar−50)/5 + (onay−50)/10`
(clamped 64–92%), invalid ballots `2 + (100−istikrar)/40`. Population 78,400,000 /
electorate 55,664,000. A country in chaos literally has millions fewer people voting.

### Other constants
`VERIM_ESIGI 70` · `ETKI_GECIKMESI 2` · `YIPRANMA_ACIK false` · `BASLANGIC_YILI 2026`

---

## 4. Two mechanics worth understanding before editing

### Deterministic outcomes computed from state
Outcomes are **not random**. Each outcome has a `skor(s)` function; the higher score wins,
and the percentages shown to the player are those scores normalised. Because the scores
read live game state, the same law produces different outcomes in different playthroughs.

```js
// "Kırsal Sağlık Ağı", option 1
skor: (s) => 50 + s.ist.hazine / 12   // outcome A: works
skor: (s) => 50 + (30 - s.ist.hazine) / 6  // outcome B: no doctors found
```

The player sees the odds and can change them — **by changing the country first**. Chess,
not dice. Do not replace this with RNG without understanding what it removes.

### Diminishing returns instead of decay
There is a `YIPRANMA` (entropy) system in the code but it is **switched off**
(`YIPRANMA_ACIK = false`) at the author's request. What prevents stats from pinning at 100
is instead:

```js
VERIM_ESIGI = 70
// above 70, positive gains shrink: 1 − (value − 70)/40, floored at 0.25
```

At 70 a +3 action gives +3.0; at 90 it gives +1.5. Nothing is ever taken away from the
player, but climbing gets harder. This is what makes the progression feel slow and earned.

---

## 5. Code architecture

Single file, roughly in this order:

1. **Palette + constants** — all tuning numbers live at the top
2. **Content data** — `VAATLER` (promises), `BOLUMLER` (5 departments with their actions)
3. **Pure engine** — `etkiUygula`, `sonucHesapla`, `meclisOyla`, `turSonu`,
   `secimHesapla`, `kademeKontrol`, `eylemDurumu`, `takvim`, `sandikBilancosu`
4. **Storage layer** — `kayitYaz` / `kayitOku` / `kayitSil`
5. **UI components** — `GenisOlcek`, `VaatTakip`, `Gazete`, `MeclisOylamasi`,
   `SecimEkrani`, `OlayBrifingi`, `Kabuk`
6. **Root component** `TheDirective` — holds all state, renders by `faz` (phase)

### Phases (`faz`)
`yukleniyor → acilis → vaatler → panel ⇄ bolum ⇄ eylem → oylama → sonuc → gunluk → secim | azil`

### The engine is testable in isolation
Everything between the lucide import and the `KAYIT KATMANI` comment is **pure functions
with no React dependency**. Throughout development it was extracted with `sed`, icons
stubbed out, and run headlessly under Node to simulate full 10-turn playthroughs. This is
how every balance number in this document was verified. **Keep that separation.**

### Data shape of an action
```js
{
  id: "eko-vergi-1",
  kategori: "Vergi",
  tur: "KANUN",              // KANUN | KARARNAME | OPERASYON
  buyuk: true,               // optional — needs 55 votes
  riskli: true,              // optional — shows RİSKLİ badge
  bekleme: 3,                // OPERASYON only — cooldown turns
  ad: "…",
  metin: "…",                // situation, opens on a scene
  secenekler: [{
    ad: "…",
    riskli: true,            // optional — this specific approach is risky
    sonuclar: [{
      metin: "…",            // factual sentence — shown on the document
      alinti: "…",           // human quote — shown ONLY in the newspaper
      skor: (s) => …,
      etki: { onay: 2, hazine: -4, supheDegisim: 9 },
      gecikmeli: { istihdam: 3 },     // optional, applies +2 turns later
      gecikmeliMetin: "…",            // its newspaper line
    }]
  }]
}
```

---

## 6. Content

**5 departments · 33 actions · 74 approaches · 144 outcome texts · 5 promises**

| Department | Actions | Categories | KPIs | Levers |
|---|---|---|---|---|
| Ekonomi | 6 | Vergi / İstihdam | gsyih, istihdam | gelirVergisi, kurumsalVergi |
| İçişleri | 6 | Sağlık / İç Güvenlik | halkSagligi, istikrar | sosyalYardim, guvenlikButcesi |
| Askeri | 6 | Savunma / Diplomasi | hazirlik, kuresel | askeriButce, disPolitika |
| Yönetim | 6 | Denetim / Olağanüstü Yetki | suphe, istikrar | yargiBagimsizligi, basinDenetimi |
| Siyaset | 9 | Parti / Muhalefet / Gizli İşler | koalisyon, onay | partiSadakati, hukumetSeffafligi |

Also: 9 risky approaches · 6 actions flagged risky · 4 "büyük kanun" · 10 delayed effects.

### Writing rules — follow these for any new content
There is a separate style guide (`eylem-tarz-rehberi.md`). The essentials:

1. **Body opens on a scene**, never on an institution name.
   *"A village headman's petition has been waiting six months: nearest hospital two hours away."*
2. **Outcome splits in two.** `metin` = one factual sentence (appears on the signed
   document). `alinti` = a named-by-role person's quote (appears **only** in the newspaper).
3. **Speaker matches the action**, not a generic official.
4. **On success the speaker is often unaware of the political dimension.** On failure they
   are the victim or an insider.
5. **Vary quote verbs:** dedi · diye konuştu · sözleriyle anlattı · diye ifade etti ·
   kaydetti · diye sitem etti.
6. **No exclamation marks. No hype.** Concrete small details — "forty-seven districts",
   "eleven documents", "three days".
7. **Even success carries a cost** — at least one of Hazine, Onay or Şüphe moves against
   the player. *Three deliberate exceptions exist:* the "clean" alternatives inside Gizli
   İşler actions, which must stay costless or the safe path loses its meaning.

All stat effects are in the **1–3** range; treasury effects **1–5** shown as `$B`.

### Two-layer voice
- **Document (paper layer):** bureaucratic. Only `metin`. Stamp animation.
- **Newspaper:** journalism. Headline + `alinti` in a red-ruled pull quote.
- **"Resmî Gazete'den" section:** formal register only — law number, formal title,
  vote count (`51/101`), effective date. No narrative, no quotes. **Operations never
  appear here** — they are not published documents.

---

## 7. Balance (simulated, v57)

| Play style | Result |
|---|---|
| Passive — no actions at all | **%38.8 loses** |
| Middling / random choices | **%48.4 loses narrowly** |
| Greedy bot — always acts | **%61.8 wins** |
| Persistently risky | removed from office around turn 7 |

Session shape: ~16–18 moves across 10 turns ≈ 25–27 minutes. A single playthrough surfaces
roughly **33–42%** of the content — this is a known tension: raising coverage requires more
moves, which lengthens the session past the 30-minute target.

---

## 8. Systems built and then deliberately removed

Do not re-add these without reading why they were pulled.

**Crisis / event system.** Fully implemented (9 events, pressure-based triggering, global
cooldown, three-tier consequences). Removed because crises arrived back-to-back and
overwhelmed the pacing. The author's verdict: *"bu kriz olayı oyunu bozdu."* The data still
exists in `olaylar.js`. The diagnosis was that the *rhythm* was wrong, not the concept.

**Semester rhythm.** Turns alternated "Yasama Yarıyılı" (+1 seat, normal tax) and "Bütçe
Yarıyılı" (−1 seat, ×1.45 tax). Removed by request; tax base was raised to 0.196/0.172 to
preserve total income. Replaced by 10 unique non-repeating session names
(`Göreve Başlama → Görev Sonu`) that carry narrative arc but no mechanics.

**Entropy (`YIPRANMA`).** Still in the code behind a flag, off by default.

---

## 9. Known issues and next steps

### Known weaknesses
- **Nothing pushes back.** With events removed, the player initiates everything. The
  opposition is only a number at election time. This is the single biggest design gap.
- **Decisions are solvable.** Outcomes are deterministic and the odds are visible, so a
  player who understands the system is never surprised.
- **One interaction shape.** All 33 actions are read-text → pick-approach → see-result.
- **Content consumption.** ~60% of writing is unseen in a single campaign.

### Immediate next steps
1. **Onboarding.** A first-time player has no explanation of nüfuz, coalition, or document
   lifetimes. Required before any public release.
2. **Update the design document.** `oyun-tasarim-dokumani-v2.md` describes v21. It is
   ~30 versions behind.
3. **Packaging.** Verified path for a phone-only developer: build a PWA → host it (GitHub
   Pages / Netlify, both browser-configurable) → **PWABuilder** generates a signed Android
   package in the cloud, no Android Studio needed. Note: Google Play personal accounts
   created after 13 Nov 2023 must run a **closed test with 12 testers for 14 continuous
   days** before production access. Developer account is a one-time $25.
4. Content ratings: the design still contains detention of opposition figures and covert
   press operations. Execution was removed from the design on purpose. Expect these themes
   to raise the content rating.

---

## 10. Working notes for whoever continues

- **Every balance claim in this file came from a headless simulation, not intuition.** When
  you change a number, extract the engine and re-run. Assumptions here have been wrong
  repeatedly and simulation caught it every time — passive players winning, parliament
  never rejecting anything, laws being permanently destroyed on rejection, removal from
  office being mathematically unreachable.
- **Verify string edits.** Programmatic edits to this file failed silently several times
  because a target string had drifted. Always assert before writing, and re-check syntax
  after.
- **Turkish quotation marks are « ».** Straight double quotes inside a JS string will break
  the file — this happened twice.
- The author's stated preferences, consistently: **small numbers**, no fractional
  displays, clear plain language over jargon, and being asked before large changes.
