// Labeled dedup evaluation dataset for Straydar.
//
// Ground truth is identity by construction, assigned BEFORE any engine run:
// - shouldMerge=true: the two reports describe the same underlying cat.
//   The second report is a realistic re-sighting: paraphrased wording,
//   a possibly different observed temperament, and a new location.
// - shouldMerge=false: the two reports describe two different underlying
//   cats. Distinguishing facts used when building the case (a sibling in the
//   same colony, a different marking, a different individual with only a
//   generic trait in common) are recorded in `rationale`.
// Labels were NOT assigned by looking at engine scores. Hard negatives
// (lookalike colony cats, shared temperament only, one shared generic word)
// and hard positives (synonyms, word-form changes, vague re-reports, a cat
// seen just outside 150 m) are included on purpose and tagged in `category`.
//
// Fields the engine can actually see: temperament + free-text description
// for each side, plus sighting distance. There is no separate color, size,
// markings, or timing field in the app, so those attributes only reach the
// engine when a reporter happened to write them into the description.
// Timing is therefore varied in the narratives but, correctly, has no
// representation here: the engine never receives a timestamp.

const c = (id, shouldMerge, category, distanceM, existing, incoming, rationale) => ({
  id,
  shouldMerge,
  category,
  distanceM,
  existing,
  incoming,
  rationale,
})

const P = (id, category, d, eTemp, eDesc, nTemp, nDesc, why) =>
  c(id, true, category, d, { temperament: eTemp, description: eDesc }, { temperament: nTemp, description: nDesc }, why)
const N = (id, category, d, eTemp, eDesc, nTemp, nDesc, why) =>
  c(id, false, category, d, { temperament: eTemp, description: eDesc }, { temperament: nTemp, description: nDesc }, why)

