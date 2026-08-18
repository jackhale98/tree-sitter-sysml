# Grammar backlog

Pre-existing parse gaps, tracked for future generation cycles.

- ~~message payload~~ and ~~require feature-chain~~ gaps FIXED in
  optimization round 2 (the of-clause restructure removed the ambiguity
  and 2,100+ states at once; require takes a full feature ref).

## State-space optimization (approved 2026-08-12)

Baseline: STATE_COUNT 24469, LARGE_STATE_COUNT (see parser.c), ~70
CPU-minute generation, parser.c ~2M lines, ~60 declared GLR conflicts
(generator flags four as unnecessary: `_declaration`, `constraint_usage`,
`feature_usage`, `connect_statement`). Empirically, changes have
non-local effects at this size (an alias in a metadata-only rule
perturbed `message` statement resolution).

Plan, in order:
1. Newer tree-sitter CLI (`0.26.x --abi 14`) — generation-time
   experiment (keeps Emacs ABI-14 compatibility).
2. CI: never generate (committed parser.c is the artifact under test);
   recursive baseline-aware parse sweep + size metrics per commit
   (scripts/parse-sweep.sh).
3. `--report-states-for-rule` profiling; refactor in measured order.
4. Structural: collapse double-optional clause stacks in the usage
   family; factor the shared declaration skeleton into hidden rules;
   root-cause and remove band-aid conflicts one at a time.
5. External scanner only if grammar-level work stalls (context-sensitive
   keyword/identifier is the candidate).

Success metrics: STATE_COUNT, generation wall time, parser.c bytes,
corpus + sweep parity at every step.

### Profiling results (2026-08-13, --report-states-for-rule)

Top state consumers of 24,452 total (full report: run the flag):

| rule | states |
|---|---|
| kerml_usage | 3960 |
| _type_relationships | 2992 |
| then_succession | 2820 |
| action_usage | 2448 |
| end_feature | 1408 |
| message_statement | 1212 |
| flow_usage | 960 |
| binary_expression | 950 |
| usage (+repeat1) | 1121 |

Experiment log:
- Collapsing the 5-line optional stack (multiplicity/type-rel/multiplicity/
  qualifiers/type-rel -> repeat(choice(...))) in usage+action_usage:
  24452 -> 22826 states (-6.6%), corpus 200/200, sweep at baseline, AND
  makes the [$.usage] and [$.action_usage] conflicts unnecessary.
- SHIPPED (round 1): the above + kerml_usage's two deep stacks +
  then_succession's stack + removing three unnecessary conflicts:
  24452 -> 20511 states (-16.1%), LARGE_STATE_COUNT 5381 -> 4981,
  parser.c 51.4 -> 47.6 MB, and generation time ~70 min -> ~16 min
  (4.4x) — conflict removal cheapens table construction itself.
  Corpus 200/200, sweeps at exact per-line baselines.
- Round 2 candidates (by state count): _type_relationships (2992,
  87 call sites), then_succession tail sharing with action_usage
  (2820/2448), message_statement (1212 — combine with the payload
  parse-gap fix), end_feature (1408), expression family (~3500
  combined).
