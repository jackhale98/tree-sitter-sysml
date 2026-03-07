# tree-sitter-sysml

Tree-sitter grammar for **SysML v2** and **KerML** textual notation per the
OMG SysML v2.0 and KerML 1.0 specifications.

## Features

- 41 definition types (SysML v2 + KerML)
- 28+ usage types with full modifier support
- Behavioral constructs: actions, states, transitions, control flow
- Relationships: specialization, redefinition, binding, conjugation, chaining
- Expressions: arithmetic, logical, comparison, invocation, conditional
- Multiplicity, metadata annotations, imports, packages
- 195 corpus tests, parses official Annex A example cleanly

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
