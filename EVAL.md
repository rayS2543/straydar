# Straydar duplicate detection: labeled evaluation

Date: November 5, 2026
Scope: local evaluation only. Nothing was pushed or published. No production data was used, and no claim is made about usage of the app.

## Correction to the starting description

The engine does not merge reports automatically. Reading the code showed a human in the loop design:

1. `src/services/matching.js` (`findDuplicateCandidates`) finds cats with a sighting within a radius, default 150 m, and scores each candidate.
2. `src/hooks/useReportSubmission.js` pauses the submission if any candidate exists, even a candidate with score 0.
3. `src/components/map/DedupModal.jsx` shows the candidates and a person decides: "Yes, same cat" links the new sighting to the existing cat, and "No, this is a different cat" creates a new cat.

Because there is no automatic merge decision in the code, this eval reports three operating points (see Results). The headline point treats the engine's own `strong` label, shown to the user as "Likely match", as the predicted merge decision.

## What the engine actually scores

From `attributeMatchScore` and `matchStrength` in `src/services/matching.js`:

| Signal | Points |
| --- | --- |
| Same temperament on both reports, and not `unknown` | +2 |
| Each shared significant word in the two free text descriptions | +1 per word |
| Score 2 or more | strength `strong` ("Likely match") |
| Score 1 | strength `possible` ("Possible match") |
| Score 0 | strength `nearby` ("Nearby cat") |

Significant words are lowercased tokens longer than 2 characters, with punctuation stripped and a small stopword list removed (`the`, `a`, `cat`, `near`, `seen`, and similar).

Facts that matter for interpreting the numbers:

- There is no separate color, size, markings, or timing field. Color, size, and markings only count if a reporter wrote those words into the free text description. Timing counts for nothing: no timestamp reaches the matcher.
- Nothing ever subtracts points. A conflicting word (a different color, a different collar color, an explicit "no white markings") is ignored at best and, in the negation case, counted as a match.
- There is no stemming or synonym handling. `limp` and `limping`, `scar` and `scarred`, `grey` and `gray`, `ginger` and `orange` are all different tokens.
- Distance is a hard gate, not a score input. A cat at 149 m and a cat at 10 m are treated the same once inside the radius, and a cat at 151 m is invisible to the matcher.

## Method

Runner: `eval/run_eval.mjs`. Dataset: `eval/dataset.mjs`. Full per case output: `eval/results.json`.

The runner imports the production code and runs it. It does not reimplement any scoring:

- `findDuplicateCandidates`, plus `attributeMatchScore` and `matchStrength` indirectly, from `src/services/matching.js`
- `distanceMeters` and `offsetCoords` from `src/services/geo.js`

`findDuplicateCandidates` is dependency injected by design. The only glue supplied by the harness is the same glue `src/context/DataContext.jsx` supplies in the app: filter sightings to `distanceMeters(coords, sighting) <= radius`, sorted by distance, and look cats up by id. That glue contains no matching or scoring decisions. The engine runs standalone with no Supabase dependency on this path, so no numbers here required a backend.

Each case is one pair: one existing cat with one prior sighting, and one incoming report placed at an exact planned distance from that sighting (10 m to 400 m, placed with the production `offsetCoords`, verified in `results.json` as `actualDistanceM`).

Reproduce:

```bash
npm ci
node eval/run_eval.mjs   # rewrites eval/results.json and prints the summary
npm test                 # existing suite: 47 tests passed, including 12 for matching.js
```

## Dataset and labeling

60 pairs, balanced by construction: 30 should merge, 30 should not merge.

Labels were assigned before any engine run, by underlying cat identity, not by engine output and not by whether the descriptions looked similar:

- Should merge: the incoming report was written as a re-sighting of the same individual cat, with realistic reporter variation: paraphrase, a different observer reading temperament differently, vaguer wording, or a sighting farther from the last one.
- Should not merge: the incoming report was written as a different individual. The distinguishing fact for each case is recorded in the `rationale` field of the dataset (for example: a sibling in the same colony, a different TNR cat with an ear tip, a different collared cat).

Composition:

| Group | Count | Contents |
| --- | --- | --- |
| Should merge, clear re-sighting | 22 | Same cat, wording largely preserved, including 2 cases just inside the radius (130 m and 140 m) and 1 case where the second observer recorded a different temperament |
| Should merge, hard | 6 | Synonym paraphrase (3), word form change down to one shared word (1), vague re-report sharing one color word (2) |
| Should merge, outside radius | 2 | Same cat re-sighted at 165 m and 240 m |
| Should not merge, clearly different or outside radius | 10 | No shared traits, or a lookalike 160 m to 400 m away |
| Should not merge, hard | 20 | Shared temperament only (4), one shared generic word (6), lookalike colony cats (7), negation (1), shared object word (1), shared coat words (1) |

## Results

Predicted merge definitions are stated per row, since the product itself delegates the final call to a person.