- CLI 0.26.12 --abi 14: 98 min (slower than 0.24.7's ~70) — not a path.
- Parallel generations contend on cache: 4 concurrent ran ~3.5x slower
  each. Run at most 2.

### Round 2 results (2026-08-13)

- Variant F (flatten optional(repeat1) at 83 sites): +4 states — the
  generator already optimizes this; _type_relationships' cost is its
  interior choice structure x 87 contexts. Round-3 material.
- Variant H (of-clause restructure in message_statement +
  then_succession): 20511 -> 18384 states AND fixes the payload parse
  gap — both known-imperfect files now parse fully clean.
- Final ship: H + require feature-chain fix: 20511 -> 18360 states
  (-10.5% this round; -25% cumulative from 24452), generation ~13 min,
  corpus 203 tests, known-parse-errors baseline EMPTY.
- Round 3 candidates: _type_relationships interior redesign (2992),
  then_succession/action_usage tail sharing (2820/2448), end_feature
  (1408), expression family, remaining ~50 conflicts.

### Round 3 results (2026-08-13)

- Blanket collapse of 2-line multiplicity/type-rel stacks (25 sites):
  DEAD END — every site conflicts; the short positional pairs are
  load-bearing disambiguation (auto-exclusion loop excluded 12 rules
  then diverged). Principle: only qualifier-context stacks collapse
  safely.
- Type-rel-first 4-line stacks (11 sites found post-round-2): 8 of 11
  collapse cleanly (interface/allocation/flow usage, end_feature,
  return_statement, subject/actor/objective declarations); excluded
  standalone_redefines (conflicts with metadata_body_usage redefines)
  and feature_usage x2 (conflicts with enum_member).
- Ship: 18360 -> 16468 states (-10.3%; -32.7% cumulative),
  LARGE_STATE_COUNT 4232, parser.c 39.4 MB.
- Diagnostic from the exclusions: collapses fail exactly where a rule
  is reachable inside another rule's trailing type-relationship
  position — "which rule owns the next :> X" is the real ambiguity.
  Round 4's _type_relationships interior redesign should solve
  ownership properly (e.g. attach type-rels at one canonical layer)
  instead of per-site collapse. Also queued: expression family
  (~2850), kerml_usage remainder (1984), qualified_name/feature_chain
  unification (CST-breaking; needs sysml-core migration).

### Round 4a (2026-08-13): minimal conflict set

Derived the conflict list from scratch (empty list -> re-add exactly
what the generator names, 49 fast-fail iterations): 57 -> 49 conflicts.
The 8 removed were inert (STATE_COUNT unchanged, tables identical,
corpus 203/203). Every remaining conflict is now generator-required by
construction — no more mystery band-aids; scripts/conflict_min.py-style
derivation can re-audit after any grammar change.

### Round 4b (2026-08-13): kerml_usage simplification

- kerml_usage merged to a single branch (endpoint clause optional for
  all KerML keywords - benign superset) with the ambiguous
  `[mult] ref to/=` endpoint branches factored to one prefix:
  16468 -> 16352 states. Modest numerically, but the rule is halved in
  size and one GLR fork gone; the remaining kerml_usage states live in
  endpoint follow-sets.
- Expression-family analysis (deferred to a dedicated session): merging
  bracket/index/select into one postfix rule with per-branch aliases
  could recover ~1-1.5k states BUT the three rules carry different
  precedences (1/3/11) whose interaction with binary operators would
  change parse trees if unified naively, and the node names are
  load-bearing in sysml-core's extract_expr. Prereq: expand expression
  corpus coverage (mixed precedence cases), then refactor with alias()
  per branch and explicit prec design.

### Round 5 (2026-08-14): the official corpus parses completely

Methodology shift (user mandate): validate exclusively against
human-created models. The full OMG release corpus (251 files:
training + validation + examples) is the oracle.

- Baseline was 242/251; the 9 failures decomposed into 8 constructs,
  all fixed as transcriptions of official usage: transition/succession
  then-targets with bodies, perform value assignment, render with body,
  allocate ::> end bindings (statement + clause forms), action assign
  effects, flow typed payloads with bodies.
- Result: 251/251. The validation and examples trees are imported into
  test/examples/ (339 files swept per commit) so regressions against
  OMG-authored code fail CI at file granularity.
- STATE_COUNT 16577 (+172 for the new coverage), corpus 208 tests.
- Still open: expression-corpus lockdown from official files ->
  postfix merge; _type_relationships ownership; pilot-implementation
  CI validation (the strongest oracle, unbuilt).

### Expression postfix merge: closed as a dead end (2026-08-14)

Tested with the official-expression lockdown corpus in place (CSTs
captured from OMG-written MassRollup2 / Vehicle Analysis Demo usage
before the experiment): merging bracket/index/select into one aliased,
per-branch-prec rule yielded +5 states AND changed the parse of 5
locked corpus cases. The generator already shares the left-recursion
states; the merge has no upside. The lockdown corpus stays as
permanent protection for expression CST shapes.

Remaining deep item before declaring the CST stable for the
sysml-core refactor: _type_relationships ownership redesign (one
canonical attachment layer). After CST-stable: sysml-core extractor
refactor, then CLI depth (evaluator consolidation, cache) - the
agreed order.

### Name-path unification: closed (2026-08-14)

Tested (qualified_name absorbing `.` segments, feature_chain removed,
consumers audited as compatible): -38 states and 9 corpus drifts
INCLUDING all three official-expression lockdown tests - the
unification reshapes how OMG-written expression code parses. No
structural payoff, real drift. Closed.

### CST declared STABLE (2026-08-14)

Every queued deep redesign is now either shipped or evidence-closed:
- Shipped: stack collapses (rounds 1-3), kerml_usage restructure,
  minimal conflict set, of-clause redesign, official-corpus constructs.
- Closed by experiment: blanket 2-line collapse, postfix merge,
  name-path unification (each protected the CST by failing loudly
  against locked corpora).
- _type_relationships ownership: remaining upside is small (1,316
  states) and its enabling premise (further collapses) is closed.

Consequence: the sysml-core extractor refactor planned for "after CST
changes" is NOT needed - no CST changes are coming. CLI-depth work
(evaluator consolidation, cache read path) is unblocked.

Final optimization tally: 24,452 -> 16,577 states (-32%), generation
~70 -> ~12 min, parser.c 51.4 -> 39.6 MB, conflicts 57 -> 49 (all
generator-required), 251/251 official files + 339-file sweep + 211
corpus tests as permanent oracles.

### satisfy_statement ambiguity: deferred with evidence (2026-08-18)

Found while debugging a user report of a "requirement that doesn't
exist in the model". In `satisfy_statement` every element after
`satisfy` is optional, so a bare `satisfy` is itself a valid statement.
GLR can therefore parse

    satisfy requirement X by Y;

two ways: as one satisfy statement, or as an empty `satisfy` followed
by a sibling `requirement_usage` named X. It chose DIFFERENTLY on two
identical adjacent lines of test/fixtures/simple-vehicle.sysml — line
171 split (producing a phantom requirement usage and losing the
satisfy edge), line 172 did not.

Attempted fix: make the reference mandatory
(`optional($._feature_ref)` -> `$._feature_ref`), which every satisfy
form in the official corpus satisfies. REVERTED: generation had not
finished after 54 minutes against a ~12 minute baseline, i.e. a
state-space blowup, and the change was not worth that cost because:

The input that triggered it is not conformant. The OMG pilot reads
`satisfy requirement X by Y;` as DECLARING an untyped requirement usage
named X (it warns "Duplicate of other owned member name"), not as
referencing the requirement def X. The conformant forms are
`satisfy X by Y;` (reference) and `satisfy requirement x : X by Y;`
(declaring, as in the corpus: `satisfy requirement req1 : Req1 by
system;`). With the fixtures corrected to conformant text, both
statements parse identically and correctly as `satisfy_statement` with
a `typed_by` child, and the file has zero parse errors.

If revisited: try `prec.dynamic` to bias GLR toward the complete
satisfy parse rather than restructuring the optional chain — dynamic
precedence steers runtime resolution without enlarging the tables,
which is what the mandatory-reference version did.
