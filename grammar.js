/// <reference types="tree-sitter-cli/dsl" />
// grammar.js — Tree-sitter grammar for SysML v2 / KerML textual notation
//
// Architecture: A single `_declaration` wrapper handles the shared
// repeat($._prefix_metadata) + repeat($._modifier) prefix for ALL definitions
// and usages. This prevents LR state explosion from 50+ rules sharing the
// same prefix. Each specific definition/usage rule starts at its unique keyword.

module.exports = grammar({
  name: "sysml",

  extras: ($) => [/\s/, $.line_comment, $.block_comment],

  word: ($) => $._word,

  conflicts: ($) => [
    [$.satisfy_statement],
    [$._def_keyword, $.metadata_usage],
    [$.metadata_usage],
    [$._def_keyword, $.modifier],
    [$._usage_keyword, $.message_statement],
    [$.constraint_expression_usage, $._kerml_keyword],
    [$.disjoining_statement, $.modifier],
    [$._declaration, $.namespace_declaration, $.constraint_usage, $.feature_usage, $._statement, $.connect_statement],
    [$._expression, $.feature_chain],
    [$._expression, $.qualified_name],
    [$._expression, $.qualified_name, $.feature_chain],
    [$.metadata_usage, $.qualified_name],
    [$.flow_usage, $.flow_statement],
    [$.flow_usage],
    [$.end_feature],
    [$.succession_usage, $.succession_statement],
    [$._feature_ref, $.feature_chain],
    [$.kerml_usage],
    [$._feature_qualifier, $.modifier],
    [$.constraint_usage],
    [$._declaration, $.constraint_usage, $.feature_usage, $._statement, $.connect_statement],
    [$.redefinition_statement, $._expression, $.qualified_name],
    [$.requirement_usage],
    [$.state_body, $._body_element],
    [$.state_usage],
    [$.feature_usage, $.redefinition_statement, $._expression, $.qualified_name],
    [$.feature_usage, $._expression, $.qualified_name],
    [$.connection_usage],
    [$.event_usage],
    [$.if_action],
    [$.feature_usage],
    [$.interface_statement, $._feature_ref],
    [$.accept_clause, $.accept_action],
    [$.entry_action],
    [$._body, $.entry_action],
    [$.multiplicity],
    [$.constraint_usage, $.require_statement],
    [$.do_action],
    [$.exit_action],
    [$.assert_statement],
    [$.standalone_redefines, $.keyword_type_relationship],
    [$._feature_ref, $._expression],
    [$.metadata_annotation],
    [$.metadata_annotation, $.metadata_annotation_list],
    [$.definition_body, $.constraint_body],
    [$.standalone_redefines],
    [$.redefinition_statement, $.redefinition],
    [$.redefinition_statement, $.specialization],
    [$.definition_body, $.metadata_body],
  ],

  rules: {
    source_file: ($) => repeat($._element),

    _element: ($) =>
      choice(
        $.package_declaration,
        $.namespace_declaration,
        $._declaration,
        $.feature_usage,
        $.import_statement,
        $.alias_declaration,
        $.comment_element,
        $.doc_comment,
        $.satisfy_statement,
        $.filter_statement,
        $.metadata_annotation,
        $.assignment_statement,
        $.textual_representation,
        $.connect_statement,
        $.assert_statement,
        $.expression_statement,
        $.multiplicity_definition,
        $._statement,
      ),

    // =================================================================
    // Declaration wrapper — the key optimization.
    // ONE rule handles the modifier prefix, then dispatches to the
    // specific definition or usage type based on the keyword.
    // =================================================================

    _declaration: ($) =>
      seq(
        repeat(choice($._prefix_metadata, $._modifier)),
        choice($._definition_type, $._usage_type),
      ),

    // --- Package ---

    package_declaration: ($) =>
      seq(
        optional($.visibility),
        optional(choice(seq("standard", "library"), "library")),
        "package",
        optional($.short_name),
        field("name", $.identifier),
        choice($.package_body, ";"),
      ),

    package_body: ($) => seq("{", repeat($._element), "}"),

    // --- Namespace (KerML bare namespace without def) ---

    namespace_declaration: ($) =>
      seq(
        repeat($._prefix_metadata),
        "namespace",
        optional($.short_name),
        optional(field("name", $.identifier)),
        choice($.package_body, ";"),
      ),

    // --- Import ---

    import_statement: ($) =>
      seq(
        optional($.visibility),
        "import",
        optional("all"),
        $.qualified_name,
        optional(token(seq("::", "*"))),
        optional(token(seq("::", "**"))),
        optional($.import_filter),
        choice($._body, ";"),
      ),

    import_filter: ($) =>
      repeat1(seq("[",
          optional("not"),
          $.filter_expression,
          repeat(seq(choice("and", "or"), optional("not"), $.filter_expression)),
          "]")),

    // --- Alias ---

    alias_declaration: ($) =>
      seq(
        optional($.visibility),
        "alias",
        optional($.short_name),
        field("name", $.identifier),
        "for",
        $.qualified_name,
        choice($._body, ";"),
      ),

    // --- Comments ---

    comment_element: ($) =>
      choice(
        seq(
          "comment",
          optional($.short_name),
          optional(field("name", $.identifier)),
          optional(seq("about", commaSep1($.qualified_name))),
          optional(seq("locale", $.string_literal)),
          $.block_comment,
        ),
        seq(
          "locale", $.string_literal,
          $.block_comment,
        ),
      ),

    doc_comment: ($) =>
      seq("doc",
          optional($.short_name),
          optional(field("name", $.identifier)),
          optional(seq("locale", $.string_literal)),
          $.block_comment),

    // --- Textual Representation ---

    textual_representation: ($) =>
      choice(
        seq("rep", optional(field("name", $.identifier)),
            optional($._type_relationships),
            "language", $.string_literal,
            $.block_comment),
        seq("language", $.string_literal,
            $.block_comment),
      ),

    // --- Assert (standalone, without constraint keyword) ---

    assert_statement: ($) =>
      seq(
        "assert",
        optional("not"),
        $._feature_ref,
        optional($.constraint_body),
        optional(";"),
      ),

    // --- Satisfy ---

    satisfy_statement: ($) =>
      seq(
        optional("assert"),
        optional("not"),
        "satisfy",
        optional("requirement"),
        optional($._feature_ref),
        optional($._type_relationships),
        optional(seq("by", $._feature_ref)),
        optional($.requirement_body),
        optional(";"),
      ),

    // =================================================================
    // Definitions — no prefix (provided by _declaration wrapper)
    // =================================================================

    // =================================================================
    // Definitions — unified rule with keyword dispatch
    // All definitions follow: KEYWORD "def" [short_name] [name] [type_rels] BODY
    // =================================================================

    _definition_type: ($) =>
      choice(
        $.definition,
        $.state_definition,
        $.enumeration_definition,
        $.generic_definition,
      ),

    state_definition: ($) =>
      seq(
        "state", "def",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice($.state_body, ";"),
      ),

    definition: ($) =>
      seq(
        $._def_keyword,
        "def",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    _def_keyword: ($) =>
      choice(
        "part", "action", "port", "attribute", "item",
        "requirement", "constraint", "view", "viewpoint", "rendering",
        "concern", "allocation", "interface", "occurrence", "metadata",
        "calc", "case", "class", "struct", "behavior", "datatype",
        "feature", "function", "predicate", "connector", "interaction",
        "type", "namespace", "classifier", "metaclass", "expr", "step",
        seq("flow", optional("connection")),
        seq(optional("flow"), "connection"),
        seq("use", "case"),
        seq("analysis", optional("case")),
        seq("verification", optional("case")),
        "individual",
        seq("assoc", optional("struct")),
      ),

    enumeration_definition: ($) =>
      prec(1, seq(
        choice("enum", "enumeration"), "def",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice($.enumeration_body, ";"),
      )),

    // prec.dynamic(-2): a bare `def` is a last resort. Without the
    // penalty, GLR sometimes split `metadata def X { ... }` into
    // `metadata_usage` + `generic_definition` (the keyword also starts
    // metadata_usage), losing the definition.
    generic_definition: ($) =>
      prec(-1, prec.dynamic(-2, seq(
        "def",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ))),

    // --- Definition body ---

    definition_body: ($) =>
      seq("{", repeat($._body_element), optional($.result_expression), "}"),

    result_expression: ($) =>
      prec(-1, $._expression),

    enumeration_body: ($) =>
      seq("{", repeat(choice($.enum_member, $._body_element)), "}"),

    enum_member: ($) =>
      prec(1, seq(
        optional("enum"),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.value_assignment),
        choice(";", $._body),
      )),

    // =================================================================
    // Usages — no prefix (provided by _declaration wrapper)
    // =================================================================

    _usage_type: ($) =>
      choice(
        // Unified usage rule — covers 20 keyword-only variants
        $.usage,
        // Special usages with unique structure
        $.action_usage,
        $.state_usage,
        $.connection_usage,
        $.interface_usage,
        $.constraint_usage,
        $.requirement_usage,
        $.event_usage,
        $.allocation_usage,
        $.flow_usage,
        $.metadata_usage,
        // KerML expression types
        $.constraint_expression_usage,
        // Connection-related usages
        $.binding_usage,
        $.succession_usage,
        $.succession_flow_usage,
        // Behavioral (unique keywords, no modifier prefix needed)
        $.succession_statement,
        $.perform_statement,
        $.exhibit_statement,
        $.include_statement,
        $.transition_statement,
        $.end_feature,
        $.then_succession,
        // Control flow
        $.if_action,
        $.while_action,
        $.for_action,
        $.assign_action,
        $.send_action,
        $.loop_action,
        $.control_node,
        $.else_action,
        $.accept_action,
        // KerML bare keyword usages (without "def")
        $.kerml_usage,
        // KerML standalone relationship statements
        $.specialization_statement,
        $.conjugation_statement,
        $.featuring_statement,
        $.disjoining_statement,
        $.inverse_statement,
      ),

    // =================================================================
    // Usages — unified rule with keyword dispatch
    // All these usages follow: KEYWORD [short_name] [name] [mult] [type_rels] [mult] [type_rels] [value] [metadata] BODY
    // =================================================================

    usage: ($) =>
      seq(
        $._usage_keyword,
        optional($.short_name),
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional($.value_assignment),
        optional($.metadata_annotation_list),
        choice($._body, ";"),
      ),

    _usage_keyword: ($) =>
      choice(
        "part", "attribute", "port", "item", "occurrence",
        "calc", "view", "viewpoint", "rendering", "concern",
        "analysis", "verification", "enum",
        "message", "case",
        "classifier", "metaclass", "expr", "step",
        seq("use", "case"),
        seq("snapshot", optional(choice("item", "part"))),
        seq("timeslice", optional(choice("item", "part"))),
      ),

    action_usage: ($) =>
      seq(
        "action",
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional($.value_assignment),
        optional(choice(
          seq("send", optional($._expression),
              optional(seq("via", $._feature_ref)),
              optional(seq("to", $._feature_ref))),
          seq("accept", choice(
            seq("when", $._expression),
            seq("at", $._expression),
            seq("after", $._expression),
            seq(field("accept_name", $.identifier),
                optional($._type_relationships),
                optional(seq("after", $._expression)),
                optional(seq("via", $._feature_ref))),
          )),
          "terminate",
          seq("for", $.identifier, optional(seq(":", $._feature_ref)),
              "in", $._expression, optional(seq("..", $._expression))),
        )),
        choice($._body, ";"),
      ),

    state_usage: ($) =>
      seq(
        "state",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
        optional("parallel"),
        choice($.state_body, ";"),
      ),

    connection_usage: ($) =>
      seq(
        optional("flow"),
        "connection",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.connect_clause),
        choice($._body, ";"),
      ),

    interface_usage: ($) =>
      seq(
        "interface",
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional(choice(
          $.connect_clause,
          seq($._feature_ref, "to", $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    constraint_usage: ($) =>
      seq(
        optional(choice("require", "assert", "assume")),
        repeat($._prefix_metadata),
        "constraint",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
        choice($.constraint_body, ";"),
      ),

    requirement_usage: ($) =>
      seq(
        "requirement",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.value_assignment),
        optional(seq("by", $._feature_ref)),
        choice($.requirement_body, ";"),
      ),

    event_usage: ($) =>
      seq(
        "event",
        optional("occurrence"),
        optional($._feature_ref),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    allocation_usage: ($) =>
      seq(
        "allocation",
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional($.allocate_clause),
        choice($._body, ";"),
      ),

    flow_usage: ($) =>
      seq(
        "flow",
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional(seq("of", $._feature_ref, optional($.multiplicity))),
        optional(choice(
          seq("from", optional($.multiplicity), $._feature_ref, "to", optional($.multiplicity), $._feature_ref),
          seq(optional($.multiplicity), $._feature_ref, "to", optional($.multiplicity), $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    metadata_usage: ($) =>
      seq(
        "metadata",
        optional(prec.dynamic(1, field("name", $.identifier))),
        optional($._feature_ref),
        optional($._type_relationships),
        optional(seq("about", commaSep1($._feature_ref))),
        optional($.multiplicity),
        optional($.metadata_body),
        optional(";"),
      ),

    constraint_expression_usage: ($) =>
      seq(
        choice("inv", "invariant", "bool", "boolean"),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice($.constraint_body, ";"),
      ),

    end_feature: ($) =>
      seq(
        "end",
        repeat($._prefix_metadata),
        optional(field("end_name", $.identifier)),
        optional($.multiplicity),
        optional(choice("ref", "item", "port", "part", "attribute", "feature", "occurrence", "action", "connection", "flow")),
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    // Implicit feature usage (modifier-driven, no keyword — stays outside _declaration)
    feature_usage: ($) =>
      choice(
        // With at least one modifier or metadata prefix
        seq(
          repeat1(choice($._prefix_metadata, $._modifier)),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.multiplicity),
          repeat($._feature_qualifier),
          optional($._type_relationships),
          optional($.value_assignment),
          choice($._body, ";"),
        ),
        // Without prefix: name and type are required
        seq(
          field("name", $.identifier),
          $._type_relationship,
          optional($._type_relationships),
          optional($.multiplicity),
          repeat($._feature_qualifier),
          optional($._type_relationships),
          optional($.value_assignment),
          choice($._body, ";"),
        ),
      ),

    // --- Connection-related usages ---

    binding_usage: ($) =>
      seq(
        "binding",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional(choice(
          seq("bind", optional($.multiplicity), $._feature_ref, "=", optional($.multiplicity), $._feature_ref),
          seq("of", optional($.multiplicity), $._feature_ref, "=", optional($.multiplicity), $._feature_ref),
          seq(optional($.multiplicity), $._feature_ref, "=", optional($.multiplicity), $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    succession_usage: ($) =>
      seq(
        "succession",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional(choice(
          seq("first", optional($.multiplicity), $._feature_ref, "then", optional($.multiplicity), $._feature_ref),
          seq(optional($.multiplicity), $._feature_ref, "then", optional($.multiplicity), $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    succession_flow_usage: ($) =>
      seq(
        "succession", "flow",
        optional(field("name", $.identifier)),
        optional(seq("of", $._feature_ref, optional($.multiplicity))),
        optional(choice(
          seq("from", optional($.multiplicity), $._feature_ref, "to", optional($.multiplicity), $._feature_ref),
          seq(optional($.multiplicity), $._feature_ref, "to", optional($.multiplicity), $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    // --- Behavioral ---

    then_succession: ($) =>
      prec.right(seq(
        "then",
        optional($.visibility),
        optional(choice("action", "state", "fork", "join", "merge", "decide", seq("event", "occurrence"), "event", "terminate", "message", "timeslice", seq("snapshot", optional(choice("part", "item"))), seq("use", "case"), "verification", "analysis")),
        optional($._feature_ref),
        repeat(choice($.multiplicity, $._type_relationship)),
        optional($.value_assignment),
        choice(
          seq("send", optional($._expression),
              optional(seq("via", $._feature_ref)),
              optional(seq("to", $._feature_ref)),
              choice($._body, ";")),
          seq($.accept_clause, choice($._body, ";")),
          seq("while", $._expression, $._body, optional(seq("until", $._expression, ";"))),
          seq("if", $._expression, $._body, optional(seq("else", choice($._body, $.if_action)))),
          seq("assign", $._feature_ref, ":=", $._expression, ";"),
          seq("include", optional(repeat1(choice("use", "case", "action", "state"))), $._feature_ref,
              optional($._type_relationships), choice($._body, ";")),
          seq("perform", optional("action"), optional($._feature_ref),
              optional($._type_relationships), optional($.multiplicity),
              choice($._body, ";")),
          seq("terminate", optional($._feature_ref), ";"),
          seq("of", $._feature_ref, repeat(choice($.multiplicity, $._type_relationship)),
              optional($.value_assignment),
              optional(seq("from", $._feature_ref, "to", $._feature_ref)), choice($._body, ";")),
          $._body,
          ";",
        ),
      )),

    succession_statement: ($) =>
      choice(
        seq("first", $._feature_ref,
            optional(seq("if", $._expression)),
            "then", $._feature_ref, ";"),
        seq("first", $._feature_ref, ";"),
        seq("succession", optional(field("name", $.identifier)),
            optional($._type_relationships),
            optional(choice(
              seq("first", $._feature_ref,
                  optional(seq("if", $._expression)),
                  "then", $._feature_ref),
              seq($._feature_ref, "then", $._feature_ref),
            )),
            choice($._body, ";")),
      ),

    perform_statement: ($) =>
      seq(
        "perform",
        optional("action"),
        optional($._feature_ref),
        optional($.multiplicity),
        optional($._type_relationships),
        choice($._body, ";"),
      ),

    exhibit_statement: ($) =>
      seq(
        "exhibit",
        optional("state"),
        optional($._feature_ref),
        optional($._type_relationships),
        optional("parallel"),
        choice($.state_body, ";"),
      ),

    include_statement: ($) =>
      seq(
        "include",
        optional(repeat1(choice("use", "case", "action", "state"))),
        optional($._feature_ref),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    transition_statement: ($) =>
      seq(
        "transition",
        optional(field("name", $.identifier)),
        optional(seq("first", $._feature_ref)),
        optional($.accept_clause),
        optional(seq("if", $._expression)),
        optional(seq("do", choice(
          seq(optional("action"), "send", $._expression,
              optional(seq(choice("to", "via"), $._feature_ref))),
          seq("action", $._feature_ref, optional($._type_relationships)),
          $._feature_ref,
        ))),
        seq("then", $._feature_ref),
        ";",
      ),

    terminate_statement: ($) =>
      seq("terminate", optional($._feature_ref), ";"),

    // Inline transition in state bodies: accept ... [do ...] then ...;
    inline_transition: ($) =>
      seq(
        $.accept_clause,
        optional(seq("if", $._expression)),
        optional(seq("do", choice(
          seq(optional("action"), "send", $._expression,
              optional(seq(choice("to", "via"), $._feature_ref))),
          seq("action", optional($._feature_ref), optional($._type_relationships), $._body),
          seq("action", $._feature_ref, optional($._type_relationships)),
          $._feature_ref,
        ))),
        "then", $._feature_ref, ";",
      ),

    accept_clause: ($) =>
      seq(
        "accept",
        choice(
          seq("when", $._expression),
          seq("at", $._expression),
          seq("after", $._expression),
          seq(
            $._feature_ref,
            optional($._type_relationships),
            optional(seq("after", $._expression)),
            optional(seq("via", $._feature_ref)),
          ),
        ),
      ),

    do_clause: ($) =>
      seq("do", choice(
        seq(optional("action"), "send", $._expression,
            optional(seq(choice("to", "via"), $._feature_ref))),
        seq("action", $._feature_ref, optional($._type_relationships), choice(";", $._body)),
        seq($._feature_ref, choice(";", $._body)),
        $._body,
      )),

    send_action: ($) =>
      seq("send", optional($._expression),
          optional(seq("via", $._feature_ref)),
          optional(seq("to", $._feature_ref)),
          ";"),

    accept_action: ($) =>
      seq(
        "accept",
        choice(
          seq("when", $._expression),
          seq("at", $._expression),
          seq(
            $._feature_ref,
            optional($._type_relationships),
            optional(seq("after", $._expression)),
            optional(seq("via", $._feature_ref)),
          ),
        ),
        choice(
          seq("then", $._feature_ref, ";"),
          ";",
        ),
      ),

    if_action: ($) =>
      choice(
        seq("if", $._expression,
            "then", $._feature_ref,
            optional(seq("else", choice($._feature_ref, $.if_action))),
            ";"),
        seq("if", $._expression, $._body,
            optional(seq("else", choice($._body, $.if_action)))),
      ),

    else_action: ($) =>
      seq("else", $._feature_ref, ";"),

    while_action: ($) =>
      choice(
        seq("while", $._expression, "do", $._feature_ref, ";"),
        seq("while", $._expression, $._body, optional(seq("until", $._expression, ";"))),
      ),

    for_action: ($) =>
      choice(
        seq("for", $.identifier, optional(seq(":", $._feature_ref)), "in", $._expression,
            optional(seq("..", $._expression)),
            "do", $._feature_ref, ";"),
        seq("for", $.identifier, optional(seq(":", $._feature_ref)), "in", $._expression,
            optional(seq("..", $._expression)),
            $._body),
      ),

    assign_action: ($) =>
      seq(
        "assign", $._feature_ref,
        ":=", $._expression,
        choice($._body, ";"),
      ),

    loop_action: ($) =>
      seq(
        "loop",
        optional("action"),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice(
          seq($._body, optional(seq("until", $._expression, ";"))),
          seq("until", $._expression, $._body),
          seq("until", $._expression, ";"),
          ";",
        ),
      ),

    control_node: ($) =>
      seq(choice("merge", "decide", "fork", "join"), optional(field("name", $.identifier)), choice($._body, ";")),

    // --- Statements ---

    _statement: ($) =>
      seq(
        repeat($._prefix_metadata),
        choice(
          $.dependency_statement,
          $.allocate_statement,
          $.message_statement,
          $.flow_statement,
        ),
      ),

    dependency_statement: ($) =>
      seq("dependency", optional(field("name", $.identifier)),
          optional(seq("from", commaSep1($._feature_ref))),
          "to", commaSep1($._feature_ref), choice($._body, ";")),

    allocate_statement: ($) =>
      seq("allocate", $._feature_ref, "to", $._feature_ref,
          choice($._body, ";")),

    message_statement: ($) =>
      seq(
        "message",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional(seq("of", $._feature_ref, repeat(choice($.multiplicity, $._type_relationship)))),
        optional($.value_assignment),
        optional(seq("from", $._feature_ref, "to", $._feature_ref)),
        choice($._body, ";"),
      ),

    flow_statement: ($) =>
      seq(
        "flow",
        optional(field("name", $.identifier)),
        optional(seq("of", $._feature_ref)),
        optional(choice(
          seq("from", $._feature_ref, "to", $._feature_ref),
          seq($._feature_ref, "to", $._feature_ref),
        )),
        ";",
      ),

    allocate_clause: ($) =>
      choice(
        seq("allocate", $._feature_ref, "to", $._feature_ref),
        seq("allocate", "(", commaSep1(seq(
          $.identifier, token(seq("::", ">")), $._feature_ref,
        )), ")"),
      ),

    // --- Body variants ---

    _body: ($) => $.definition_body,

    state_body: ($) =>
      seq(
        "{",
        repeat(choice(
          $._body_element,
          $.entry_action,
          $.do_action,
          $.exit_action,
        )),
        "}",
      ),

    entry_action: ($) =>
      seq("entry", optional("action"), choice(
        seq(";", optional(seq("then", $._feature_ref, ";"))),
        $.definition_body,
        seq("assign", $._feature_ref, ":=", $._expression, ";"),
        seq("send", $._expression,
            optional(seq("via", $._feature_ref)),
            optional(seq("to", $._feature_ref)),
            ";"),
        // Named entry with type (e.g. `entry action entryAction :>> 'entry';`)
        seq(optional(field("name", $.identifier)), optional($._type_relationships), optional($.multiplicity), optional($._type_relationships), choice(";", $._body)),
        seq($._feature_ref, choice(
          seq(";", optional(seq("then", $._feature_ref, ";"))),
          $.definition_body,
        )),
      )),

    do_action: ($) =>
      seq("do", optional("action"), choice(
        seq("send", $._expression, choice("to", "via"), $._feature_ref, ";"),
        seq("assign", $._feature_ref, ":=", $._expression, ";"),
        // Named do with type (e.g. `do action doAction: Action :>> 'do';`)
        seq(optional(field("name", $.identifier)), optional($._type_relationships), optional($.multiplicity), optional($._type_relationships), choice(";", $._body)),
        seq($._feature_ref, choice(";", $._body)),
        $._body,
      )),

    exit_action: ($) =>
      seq("exit", optional("action"), choice(
        seq(optional(field("name", $.identifier)), optional($._type_relationships), optional($.multiplicity), optional($._type_relationships), choice(";", $._body)),
        $._body,
        ";",
      )),

    requirement_body: ($) =>
      seq("{", repeat($._body_element), "}"),

    constraint_body: ($) =>
      seq("{", repeat(choice($._body_element, $._expression)), "}"),

    // --- Body elements ---

    _body_element: ($) =>
      choice(
        $.package_declaration,
        $._declaration,
        $.feature_usage,
        $.import_statement,
        $.alias_declaration,
        $.comment_element,
        $.doc_comment,
        $.satisfy_statement,
        $.assert_statement,
        $.subject_declaration,
        $.actor_declaration,
        $.objective_declaration,
        $.filter_statement,
        $.metadata_annotation,
        $.bind_statement,
        $.verify_statement,
        $.connect_statement,
        $.interface_statement,
        // Via $._statement so prefix metadata (`#tag allocate ...`) works
        // inside bodies, not just at top level.
        $._statement,
        $.redefinition_statement,
        $.standalone_redefines,
        $.require_statement,
        $.return_statement,
        $.render_statement,
        $.expose_statement,
        $.stakeholder_declaration,
        $.frame_statement,
        $.expression_statement,
        $.assignment_statement,
        $.terminate_statement,
        $.inline_transition,
        $.textual_representation,
        $.multiplicity_definition,
        // State-related actions can appear in definition bodies too
        $.entry_action,
        $.do_action,
        $.exit_action,
        // Standalone member feature (e.g. `member feature 'public' : VisibilityKind;`)
        $.member_feature,
        // Bind statement (e.g. `bind start = done;`)
        $.bind_statement,
      ),

    assignment_statement: ($) =>
      choice(
        seq(field("name", $.identifier), $.value_assignment, ";"),
        seq(field("name", $.identifier), $._body),
      ),

    // Standalone :>> used inside bodies for named/anonymous redefinition
    redefinition_statement: ($) =>
      seq(
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        ":", choice(token.immediate(prec(2, ">>")), token.immediate(prec(1, ">"))),
        $._feature_ref,
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    // Standalone redefines inside bodies (e.g. `redefines massRequired = 200 [kg];`)
    standalone_redefines: ($) =>
      seq(choice("redefines", ":>>"), commaSep1($._feature_ref),
          optional($._type_relationships),
          optional($.multiplicity),
          repeat($._feature_qualifier),
          optional($._type_relationships),
          optional($.value_assignment),
          choice($._body, ";")),

    require_statement: ($) =>
      seq("require",
          repeat($._prefix_metadata),
          optional(choice("constraint", "requirement")),
          optional(field("name", $._feature_ref)),
          optional($._type_relationships),
          optional($.value_assignment),
          choice($._body, ";")),

    return_statement: ($) =>
      seq("return",
          optional(choice("attribute", "part", "port", "ref", "feature")),
          optional(field("name", $.identifier)),
          repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
          optional($.value_assignment),
          choice($._body, ";")),

    render_statement: ($) =>
      seq("render",
          optional("rendering"),
          $._feature_ref,
          optional($._type_relationships),
          optional($.multiplicity),
          ";"),

    expose_statement: ($) =>
      seq(
        optional($.visibility),
        "expose",
        $.qualified_name,
        optional(token(seq("::", "*"))),
        optional(token(seq("::", "**"))),
        optional($.import_filter),
        choice($._body, ";"),
      ),

    stakeholder_declaration: ($) =>
      seq("stakeholder", optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($.value_assignment), choice($._body, ";")),

    frame_statement: ($) =>
      seq("frame", optional("concern"),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($.value_assignment), choice($._body, ";")),

    verify_statement: ($) =>
      seq("verify", optional("requirement"),
          optional($._feature_ref),
          optional($._type_relationships),
          optional($.value_assignment), choice($._body, ";")),

    bind_statement: ($) =>
      seq("bind", $._feature_ref, "=", $._feature_ref, ";"),

    connect_statement: ($) =>
      seq(repeat($._prefix_metadata), "connect",
          choice(
            seq(optional($.multiplicity),
                $._feature_ref, optional($._type_relationships),
                "to",
                optional($.multiplicity), $._feature_ref, optional($._type_relationships)),
            seq("(", commaSep1(choice(
              seq($.identifier, token(seq("::", ">")), $._feature_ref),
              $._feature_ref,
            )), ")"),
          ),
          choice($._body, ";")),

    interface_statement: ($) =>
      seq("interface",
          $.feature_chain, "to", $.feature_chain,
          choice($._body, ";")),

    subject_declaration: ($) =>
      seq("subject", optional(field("name", $.identifier)),
          repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
          optional($.value_assignment), choice($._body, ";")),

    actor_declaration: ($) =>
      seq("actor", optional(field("name", $.identifier)),
          repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
          optional($.value_assignment), choice($._body, ";")),

    objective_declaration: ($) =>
      seq("objective", optional(field("name", $.identifier)),
          repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
          optional($.value_assignment), choice($._body, ";")),

    // KerML bare keyword usage (e.g. `class A { }`, `feature f;`, `type T;`)
    // One branch for all KerML keywords: the endpoint clause is optional
    // everywhere (a benign superset - only connector forms use it), and
    // the formerly-ambiguous `[mult] ref to ...` / `ref = ...` endpoint
    // branches share one prefix so LR decides at the 'to'/'=' token.
    kerml_usage: ($) =>
      seq(
        choice($._kerml_connector_keyword, $._kerml_keyword),
        optional("all"),
        optional($.short_name),
        optional($.multiplicity),
        optional(field("name", $.identifier)),
        repeat(choice($.multiplicity, $._type_relationship, $._feature_qualifier)),
        optional($.value_assignment),
        optional(choice(
          seq("from", optional($.multiplicity), $._feature_ref, optional($._type_relationships), "to", optional($.multiplicity), $._feature_ref, optional($._type_relationships)),
          seq(optional($.multiplicity), $._feature_ref, choice(
            seq("to", optional($.multiplicity), $._feature_ref),
            seq("=", $._feature_ref),
          )),
          seq("of", $._feature_ref, "=", $._feature_ref),
          seq("to", optional($.multiplicity), $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    _kerml_connector_keyword: ($) =>
      choice("connector", seq("assoc", "struct")),

    _kerml_keyword: ($) =>
      choice(
        "class", "struct", "datatype", "type",
        "behavior", "function", "predicate",
        "interaction", "feature", "assoc",
        "bool", "boolean", "inv", "invariant",
      ),

    // KerML standalone relationship statements
    specialization_statement: ($) =>
      seq(
        choice("specialization", "subclassifier", "subtype", "subset", "redefinition", "typing", seq("feature", "typing")),
        optional(field("name", $.identifier)),
        optional(choice("subtype", "subclassifier", "typing", "subset", "redefinition", seq("feature", "typing"))),
        optional($._feature_ref),
        optional($._type_relationships),
        ";",
      ),

    // KerML standalone conjugation (e.g. `conjugation c1 conjugate X ~ Y;`)
    conjugation_statement: ($) =>
      seq(
        "conjugation",
        optional(field("name", $.identifier)),
        "conjugate", $._feature_ref,
        choice("conjugates", "~"), $._feature_ref,
        ";",
      ),

    // KerML standalone featuring (e.g. `featuring F of y by C;`)
    featuring_statement: ($) =>
      seq(
        "featuring",
        optional(field("name", $.identifier)),
        "of", $._feature_ref,
        "by", $._feature_ref,
        ";",
      ),

    // KerML standalone inverse/inverting
    inverse_statement: ($) =>
      seq(
        choice("inverse", "inverting"),
        optional(field("name", $.identifier)),
        optional("inverse"),
        $._feature_ref,
        "of", $._feature_ref,
        ";",
      ),

    // KerML standalone disjoining (e.g. `disjoining disjoint A from B;`)
    disjoining_statement: ($) =>
      seq(
        choice("disjoining", "disjoint"),
        optional(field("name", $.identifier)),
        optional("disjoint"),
        $._feature_ref,
        "from", $._feature_ref,
        ";",
      ),

    filter_expression: ($) =>
      choice(
        seq("@", $._feature_ref),
        $._expression,
      ),

    filter_statement: ($) =>
      seq("filter", $.filter_expression,
          repeat(seq(choice("and", "or"), $.filter_expression)),
          ";"),

    metadata_annotation: ($) =>
      seq("@", $._feature_ref, optional(seq("about", $._feature_ref)), optional($.metadata_body), optional(";")),

    metadata_body: ($) =>
      seq("{", repeat(choice(
        $.metadata_body_usage,
        // Fields named after SysML keywords (`occurrence = 3;`) must be
        // assignments here, not usage declarations — aliased so consumers
        // see a uniform assignment_statement node.
        alias($.metadata_keyword_assignment, $.assignment_statement),
        $._body_element,
      )), "}"),

    // Kept to the minimal keyword set that real metadata vocabularies
    // use as field names (FMEA's `occurrence`): every additional keyword
    // aliased as an identifier here perturbs GLR resolution elsewhere
    // (a broad list regressed `message ... of` payload statements).
    metadata_keyword_assignment: ($) =>
      prec(3, seq(
        field("name", alias("occurrence", $.identifier)),
        $.value_assignment,
        ";",
      )),

    metadata_body_usage: ($) =>
      prec(1, seq(
        optional("ref"),
        choice(seq(":", token.immediate(prec(2, ">>"))), seq(":", token.immediate(prec(1, ">"))), "redefines", "subsets"),
        $._feature_ref,
        optional($._type_relationships),
        optional($.value_assignment),
        optional($.metadata_body),
        ";",
      )),

    metadata_annotation_list: ($) =>
      prec.left(repeat1(seq("{", "@", $._feature_ref, optional($.metadata_body), "}"))),

    expression_statement: ($) =>
      seq($._expression, ";"),

    // --- Type relationships ---

    _type_relationships: ($) =>
      repeat1($._type_relationship),

    _type_relationship: ($) =>
      choice(
        $._colon_type_rel,
        $.keyword_type_relationship,
        $.inverse_keyword,
        $.typed_by_keyword,
        $.tilde_conjugation,
      ),

    _colon_type_rel: ($) =>
      choice(
        seq(":", choice(
          $.redefinition,
          $.specialization,
          $.typed_by,
        )),
        $.binding,
      ),

    redefinition: ($) =>
      seq(token.immediate(prec(2, ">>")), commaSep1(field("target", $._feature_ref))),

    specialization: ($) =>
      seq(token.immediate(prec(1, ">")), commaSep1(field("target", $._feature_ref))),

    binding: ($) =>
      seq(token(seq("::", ">")), field("target", $._feature_ref)),

    typed_by: ($) =>
      seq(optional("~"), commaSep1(field("type", $.qualified_name))),

    // Keyword-based type relationships — unified
    keyword_type_relationship: ($) =>
      seq(
        choice(
          "redefines", "subsets", "conjugates", "references",
          "chains", "specializes", "unions", "intersects", "differences",
          choice("crosses", "=>"),
          seq("disjoint", "from"),
          seq(choice("featuring", "featured"), "by"),
        ),
        commaSep1(field("target", $._feature_ref)),
      ),

    inverse_keyword: ($) =>
      seq("inverse", "of", field("target", $._feature_ref)),

    typed_by_keyword: ($) =>
      seq(choice(seq("typed", "by"), seq("defined", "by")), commaSep1(field("type", $.qualified_name))),

    tilde_conjugation: ($) =>
      prec(1, seq("~", field("target", $._feature_ref))),

    multiplicity: ($) =>
      seq("[", choice("*", seq($._expression, optional(seq("..", choice("*", $._expression))))), "]",
          optional(choice(
            seq("ordered", optional("nonunique")),
            seq("nonunique", optional("ordered")),
          ))),

    // Standalone multiplicity definition (e.g. `multiplicity exactlyOne [1..1] { }`)
    multiplicity_definition: ($) =>
      seq(
        "multiplicity",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        choice($._body, ";"),
      ),

    // Bind statement (e.g. `bind start = done { doc ... }`)
    bind_statement: ($) =>
      seq("bind", $._feature_ref, "=", $._feature_ref,
          choice($._body, ";")),

    // Member feature declaration (e.g. `member feature 'public' : VisibilityKind;`)
    member_feature: ($) =>
      seq(
        "member", "feature",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    // Feature qualifiers that can appear after multiplicity (e.g. `[0..*] nonunique ordered`)
    _feature_qualifier: ($) =>
      choice("nonunique", "ordered"),

    value_assignment: ($) =>
      choice(
        seq(choice("=", ":=", seq("default", choice("=", ":="))), choice($.body_expression, $._expression)),
        seq("default", $._expression),
        seq("default", $._body),
      ),

    connect_clause: ($) =>
      choice(
        seq("connect", optional($.multiplicity),
            $._feature_ref, optional($._type_relationships), "to",
            optional($.multiplicity), $._feature_ref, optional($._type_relationships)),
        seq("connect", "(", commaSep1(choice(
          seq($.identifier, token(seq("::", ">")), $._feature_ref),
          $._feature_ref,
        )), ")"),
      ),

    // --- Short name ---

    short_name: ($) =>
      seq("<", $.quoted_name, ">"),

    quoted_name: ($) =>
      /[^>]+/,

    // --- Prefix metadata ---

    _prefix_metadata: ($) =>
      $.hash_tag,

    hash_tag: ($) =>
      prec(1, seq("#", choice($.qualified_name, $.identifier))),

    // --- Visibility ---

    visibility: ($) => choice("public", "private", "protected"),

    // --- Modifiers ---

    _modifier: ($) =>
      choice(
        $.visibility,
        $.modifier,
      ),

    // Named node so modifiers (esp. `variation`/`variant`, Ch 35) are
    // visible/queryable in the CST rather than anonymous tokens.
    modifier: ($) =>
      choice(
        "abstract",
        "variation",
        "variant",
        "individual",
        "readonly",
        "derived",
        "nonunique",
        "ordered",
        "in",
        "out",
        "inout",
        "composite",
        "conjugate",
        "const",
        "constant",
        "disjoint",
        "portion",
        "var",
        "ref",
      ),

    // --- Feature reference ---

    _feature_ref: ($) =>
      choice(
        $.qualified_name,
        $.feature_chain,
      ),

    // --- Expressions ---

    _expression: ($) =>
      choice(
        $.identifier,
        $.qualified_name,
        $.feature_chain,
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.null_literal,
        $.binary_expression,
        $.unary_expression,
        $.paren_expression,
        $.bracket_expression,
        $.index_expression,
        $.invocation_expression,
        $.new_expression,
        $.meta_expression,
        $.conditional_expression,
        $.select_expression,
        $.metadata_access_expression,
      ),

    binary_expression: ($) =>
      choice(
        // null coalescing
        prec.right(0, seq($._expression, "??", $._expression)),
        // implies — lowest precedence, right-associative
        prec.right(1, seq($._expression, "implies", $._expression)),
        // or, xor
        prec.left(2, seq($._expression, choice("or", "|", "xor", "^"), $._expression)),
        // and
        prec.left(3, seq($._expression, choice("and", "&"), $._expression)),
        // equality
        prec.left(4, seq($._expression, choice("==", "!=", "===", "!=="), $._expression)),
        // comparison
        prec.left(5, seq($._expression, choice("<", ">", "<=", ">="), $._expression)),
        // additive
        prec.left(6, seq($._expression, choice("+", "-"), $._expression)),
        // multiplicative
        prec.left(7, seq($._expression, choice("*", "/", "%"), $._expression)),
        // exponentiation — right-associative
        prec.right(8, seq($._expression, "**", $._expression)),
        // type operators (incl. classification `@` and metaclassification `@@`)
        prec.left(9, seq($._expression, choice("hastype", "istype", "as", "@", "@@"), $._expression)),
        // collect/select arrow with body
        prec.left(10, seq($._expression, "->", $.identifier, "{", repeat(choice($._body_element, $._expression)), "}")),
        // collect/select arrow with invocation
        prec.left(10, seq($._expression, "->", $.identifier, "(", commaSep($._argument), ")")),
        // collect/select arrow with quoted name
        prec.left(10, seq($._expression, "->", $.identifier, $.quoted_identifier)),
        // collect/select arrow with function reference (e.g. ->reduce RealFunctions::'+')
        prec.left(10, seq($._expression, "->", $.identifier, $._feature_ref)),
        // collect/select arrow (plain)
        prec.left(10, seq($._expression, "->", $._expression)),
        // member access — highest
        prec.left(11, seq($._expression, choice(".", "::"), $._expression)),
      ),

    unary_expression: ($) =>
      prec(12, seq(choice("not", "-", "~", "all"), $._expression)),

    paren_expression: ($) =>
      choice(
        seq("(", $._expression, "..", $._expression, ")"),
        seq("(", commaSep1($._expression), ")"),
        seq("(", ")"),
      ),

    bracket_expression: ($) =>
      prec.left(1, seq($._expression, "[", $._expression, "]")),

    index_expression: ($) =>
      prec(3, seq($._expression, "#", "(", $._expression, ")")),

    invocation_expression: ($) =>
      prec(3, seq(choice($.qualified_name, $.identifier), "(", commaSep($._argument), ")")),

    metadata_access_expression: ($) =>
      prec(3, seq("@", $._feature_ref)),

    select_expression: ($) =>
      prec(11, choice(
        seq($._expression, ".?", "{", repeat(choice($._body_element, $._expression)), "}"),
        seq($._expression, ".{", repeat(choice($._body_element, $._expression)), "}"),
      )),

    new_expression: ($) =>
      seq("new", choice($.qualified_name, $.identifier), "(", commaSep($._argument), ")"),

    _argument: ($) =>
      choice(
        $.named_argument,
        $.body_expression,
        $._expression,
      ),

    named_argument: ($) =>
      seq(field("name", $.identifier), "=", $._expression),

    // Function-literal body expression (KerML body expression, Ch 30.5):
    // `{ in x; expr }` — used as argument to higher-order functions and as
    // calc/attribute values.
    body_expression: ($) =>
      seq("{", repeat(choice($._body_element, $._expression)), "}"),

    meta_expression: ($) =>
      seq($._feature_ref, "meta", $._feature_ref),

    conditional_expression: ($) =>
      prec.right(1, seq(
        "if", $._expression,
        "?", $._expression,
        "else", $._expression,
      )),

    // --- Names ---

    // prec.right: greedily consume `::` segments so `@Pkg::Name` stays one
    // qualified name instead of splitting at the binary `::` operator.
    qualified_name: ($) =>
      prec.right(choice(
        seq($.identifier, repeat(seq("::", $.identifier))),
        seq("$", repeat1(seq("::", $.identifier))),
      )),

    feature_chain: ($) =>
      prec.left(
        seq(choice($.qualified_name, $.identifier), repeat1(seq(".", $.identifier))),
      ),

    _word: ($) => /[A-Za-z_][A-Za-z0-9_]*/,

    identifier: ($) => choice(
      $._word,
      $.quoted_identifier,
    ),

    quoted_identifier: ($) =>
      seq("'", /[^']+/, "'"),

    // --- Literals ---

    number_literal: ($) =>
      token(choice(
        /[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/,
        /\.[0-9]+([eE][+-]?[0-9]+)?/,
        /0[xX][0-9a-fA-F]+/,
      )),

    string_literal: ($) =>
      token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    boolean_literal: ($) => choice("true", "false"),

    null_literal: ($) => "null",

    // --- Comments ---

    line_comment: ($) => token(seq("//", /[^*\n][^\n]*/)),

    block_comment: ($) =>
      token(choice(
        seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        seq("//*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
      )),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
