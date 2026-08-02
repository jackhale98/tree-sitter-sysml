; highlights.scm — Tree-sitter highlight queries for SysML v2

; Comments
(line_comment) @comment
(block_comment) @comment
(doc_comment) @comment.documentation

; Strings
(string_literal) @string

; Numbers
(number_literal) @number

; Boolean and null literals
(boolean_literal) @constant.builtin
(null_literal) @constant.builtin

; Definition names
(definition name: (identifier) @type.definition)
(state_definition name: (identifier) @type.definition)
(enumeration_definition name: (identifier) @type.definition)
(generic_definition name: (identifier) @type.definition)

; Namespace names
(namespace_declaration name: (identifier) @module)

; Package names
(package_declaration name: (identifier) @module)

; Usage names
(usage name: (identifier) @variable)
(action_usage name: (identifier) @variable)
(state_usage name: (identifier) @variable)
(connection_usage name: (identifier) @variable)
(constraint_usage name: (identifier) @variable)
(requirement_usage name: (identifier) @variable)
(metadata_usage name: (identifier) @variable)
(binding_usage name: (identifier) @variable)
(succession_usage name: (identifier) @variable)
(succession_flow_usage name: (identifier) @variable)
(constraint_expression_usage name: (identifier) @variable)


; Type references
(typed_by type: (qualified_name) @type)
(specialization target: (qualified_name) @type)

; Operators
["~" "::" "==" "!=" "===" "!==" "<=" ">=" "+" "-" "*" "/" "%" "**" "=" ":=" "=>" "->" "&" ".." ".?" "??" "^" "|" "$"] @operator
["not" "or" "and" "xor" "implies" "hastype" "istype" "as"] @keyword.operator

; Metadata
"@" @attribute

; Visibility
["public" "private" "protected"] @keyword.modifier

; Modifiers
["abstract" "variation" "variant" "individual" "readonly"
 "derived" "nonunique" "ordered" "in" "out" "inout" "return"
 "composite" "conjugate" "const" "constant" "disjoint" "portion" "var"
 "ref" "parallel"] @keyword.modifier

; Structural keywords
["package" "import" "alias" "comment" "doc" "about" "filter"
 "language" "rep" "locale" "new"] @keyword

; Definition keyword
"def" @keyword

; Usage and definition type keywords
["part" "action" "state" "port" "connection" "attribute" "item"
 "requirement" "constraint" "view" "viewpoint" "rendering" "concern"
 "allocation" "interface" "occurrence" "metadata" "calc"
 "ref" "exhibit" "perform" "include"
 "enum" "enumeration" "flow" "binding" "succession"
 "inv" "invariant" "bool" "boolean"
 ; KerML
 "assoc" "behavior" "class" "connector"
 "datatype" "feature" "function" "interaction"
 "namespace" "predicate" "struct" "type"
 "classifier" "metaclass" "expr" "step"
 ] @keyword

; Behavioral keywords
["entry" "first" "then" "accept" "after"
 "for" "transition" "terminate"
 "if" "else" "while" "do" "assign" "send"
 "merge" "decide" "fork" "join" "exit"
] @keyword

; Relationship keywords
["satisfy" "require" "subject" "objective"
 "actor" "connect" "to"
 "end" "all" "default" "by"
 "use" "case" "analysis" "verification"
 "snapshot" "timeslice"
 "render" "expose" "stakeholder" "frame"
 "event" "return" "redefines" "subsets" "via"
 "conjugates" "references" "chains" "inverse"
 "library" "standard" "loop" "until"
 "specializes" "typed" "defined" "crosses" "unions" "intersects"
 "differences" "featuring" "featured" "bind"
 "dependency" "from" "allocate" "message"
 "assert" "not" "when" "at"
 "specialization" "conjugation" "disjoining" "inverting"
 "subtype" "subclassifier" "subset" "redefinition" "typing"
 "conjugate"] @keyword

; Punctuation
["{" "}"] @punctuation.bracket
["(" ")"] @punctuation.bracket
["[" "]"] @punctuation.bracket
[";" "."] @punctuation.delimiter
