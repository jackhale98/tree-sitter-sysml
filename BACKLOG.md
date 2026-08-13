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