export const CASES = [
  // ---- Should merge: same cat, clear re-sighting ----
  P('P01', 'clear-resighting', 25, 'friendly', 'Orange tabby with white paws and striped tail', 'friendly', 'Orange tabby, white paws, striped tail near alley', 'Same cat, near-identical wording.'),
  P('P02', 'clear-resighting', 40, 'skittish', 'Black cat with green eyes and torn left ear', 'skittish', 'Black cat, green eyes, torn ear', 'Same cat, near-identical wording.'),
  P('P03', 'word-form-change', 60, 'friendly', 'Large grey tabby with a limp in hind leg', 'unknown', 'Grey tabby limping, large build', 'Same cat; limp becomes limping, which the tokenizer cannot equate.'),
  P('P04', 'clear-resighting', 30, 'feral', 'Calico with orange and black patches, small size', 'feral', 'Small calico, orange patches', 'Same cat.'),
  P('P05', 'clear-resighting', 80, 'unknown', 'White cat with one blue eye and one green eye', 'unknown', 'White cat, heterochromia, blue and green eyes', 'Same cat; eye becomes eyes.'),
  P('P06', 'clear-resighting', 15, 'friendly', 'Siamese with dark points and blue eyes, very vocal', 'friendly', 'Vocal Siamese, blue eyes', 'Same cat.'),
  P('P07', 'word-form-change', 110, 'skittish', 'Tiny black kitten with white chest spot', 'unknown', 'Small black kitten, white spot on chest', 'Same kitten; tiny becomes small.'),
  P('P08', 'clear-resighting', 50, 'unknown', 'Orange cat with freckled nose and missing tail tip', 'friendly', 'Orange cat missing tail tip, freckles on nose', 'Same cat; freckled becomes freckles.'),
  P('P09', 'clear-resighting', 90, 'feral', 'Brown tabby with notched right ear, TNR clipped', 'unknown', 'Brown tabby, ear tipped, clipped', 'Same TNR cat.'),
  P('P10', 'clear-resighting', 20, 'friendly', 'Long haired white and grey cat, fluffy tail', 'friendly', 'Fluffy long haired grey and white cat', 'Same cat, word order changed.'),
  P('P14', 'temperament-reobserved', 55, 'friendly', 'Black and white tuxedo cat with pink nose', 'skittish', 'Tuxedo cat, pink nose, black and white coat', 'Same cat; second observer read it as skittish.'),
  P('P15', 'near-radius-edge-inside', 130, 'friendly', 'Orange tabby with white paws', 'friendly', 'Orange tabby white paws', 'Same cat, 130 m away.'),
  P('P18', 'clear-resighting', 100, 'unknown', 'Dilute calico, pale orange and grey patches', 'unknown', 'Pale calico with grey patches', 'Same cat.'),
  P('P19', 'word-form-change', 65, 'feral', 'All black cat, yellow eyes, scar on nose', 'feral', 'Black cat, yellow eyes, scarred nose', 'Same cat; scar becomes scarred.'),
  P('P20', 'clear-resighting', 85, 'friendly', 'Medium tabby, striped legs, white belly', 'unknown', 'Tabby with striped legs and white belly', 'Same cat.'),
  P('P21', 'clear-resighting', 30, 'unknown', 'White cat with black spot on head', 'unknown', 'White cat, black spot, head marking', 'Same cat.'),
  P('P23', 'word-form-change', 95, 'skittish', 'Longhair orange cat, matted fur', 'skittish', 'Orange long haired cat, tangled coat', 'Same cat; longhair splits, matted becomes tangled.'),
  P('P24', 'clear-resighting', 45, 'unknown', 'Spotted brown cat, Bengal markings', 'unknown', 'Brown spotted cat with rosettes', 'Same cat.'),
  P('P25', 'clear-resighting', 120, 'friendly', 'Cream colored cat with blue collar', 'unknown', 'Cream cat wearing a blue collar', 'Same collared cat.'),
  P('P26', 'clear-resighting', 15, 'unknown', 'Three legged grey tabby', 'unknown', 'Grey tabby missing a leg', 'Same three-legged cat; legged does not match leg.'),
  P('P27', 'near-radius-edge-inside', 140, 'unknown', 'Orange tabby with torn ear', 'unknown', 'Orange tabby torn ear', 'Same cat, 140 m away.'),
  P('P28', 'clear-resighting', 60, 'friendly', 'Silver tabby, green collar, bell', 'friendly', 'Silver tabby with green collar', 'Same collared cat.'),

  // ---- Should merge: hard positives the wording defeats ----
  P('P11', 'synonym-paraphrase', 45, 'friendly', 'Grey cat with a limp', 'unknown', 'Gray cat limping badly', 'Same cat; grey/gray and limp/limping share no token.'),
  P('P12', 'synonym-paraphrase', 35, 'skittish', 'Small tortoiseshell with a torn ear', 'unknown', 'Petite tortie, notched ear', 'Same cat; only the generic word ear is shared.'),
  P('P13', 'synonym-paraphrase', 70, 'unknown', 'Kitten, ginger, very thin', 'unknown', 'Young orange cat, skinny', 'Same kitten; ginger/young/thin all paraphrased away.'),
  P('P22', 'word-form-change', 75, 'friendly', 'Cat with a limp and a clipped ear', 'unknown', 'Limping cat, ear tipped', 'Same cat; only ear is shared.'),
  P('P29', 'vague-rereport', 50, 'friendly', 'Friendly orange cat', 'unknown', 'Orange cat seen again', 'Same cat; vague re-report shares only orange.'),
  P('P30', 'vague-rereport', 90, 'unknown', 'Small black cat', 'unknown', 'Black cat', 'Same cat; vague re-report shares only black.'),

  // ---- Should merge: same cat seen outside the 150 m radius ----
  P('P16', 'outside-radius', 165, 'friendly', 'Orange tabby with white paws', 'friendly', 'Orange tabby white paws', 'Same cat, but the re-sighting is 165 m from the prior sighting.'),
  P('P17', 'outside-radius', 240, 'skittish', 'Calico with orange patches', 'skittish', 'Calico with orange patches', 'Same cat, but the re-sighting is 240 m away.'),

  // ---- Should not merge: different cats, safely separated ----
  N('N01', 'outside-radius-lookalike', 400, 'friendly', 'Orange tabby with white paws', 'friendly', 'Orange tabby with white paws', 'Different cat 400 m away; identical generic wording.'),
  N('N02', 'outside-radius-lookalike', 300, 'skittish', 'Black cat with green eyes', 'skittish', 'Black cat with green eyes', 'Different cat 300 m away.'),
  N('N03', 'clearly-different-nearby', 30, 'friendly', 'Orange tabby with white paws', 'skittish', 'Black cat with green eyes', 'Two different cats 30 m apart, no shared traits.'),
  N('N04', 'clearly-different-nearby', 50, 'feral', 'White longhair adult', 'friendly', 'Black shorthair kitten', 'Two different cats, no shared traits.'),
  N('N15', 'clearly-different-far', 200, 'friendly', 'Orange tabby', 'skittish', 'Black cat', 'Different cats, also outside radius.'),
  N('N16', 'clearly-different-nearby', 20, 'friendly', 'Orange tabby with striped tail', 'feral', 'Black cat with yellow eyes', 'Two different cats 20 m apart.'),
  N('N19', 'clearly-different-nearby', 40, 'unknown', 'Tortoiseshell, small', 'unknown', 'Siamese, large, vocal', 'Two different cats, no shared traits.'),
  N('N23', 'clearly-different-nearby', 130, 'friendly', 'Silver tabby with green collar', 'skittish', 'Brown cat with torn ear', 'Two different cats near the radius edge.'),
  N('N25', 'outside-radius-lookalike', 160, 'unknown', 'Orange tabby with white paws', 'unknown', 'Orange tabby with white paws', 'Different cat just outside radius; identical generic wording.'),
  N('N30', 'clearly-different-nearby', 35, 'unknown', 'Spotted Bengal, brown rosettes', 'unknown', 'Plain grey shorthair', 'Two different cats, no shared traits.'),

  // ---- Should not merge: hard negatives ----
  N('N05', 'shared-temperament-only', 40, 'friendly', 'Orange tabby with white paws', 'friendly', 'Black cat with green eyes', 'Different cats; only temperament matches.'),
  N('N06', 'shared-temperament-only', 70, 'skittish', 'Grey tabby, striped', 'skittish', 'White cat, blue eyes', 'Different cats; only temperament matches.'),
  N('N07', 'shared-temperament-only', 25, 'feral', 'Calico with patches', 'feral', 'Black kitten', 'Different cats; only temperament matches.'),
  N('N24', 'shared-temperament-only', 145, 'friendly', 'Cream cat with red collar', 'friendly', 'Black cat, yellow eyes', 'Different cats near radius edge; only temperament matches.'),
  N('N08', 'one-shared-generic-word', 60, 'unknown', 'Orange tabby', 'unknown', 'Orange cat with black stripes', 'Different orange cats; only orange is shared.'),
  N('N09', 'negation-not-handled', 80, 'unknown', 'Black cat with white paws', 'unknown', 'Black cat, yellow eyes, no white markings', 'Different black cats. Black is shared, and white is also counted as shared even though the new report explicitly denies white markings. The engine has no negation handling.'),
  N('N13', 'one-shared-generic-word', 90, 'friendly', 'Brown tabby, striped tail', 'skittish', 'Grey tabby, white belly', 'Different tabbies; only tabby is shared.'),
  N('N14', 'one-shared-generic-word', 100, 'unknown', 'White cat with black spot on head', 'unknown', 'White cat, all white, blue eyes', 'Different white cats; only white is shared.'),
  N('N20', 'one-shared-generic-word', 55, 'unknown', 'Small black kitten', 'unknown', 'Small white adult cat', 'Different cats; only the size word small is shared.'),
  N('N21', 'one-shared-generic-word', 85, 'unknown', 'Small black cat', 'unknown', 'Large black cat', 'Different black cats of different size; only black is shared.'),
  N('N27', 'one-shared-generic-word', 45, 'unknown', 'Cat with pink collar and bell', 'unknown', 'Cat with pink nose', 'Different cats; only pink is shared, on different objects.'),
  N('N10', 'lookalike-colony', 35, 'friendly', 'Orange tabby with white paws', 'friendly', 'Orange tabby with white paws', 'Different sibling in the same colony; generic description is identical.'),
  N('N11', 'lookalike-colony', 45, 'skittish', 'Black cat, green eyes', 'skittish', 'Black cat, green eyes, white toe', 'Different black cat; near identical generic description.'),
  N('N12', 'lookalike-colony', 55, 'unknown', 'Calico, orange and black patches', 'unknown', 'Calico with orange patches', 'Different calico in the same colony.'),
  N('N17', 'lookalike-colony', 65, 'friendly', 'Brown tabby, long tail', 'friendly', 'Grey tabby, short tail', 'Different tabbies; tabby and tail are shared, colors differ but nothing subtracts points.'),
  N('N18', 'shared-object-word', 75, 'friendly', 'Cat with red collar', 'friendly', 'Cat with blue collar, bell', 'Different collared cats; collar plus temperament match, collar color differs with no penalty.'),
  N('N22', 'lookalike-colony', 90, 'skittish', 'Grey cat, white paws', 'unknown', 'White cat, grey saddle, paws down', 'Different grey and white cats with the same traits in different distribution.'),
  N('N26', 'shared-coat-words', 110, 'friendly', 'Long haired grey cat', 'skittish', 'Long haired black cat', 'Different cats; only coat length wording is shared, color differs with no penalty.'),
  N('N28', 'lookalike-colony', 60, 'feral', 'Notched ear, brown tabby', 'feral', 'Clipped ear, grey tabby', 'Two different TNR colony cats, both ear-tipped tabbies.'),
  N('N29', 'lookalike-colony', 30, 'friendly', 'White and orange cat', 'friendly', 'Orange and white cat, spot on tail', 'Different orange and white cats; same color words reversed.'),
]
