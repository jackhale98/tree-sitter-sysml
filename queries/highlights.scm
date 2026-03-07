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

; Definition names — SysML v2
(part_definition name: (identifier) @type.definition)
(action_definition name: (identifier) @type.definition)
(state_definition name: (identifier) @type.definition)
(port_definition name: (identifier) @type.definition)
(connection_definition name: (identifier) @type.definition)
(flow_definition name: (identifier) @type.definition)
(attribute_definition name: (identifier) @type.definition)
(item_definition name: (identifier) @type.definition)
(requirement_definition name: (identifier) @type.definition)
(constraint_definition name: (identifier) @type.definition)
(view_definition name: (identifier) @type.definition)
(viewpoint_definition name: (identifier) @type.definition)
(rendering_definition name: (identifier) @type.definition)
(concern_definition name: (identifier) @type.definition)
(use_case_definition name: (identifier) @type.definition)
(analysis_case_definition name: (identifier) @type.definition)
(verification_case_definition name: (identifier) @type.definition)
(allocation_definition name: (identifier) @type.definition)
(interface_definition name: (identifier) @type.definition)
(enumeration_definition name: (identifier) @type.definition)
(individual_definition name: (identifier) @type.definition)
(occurrence_definition name: (identifier) @type.definition)
(metadata_definition name: (identifier) @type.definition)
(calc_definition name: (identifier) @type.definition)

; Definition names — KerML
(case_definition name: (identifier) @type.definition)
(class_definition name: (identifier) @type.definition)
(struct_definition name: (identifier) @type.definition)
(assoc_definition name: (identifier) @type.definition)
(behavior_definition name: (identifier) @type.definition)
(datatype_definition name: (identifier) @type.definition)
(feature_definition name: (identifier) @type.definition)
(function_definition name: (identifier) @type.definition)
(predicate_definition name: (identifier) @type.definition)
(connector_definition name: (identifier) @type.definition)
(interaction_definition name: (identifier) @type.definition)
(type_definition name: (identifier) @type.definition)
(namespace_definition name: (identifier) @type.definition)
(classifier_definition name: (identifier) @type.definition)
(metaclass_definition name: (identifier) @type.definition)
(expr_definition name: (identifier) @type.definition)
(step_definition name: (identifier) @type.definition)

; Package names
(package_declaration name: (identifier) @module)

; Usage names
(part_usage name: (identifier) @variable)
(attribute_usage name: (identifier) @variable)
(port_usage name: (identifier) @variable)
(action_usage name: (identifier) @variable)
(state_usage name: (identifier) @variable)
(item_usage name: (identifier) @variable)
(connection_usage name: (identifier) @variable)
(constraint_usage name: (identifier) @variable)
(requirement_usage name: (identifier) @variable)
(snapshot_usage name: (identifier) @variable)
(timeslice_usage name: (identifier) @variable)
(calc_usage name: (identifier) @variable)
(view_usage name: (identifier) @variable)
(viewpoint_usage name: (identifier) @variable)
(rendering_usage name: (identifier) @variable)
(concern_usage name: (identifier) @variable)
(use_case_usage name: (identifier) @variable)
(analysis_usage name: (identifier) @variable)
(verification_usage name: (identifier) @variable)
(metadata_usage name: (identifier) @variable)
(classifier_usage name: (identifier) @variable)
(metaclass_usage name: (identifier) @variable)
(expr_usage name: (identifier) @variable)
(step_usage name: (identifier) @variable)


; Type references
(typed_by type: (qualified_name) @type)
(specialization target: (qualified_name) @type)

; Operators
["~" "::" "==" "!=" "<=" ">=" "+" "-" "*" "/" "%" "**" "=" ":="] @operator
["not" "or" "and" "xor" "implies" "hastype" "istype" "as"] @keyword.operator

; Metadata
"@" @attribute

; Visibility
["public" "private" "protected"] @keyword.modifier

; Modifiers
["abstract" "variation" "variant" "individual" "readonly"
 "derived" "nonunique" "ordered" "in" "out" "inout" "return"
 "composite" "conjugate" "const" "disjoint" "portion" "var"] @keyword.modifier

; Structural keywords
["package" "import" "alias" "comment" "doc" "about" "filter"] @keyword

; Definition keyword
"def" @keyword

; Usage and definition type keywords
["part" "action" "state" "port" "connection" "attribute" "item"
 "requirement" "constraint" "view" "viewpoint" "rendering" "concern"
 "allocation" "interface" "occurrence" "metadata" "calc"
 "ref" "exhibit" "perform" "include"
 "enum" "enumeration" "flow"
 ; KerML
 "assoc" "behavior" "class" "connector"
 "datatype" "feature" "function" "interaction"
 "namespace" "predicate" "struct" "type"
 "classifier" "metaclass" "expr" "step"
 ] @keyword

; Behavioral keywords
["entry" "first" "then" "accept"
 "for" "transition"
 "if" "else" "while" "do" "assign" "send"
 "merge" "decide" "fork" "join"
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
 "library" "standard" "loop" "until"] @keyword

; Punctuation
["{" "}"] @punctuation.bracket
["(" ")"] @punctuation.bracket
["[" "]"] @punctuation.bracket
[";" "."] @punctuation.delimiter
