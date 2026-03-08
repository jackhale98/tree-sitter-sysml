# tree-sitter-sysml

Tree-sitter grammar for **SysML v2** and **KerML** textual notation per the
OMG SysML v2.0 and KerML 1.0 specifications.

## Features

- **41 definition types** (SysML v2 + KerML)
- **30+ usage types** including binding, succession, succession flow, invariant,
  boolean expression, and full modifier support
- **Behavioral constructs**: actions, states, transitions, control flow (if/while/for
  with body and ref forms), terminate, inline transitions, send/accept/after
- **Relationships**: specialization (`:>` / `specializes`), redefinition (`:>>` /
  `redefines`), binding (`::>`), conjugation, chaining, crosses (`=>`),
  `typed by` / `defined by`, `unions` / `intersects` / `differences`,
  `featuring by`
- **Connections**: named binding/succession usages, multi-end connections,
  end features with multiplicity and item/ref qualifiers
- **Expressions**: arithmetic, logical, comparison, invocation, conditional,
  `new` with qualified names, result expressions (trailing expr without `;`)
- **Requirements**: `assert`/`not satisfy`, `require constraint`, subject/actor/
  objective/stakeholder/frame declarations
- **Views**: render with rendering keyword and typing, expose, viewpoint frames
- **Textual representation**: `rep`/`language` blocks for embedding foreign code
- **Multiplicity**, metadata annotations, imports (with recursive `**`), packages
  (with short names and empty declarations), dependencies (comma-separated targets)
- **195 corpus tests** + **12 official OMG example files** from the
  [SysML-v2-Release](https://github.com/Systems-Modeling/SysML-v2-Release)
  repository, all parsing cleanly

## Editor support

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
