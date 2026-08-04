# tree-sitter-sysml

Tree-sitter grammar for **SysML v2** and **KerML** textual notation per the
OMG SysML v2.0 and KerML 1.0 specifications.

## Features

- **Near-complete language coverage** — parses all 213 official OMG example and
  training files plus 92 of 94 standard library files from the
  [SysML-v2-Release](https://github.com/Systems-Modeling/SysML-v2-Release)
  repository with zero errors, and 165 of the 169 code listings in the
  *SysML v2 Book* (Weilkiens, 2026-05) — the remaining 4 are deliberate
  fragments/errata in the book itself
- **Definitions** — unified rule covering 40+ definition keywords (part, action,
  state, port, connection, attribute, item, requirement, constraint, view,
  calc, class, struct, type, function, and more)
- **Usages** — unified rule covering 20+ usage keywords, plus specialized rules
  for action, state, connection, interface, constraint, requirement, event,
  allocation, flow, metadata, binding, succession, and KerML usages
- **Behavioral constructs** — actions, states, transitions, control flow
  (if/else-if/else, while/for with body and ref forms, typed for-loops with
  `1..n` ranges), terminate (with occurrence argument), inline transitions,
  send/accept with `when`/`at`/`after` triggers, `do action send ... via ...`
  transition effects, entry/do/exit actions with names and types, while-until
  loops, fork/join/merge/decide nodes, action chaining with `then`
  (including `then perform action` and `then include`)
- **Relationships** — specialization (`:>` / `specializes`), redefinition
  (`:>>` / `redefines`), binding (`::>`), conjugation, chaining, crosses (`=>`),
  `typed by` / `defined by`, `unions` / `intersects` / `differences`,
  `featuring by`, `disjoint from` — all supporting comma-separated multiple targets
- **Connections** — named binding/succession usages with multiplicity on endpoints,
  multi-end connections with `crosses`, end features with occurrence/action/flow
  qualifiers, `::>` bindings in parenthesized connect clauses
- **Expressions** — arithmetic, logical, comparison, invocation with named
  arguments (structured `named_argument` nodes) and qualified names,
  conditional, `new` expressions, function-literal body expressions
  (`{ in x; expr }`) as call arguments and values, `->` collect/select/reduce
  arrows with bodies, invocations, and function references, `.?{...}` select,
  `meta` expressions, classification operators `@` and `@@`, result expressions
- **Requirements** — `assert`/`not satisfy`, `require constraint/requirement`
  with bodies, subject/actor/objective/stakeholder/frame declarations with
  full type relationship and multiplicity support
- **Metadata** — `#` prefix annotations with qualified names (also before
  body statements like `allocate`), qualified metadata annotations with
  bodies (`@Pkg::Def { ... }`), structured `metadata_body` with
  `redefines`/`:>>` patterns, `metadata ... about` clause, `member feature`
  declarations
- **Variability** — `variation`/`variant` and all other modifiers are named
  `modifier` CST nodes, queryable for variant-aware tooling (Ch 35)
- **Standard library patterns** — standalone multiplicity definitions, feature
  qualifiers (`nonunique`, `ordered`), `default` with body values, `bind`
  statements, standalone `:>>` redefines in bodies, quoted operator names
- **Views** — render with rendering keyword and typing, expose, viewpoint frames
- **Textual representation** — `rep`/`language` blocks for embedding foreign code
- **Multiplicity** with `ordered nonunique` in any order, flexible positioning
  between name, type, and specialization
- **Imports** with recursive `**`, packages with short names, bare `namespace`
  (KerML), dependencies with comma-separated targets, comments with multi-target
  `about` and `locale` support

## Test coverage

- **198 corpus tests** covering definitions, usages, expressions, control flow,
  connections, requirements, states, imports, packages, comments, and KerML extensions
- **213 official OMG files** (examples, training, KerML) — all parse with zero errors
- **92/94 standard library files** — near-complete coverage of the SysML v2 and
  KerML standard libraries (Kernel Semantic, Kernel Function, Domain, Systems)

The 2 remaining standard library files (Actions.sysml, Occurrences.kerml) use
inline action body chaining and complex `end` feature patterns that cannot be
added without exceeding tree-sitter's generator memory limits.

## Installation

### GitHub Releases

Pre-built binaries (Linux, macOS, Windows) and WASM artifacts are published
automatically on each tagged release. See
[Releases](https://github.com/jackhale98/tree-sitter-sysml/releases).

### Emacs (29.1+)

Install the grammar:

```elisp
(add-to-list 'treesit-language-source-alist
             '(sysml "https://github.com/jackhale98/tree-sitter-sysml" nil "src"))
(treesit-install-language-grammar 'sysml)
```

Then use [sysml2-mode](https://github.com/jackhale98/sysml2-mode) which
automatically activates tree-sitter when the grammar is available.

### Neovim

Add to your nvim-treesitter config:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.sysml = {
  install_info = {
    url = "https://github.com/jackhale98/tree-sitter-sysml",
    files = {"src/parser.c"},
    branch = "main",
  },
  filetype = "sysml",
}
```

### Helix / Zed

Copy `queries/` to your editor's runtime queries directory as `sysml/`.

## Building from source

```sh
npm install
npx tree-sitter generate
npx tree-sitter test
```

### Build WASM

```sh
npx tree-sitter build --wasm
```

### Build shared library for Emacs

```sh
make emacs
cp tree-sitter-sysml.so ~/.emacs.d/tree-sitter/libtree-sitter-sysml.so
```

## Queries

- `queries/highlights.scm` — Syntax highlighting
- `queries/indents.scm` — Indentation
- `queries/folds.scm` — Code folding

## File types

- `.sysml` — SysML v2 files
- `.kerml` — KerML files

## License

GPL-3.0-or-later
