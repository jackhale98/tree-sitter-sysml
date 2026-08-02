;; SysML v2 / KerML ctags-style tag queries for tree-sitter.
;;
;; Used by Neovim, Emacs (via treesit-tags), and other editors to
;; populate go-to-definition indexes and outline views.
;;
;; The grammar uses a unified `definition' node for all `<kw> def'
;; forms; only state/enum/generic definitions and packages have their
;; own node types.
;;
;; Capture conventions:
;;   @definition.X   declares a tag with kind X
;;   @reference.X    references a previously declared tag

(definition               name: (identifier) @name) @definition.class
(state_definition         name: (identifier) @name) @definition.class
(enumeration_definition   name: (identifier) @name) @definition.enum
(generic_definition       name: (identifier) @name) @definition.class
(package_declaration      name: (identifier) @name) @definition.module
(namespace_declaration    name: (identifier) @name) @definition.module

;; ── References ────────────────────────────────────────────────────
(typed_by       type:   (qualified_name) @name) @reference.type
(specialization target: (qualified_name) @name) @reference.type
