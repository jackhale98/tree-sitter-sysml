;; SysML v2 / KerML local scope queries for tree-sitter.
;;
;; @local.scope     introduces a new lexical scope
;; @local.definition.X  binds an identifier in the enclosing scope
;; @local.reference     references an identifier resolved by scope rules
;;
;; The grammar uses a unified `definition' node for all `<kw> def'
;; forms and a unified `usage' node for keyword-only usages.

;; ── Scopes ─────────────────────────────────────────────────────────
(package_declaration)         @local.scope
(package_body)                @local.scope
(definition_body)             @local.scope
(state_body)                  @local.scope
(requirement_body)            @local.scope
(constraint_body)             @local.scope
(enumeration_body)            @local.scope

;; ── Definitions bind a type-level symbol ───────────────────────────
(definition             name: (identifier) @local.definition.type)
(state_definition       name: (identifier) @local.definition.type)
(enumeration_definition name: (identifier) @local.definition.type)
(generic_definition     name: (identifier) @local.definition.type)

;; ── Usages bind a value-level symbol ──────────────────────────────
(usage               name: (identifier) @local.definition.var)
(action_usage        name: (identifier) @local.definition.var)
(state_usage         name: (identifier) @local.definition.var)
(connection_usage    name: (identifier) @local.definition.var)
(interface_usage     name: (identifier) @local.definition.var)
(requirement_usage   name: (identifier) @local.definition.var)
(constraint_usage    name: (identifier) @local.definition.var)
(allocation_usage    name: (identifier) @local.definition.var)
(flow_usage          name: (identifier) @local.definition.var)
(feature_usage       name: (identifier) @local.definition.var)

;; ── References ────────────────────────────────────────────────────
(qualified_name) @local.reference
