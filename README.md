# tree-sitter-sysml

Tree-sitter grammar for **SysML v2** and **KerML** textual notation per the
OMG SysML v2.0 and KerML 1.0 specifications.

## Features

- **Full language coverage** — parses all 88 official OMG example files from
  all 21 example directories in the
  [SysML-v2-Release](https://github.com/Systems-Modeling/SysML-v2-Release)
  repository with zero errors
- **41+ definition types** (SysML v2 + KerML) with optional names (anonymous
  definitions), comma-separated specialization targets, and short names
- **30+ usage types** including binding, succession, succession flow, invariant,
  boolean expression, enum, event occurrence, and full modifier support
- **Behavioral constructs**: actions, states, transitions, control flow (if/while/for
  with body and ref forms), terminate, inline transitions, send/accept/after,
  while-until loops, entry assign/send patterns
- **Relationships**: specialization (`:>` / `specializes`), redefinition (`:>>` /
  `redefines`), binding (`::>`), conjugation, chaining, crosses (`=>`),
  `typed by` / `defined by`, `unions` / `intersects` / `differences`,
  `featuring by` — all supporting comma-separated multiple targets
- **Connections**: named binding/succession usages, multi-end connections with
  `crosses`, end features with multiplicity and item/ref/port/part qualifiers,
  `::>` bindings in parenthesized connect clauses
- **Expressions**: arithmetic, logical (`&`), comparison, invocation with named
  arguments and qualified names, conditional, `new` with qualified names,
  `->` collect/arrow, `.?{...}` select, `->name{...}` body expressions,
  result expressions (trailing expr without `;`)
- **Requirements**: `assert`/`not satisfy`, `require constraint/requirement`
  with bodies, subject/actor/objective/stakeholder/frame declarations
- **Metadata**: `#` prefix annotations with qualified names, structured
  `metadata_body` with `redefines`/`:>>` patterns, `metadata ... about` clause
- **Views**: render with rendering keyword and typing, expose, viewpoint frames
- **Textual representation**: `rep`/`language` blocks for embedding foreign code
- **Multiplicity** with `ordered nonunique` in any order, flexible positioning
  between name, type, and specialization
- **Imports** with recursive `**`, packages with short names, bare `namespace`
  (KerML), dependencies with comma-separated targets, comments with multi-target
  `about` and `locale` support

## Test coverage

- **198 corpus tests** covering definitions, usages, expressions, control flow,
  connections, requirements, states, imports, packages, comments, and KerML extensions
- **88 official OMG example files** from all 21 example directories, including:
  - Simple Tests (34 files)
  - Vehicle Example, Camera, Flashlight, Room Model
  - Arrowhead Framework (domain-specific metaclasses)
  - Interaction Sequencing (message flows, event occurrences)
  - Metadata, Requirements, Analysis, Verification
  - Geometry, Mass Roll-up, Dynamics
  - Variability, Individuals, Cause and Effect

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