| Operating point | Predicted merge means | TP | FP | TN | FN | Precision | Recall | F1 | Accuracy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Strong (headline) | Top candidate score 2 or more, the "Likely match" label | 22 | 14 | 16 | 8 | 0.611 | 0.733 | 0.667 | 0.633 |
| Possible or better | Top candidate score 1 or more | 26 | 20 | 10 | 4 | 0.565 | 0.867 | 0.684 | 0.600 |
| Any candidate (actual app behavior) | Any cat with a sighting within 150 m, score 0 included; this is what opens the review modal | 28 | 26 | 4 | 2 | 0.519 | 0.933 | 0.667 | 0.533 |

Read on the headline row: when the engine says "Likely match", it is right about 61 percent of the time on this dataset, and it misses about 27 percent of the pairs that should merge.

Read on the last row: as a review prompt the behavior is high recall and low precision. Only the 2 outside radius positives are never surfaced. Every one of the 26 different cats inside the radius is surfaced, which is safe if the person in the modal chooses correctly, and is pure interruption cost if they were never plausible.

## Failures at the strong threshold

22 of 60 pairs were wrong at the headline threshold: 8 false negatives and 14 false positives. Scores and shared words below are the engine's own output, from `eval/results.json`.

### False negatives: should merge, engine scored below strong

| ID | Distance | Score | Why it failed |
| --- | --- | --- | --- |
| P11 | 45 m | 0 | Same cat described as "Grey cat with a limp", then "Gray cat limping badly". Grey/gray and limp/limping share no token, and the second temperament was `unknown`, so no points at all. |
| P13 | 70 m | 0 | Same kitten: "Kitten, ginger, very thin" versus "Young orange cat, skinny". Every content word was paraphrased to a synonym the matcher cannot equate. |
| P12 | 35 m | 1 | Same cat: "Small tortoiseshell with a torn ear" versus "Petite tortie, notched ear". Only the generic word `ear` matched. |
| P22 | 75 m | 1 | Same cat: "Cat with a limp and a clipped ear" versus "Limping cat, ear tipped". Only `ear` matched. |
| P29 | 50 m | 1 | Vague re-report of the same cat shared only `orange`. |
| P30 | 90 m | 1 | Vague re-report of the same cat shared only `black`. |
| P16 | 165 m | no candidate | Same cat, near identical wording, but the re-sighting was 15 m outside the hard radius gate. |
| P17 | 240 m | no candidate | Same cat, identical wording, 90 m outside the radius gate. The radius is the whole failure: scoring never ran. |

Pattern: 6 of the 8 misses are vocabulary failures inside the radius, and 2 are the hard radius cutoff. Paraphrase, word form changes, and vague second reports are normal reporter behavior, and the token overlap rule has no defense against any of them.

### False positives: should not merge, engine said strong

| ID | Distance | Score | Why it failed |
| --- | --- | --- | --- |
| N05 | 40 m | 2 | Different cats. Zero description words shared. Same temperament alone is worth 2 points, which is the entire strong threshold. |
| N06 | 70 m | 2 | Different cats, temperament only, same cause as N05. |
| N07 | 25 m | 2 | Different cats, temperament only, same cause as N05. |
| N24 | 145 m | 2 | Different cats, temperament only, at the edge of the radius. |
| N09 | 80 m | 2 | Different black cats. The incoming report said "no white markings" about a cat recorded with white paws. The matcher counted both `black` and the negated `white` as shared. |
| N26 | 110 m | 2 | Different cats sharing only the coat words `long` and `haired`. Their colors (grey versus black) differ, but a difference earns no penalty, so the shared generic words carry the pair to strong. |
| N18 | 75 m | 3 | Different collared cats: red collar versus blue collar, bell. Shared `collar` plus same temperament. The differing collar color is invisible to an additive only score. |
| N12 | 55 m | 3 | Different calico in the same colony. Shared `calico`, `orange`, `patches`. Generic colony wording describes several real cats equally well. |
| N22 | 90 m | 3 | Different grey and white cats. Shared `grey`, `white`, `paws`, with the traits distributed differently on the actual animals. Token overlap has no notion of where a marking sits. |
| N17 | 65 m | 4 | Different tabbies, brown versus grey. Shared `tabby` and `tail`, plus same temperament. The conflicting colors cost nothing. |
| N28 | 60 m | 4 | Two different TNR colony cats, both ear tipped tabbies. Shared `ear` and `tabby`, plus same `feral` temperament. Ear tipping is a colony wide intervention, not an identity. |
| N29 | 30 m | 4 | Different orange and white cats. The same two color words in reverse order, plus same temperament. |
| N11 | 45 m | 5 | Different black cat. Shared `black`, `green`, `eyes`, plus same temperament. The one distinguishing detail (a white toe) only added a word; it did not subtract anything. |
| N10 | 35 m | 6 | Different sibling in the same colony with a literally identical generic description: "Orange tabby with white paws", same temperament. No text only matcher could separate this pair; it is the ceiling case for the current inputs. |

Patterns in the false positives, in order of how fixable they look:

