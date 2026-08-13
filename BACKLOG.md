# Grammar backlog

Pre-existing parse gaps, tracked for future generation cycles.

- `message ... of <payload> : Type [= expr] from a.b to c.d;` never parses
  cleanly (pre-existing at v0.5.0: annex-a lines 781/782, training/27
  lines 30/32). The message_statement `of`-clause grammar binds the payload
  name/type ambiguously against the required feature_ref; needs a rule
  restructure (own generation cycle — generate takes ~70 min).
- `require <feature_chain>;` inside objectives (annex-a line 1098) also
  pre-existing.

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
