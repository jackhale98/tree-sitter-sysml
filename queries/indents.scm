; indents.scm — Tree-sitter indent queries for SysML v2

; Indent inside body blocks
[
  (package_body)
  (definition_body)
  (enumeration_body)
  (state_body)
  (requirement_body)
  (constraint_body)
] @indent

; Dedent closing braces
"}" @dedent
"]" @dedent
")" @dedent