1. Temperament alone reaches strong. 4 of the 14 false positives (N05, N06, N07, N24) had no shared description word at all. One design constant causes them: same non-`unknown` temperament is +2 and strong starts at 2.
2. Additive only scoring. Conflicting attributes never subtract, so different colors, different collar colors, and an explicit negation all either cost nothing or actively help the wrong pair (N09, N17, N18, N26). A distinguishing detail that appears in only one description, such as the white toe in N11, is simply ignored rather than counted as evidence against a match.
3. Generic colony vocabulary. Orange tabby, black with green eyes, calico with patches, ear tipped tabby: these describe many real cats in one colony. 7 lookalike cases scored 3 to 6. Text overlap on these inputs cannot carry identity by itself; photos exist in the data model (`primary_photo_url`, sighting `photo_url`) but the matcher never looks at them.

## Limits of this eval

- Synthetic dataset, written to the engine's input format and to realistic stray cat reporting. It is not a sample of real reports, and the 50/50 merge base rate is a construction choice, so precision here will not transfer directly to a real report stream where most nearby pairs are presumably different cats. A lower real merge rate would push precision down at every operating point.
- Pairwise only: one existing cat and one sighting per case. It does not test ranking when several candidate cats are nearby at once, and it does not test group or cluster merging, which the product does not implement either (each decision links one new sighting to one chosen cat).
- Small n. 60 pairs gives a useful directional read on failure modes, not tight confidence intervals. A change of 2 pairs moves F1 by roughly 0.03.
- Labels for hard cases rest on the construction rationale recorded per case. A skeptical reader can audit every label in `eval/dataset.mjs`; that auditability is the point of recording the distinguishing fact per pair.

## Bottom line

The engine is a reasonable review prompter and a weak identity judge. As shipped, its best property is recall at the flagging level (0.933) because it flags everything within 150 m, and its worst property is that its top confidence label can be earned by temperament alone or by generic colony wording that fits several different cats. The three cheapest targeted fixes suggested by the failures, none applied in this eval: require at least one shared description word before a candidate can be labeled strong, let conflicting color words subtract, and add stemming or synonym normalization for the small vocabulary of cat descriptions (color spellings, limp/limping, ginger/orange, tortie/tortoiseshell).

## Post-fix re-run (November 5, 2026)

The three fixes suggested above were implemented in `src/services/matching.js` (branch `fix/dedup-scoring`) and the same untouched dataset was re-run through the updated engine. Dataset, labels, and runner were not modified.

What changed in the engine:

1. A `strong` rating now requires at least one shared significant description word. A candidate whose score comes from temperament alone (previously +2, exactly the strong threshold) is capped at `possible` in `findDuplicateCandidates`.
2. Conflicting colors subtract. If both descriptions name coat or marking colors (after normalization) and the two color sets do not overlap at all, the score takes a 2 point penalty and the conflict is recorded in the candidate's reasons.
3. Vocabulary is normalized before word matching: light stemming (limp/limping, tip/tipped, paws/paw), a small synonym map (grey/gray, ginger/orange, tortie/tortoiseshell, kitty/kitten, skinny/thin, petite/small), and negation handling, so a word directly negated ("no white markings") is excluded from the matchable set and can no longer count as shared.

Before and after, same operating points:

| Operating point | Metric | Before | After |
| --- | --- | --- | --- |
| Strong (headline) | Precision | 0.611 | 0.788 |
| Strong (headline) | Recall | 0.733 | 0.867 |
| Strong (headline) | F1 | 0.667 | 0.825 |
| Strong (headline) | TP / FP / TN / FN | 22 / 14 / 16 / 8 | 26 / 7 / 23 / 4 |
| Possible or better | Precision | 0.565 | 0.683 |
| Possible or better | Recall | 0.867 | 0.933 |
| Possible or better | F1 | 0.684 | 0.789 |
| Any candidate (actual app behavior) | Precision / Recall / F1 | 0.519 / 0.933 / 0.667 | 0.519 / 0.933 / 0.667 (unchanged; the 150 m gate itself was not modified) |

All three fixes were kept: each one raised or held overall F1 at the strong threshold, and none made a headline metric worse. Failures at the strong threshold dropped from 22 of 60 to 11 of 60. The 4 remaining false negatives are the 2 vague re-reports that share a single color word (P29, P30, scoring 1) and the 2 re-sightings outside the 150 m radius (P16, P17), which scoring changes cannot reach. The 7 remaining false positives are all colony lookalikes (N10, N11, N12, N17, N22, N28, N29) whose generic wording genuinely fits several cats; N17 now absorbs the color conflict penalty (brown versus grey) but its temperament and shared pattern words still carry it to a score of 2.

Test suite after the changes: 47 tests passed, 6 files. One existing expectation was updated: the combined temperament and description test in `src/services/matching.test.js` now expects a score of 4 instead of 3, because stemming makes "limp" and "limping" a second shared keyword. No other test changed.

## Files

- `EVAL.md`: this report
- `eval/dataset.mjs`: the 60 labeled pairs, with per case rationale (unchanged by the post-fix re-run)
- `eval/run_eval.mjs`: the runner, importing the production `matching.js` and `geo.js`
- `eval/results.json`: full per case scores, strengths, reasons, and distances (now reflects the fixed engine)

The original run changed no engine code; the post-fix re-run changed `src/services/matching.js` and one expectation in `src/services/matching.test.js`, as documented above.
