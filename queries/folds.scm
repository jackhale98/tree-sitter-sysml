; folds.scm — Tree-sitter fold queries for SysML v2

; Fold body blocks
[
  (package_body)
  (definition_body)
  (enumeration_body)
  (state_body)
  (requirement_body)
  (constraint_body)
] @fold

; Fold multi-line comments
(block_comment) @fold
(doc_comment) @fold
