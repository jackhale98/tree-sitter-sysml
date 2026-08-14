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
