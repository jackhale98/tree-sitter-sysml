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
    [$.qualified_name, $._expression],
    [$.flow_usage, $.flow_statement],
    [$.metadata_annotation, $.metadata_annotation_list],
    [$.metadata_annotation],
    [$.redefinition_statement, $.redefinition],
    [$.satisfy_statement],
    [$._expression, $.qualified_name, $.feature_chain],
    [$._expression, $.feature_chain],
    [$._feature_ref, $.feature_chain],
    [$.redefinition_statement, $._expression, $.qualified_name],
    [$.standalone_redefines, $.redefines_keyword],
    [$.feature_usage, $.redefinition_statement, $._expression, $.qualified_name],
    [$.feature_usage, $._expression, $.qualified_name],
    [$.constraint_usage, $.require_statement],
    [$.if_action],
    [$.entry_action],
    [$.definition_body, $.metadata_body],
    [$.metadata_usage],
    [$.metadata_usage, $.qualified_name],
    [$.multiplicity],
    [$.assert_statement],
    [$.succession_usage, $.succession_statement],
    [$.accept_clause, $.accept_action],
    [$.feature_usage, $._declaration, $.namespace_declaration, $.constraint_usage, $._statement, $.connect_statement],
    [$.constraint_usage],
    [$.feature_usage, $._declaration, $.constraint_usage, $.connect_statement],
    [$.end_feature],
    [$.interface_statement, $._feature_ref],
    [$.usage],
    [$.end_feature, $.end_feature],
    [$.definition_body, $.constraint_body],
    [$.event_usage],
    [$._def_keyword, $._modifier],
    [$._def_keyword, $.metadata_usage],
    [$._usage_keyword, $._modifier],
    [$.kerml_usage],
    [$._feature_ref, $._expression],
    [$.redefinition_statement, $.specialization],
    [$.disjoining_statement, $._modifier],
    [$.connection_usage],
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

    generic_definition: ($) =>
      prec(-1, seq(
        "def",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      )),

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
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.value_assignment),
        optional($.metadata_annotation_list),
        choice($._body, ";"),
      ),

    _usage_keyword: ($) =>
      choice(
        "part", "attribute", "port", "item", "occurrence", "ref",
        "calc", "view", "viewpoint", "rendering", "concern",
        "analysis", "verification", "enum",
        "classifier", "metaclass", "expr", "step",
        seq("use", "case"),
        seq("snapshot", optional(choice("item", "part"))),
        seq("timeslice", optional(choice("item", "part"))),
      ),

    action_usage: ($) =>
      seq(
        "action",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        optional(choice(
          seq("send", optional($._expression),
              optional(seq("via", $._feature_ref)),
              optional(seq("to", $._feature_ref))),
          seq("accept", optional(field("accept_name", $.identifier)),
              optional($._type_relationships),
              optional(seq("after", $._expression)),
              optional(seq("via", $._feature_ref))),
          "terminate",
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
        optional($._type_relationships),
        optional($.multiplicity),
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
        choice($.constraint_body, ";"),
      ),

    requirement_usage: ($) =>
      seq(
        "requirement",
        optional($.short_name),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
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
        optional($._type_relationships),
        optional($.allocate_clause),
        choice($._body, ";"),
      ),

    flow_usage: ($) =>
      seq(
        "flow",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional(seq("of", $._feature_ref, optional($.multiplicity))),
        optional(choice(
          seq("from", $._feature_ref, "to", $._feature_ref),
          seq($._feature_ref, "to", $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    metadata_usage: ($) =>
      seq(
        "metadata",
        optional(field("name", $.identifier)),
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
        optional(choice("ref", "item", "port", "part", "attribute", "feature")),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($._type_relationships),
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
          optional($.value_assignment),
          choice($._body, ";"),
        ),
        // Without prefix: name and type are required
        seq(
          field("name", $.identifier),
          $._type_relationships,
          optional($.multiplicity),
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
        optional(choice(
          seq("bind", $._feature_ref, "=", $._feature_ref),
          seq("of", $._feature_ref, "=", $._feature_ref),
          seq($._feature_ref, "=", $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    succession_usage: ($) =>
      seq(
        "succession",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional(choice(
          seq("first", $._feature_ref, "then", $._feature_ref),
          seq($._feature_ref, "then", $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    succession_flow_usage: ($) =>
      seq(
        "succession", "flow",
        optional(field("name", $.identifier)),
        optional(seq("of", $._feature_ref)),
        optional(choice(
          seq("from", $._feature_ref, "to", $._feature_ref),
          seq($._feature_ref, "to", $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    // --- Behavioral ---

    then_succession: ($) =>
      prec.left(seq(
        "then",
        optional(choice("action", "state", "fork", "join", "merge", "decide", seq("event", "occurrence"), "event", "terminate", "message", "timeslice", seq("snapshot", optional(choice("part", "item"))), seq("use", "case"), "verification", "analysis")),
        optional($._feature_ref),
        optional($.multiplicity),
        optional($._type_relationships),
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
          seq("of", optional(field("of_name", $.identifier)), optional($._type_relationships), $._feature_ref,
              optional($.multiplicity), optional($._type_relationships), optional($.value_assignment),
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
        $._feature_ref,
        optional(seq("redefines", $._feature_ref)),
        optional("parallel"),
        choice($.state_body, ";"),
      ),

    include_statement: ($) =>
      seq(
        "include",
        optional(repeat1(choice("use", "case", "action", "state"))),
        $._feature_ref,
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
          seq("send", $._expression, choice("to", "via"), $._feature_ref),
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
          seq("send", $._expression, choice("to", "via"), $._feature_ref),
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
        seq("send", $._expression, choice("to", "via"), $._feature_ref),
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
            "do", $._feature_ref, ";"),
        seq("for", $.identifier, optional(seq(":", $._feature_ref)), "in", $._expression,
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
        optional(seq("of", optional(field("of_name", $.identifier)), optional($._type_relationships), $._feature_ref, optional($.multiplicity), optional($._type_relationships))),
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
        seq($._feature_ref, choice(
          seq(";", optional(seq("then", $._feature_ref, ";"))),
          $.definition_body,
        )),
      )),

    do_action: ($) =>
      seq("do", choice(
        seq("send", $._expression, choice("to", "via"), $._feature_ref, ";"),
        seq("assign", $._feature_ref, ":=", $._expression, ";"),
        seq("action", $._feature_ref, optional($._type_relationships), choice(";", $._body)),
        seq($._feature_ref, choice(";", $._body)),
        $._body,
      )),

    exit_action: ($) =>
      seq("exit", optional("action"), choice(
        seq($._feature_ref, choice(";", $._body)),
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
        $.allocate_statement,
        $.message_statement,
        $.flow_statement,
        $.dependency_statement,
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
      seq("redefines", $._feature_ref,
          optional($.value_assignment),
          ";"),

    require_statement: ($) =>
      seq("require",
          repeat($._prefix_metadata),
          optional(choice("constraint", "requirement")),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.value_assignment),
          choice($._body, ";")),

    return_statement: ($) =>
      seq("return",
          optional(choice("attribute", "part", "port", "ref")),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
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
          optional($.multiplicity),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($.value_assignment), choice($._body, ";")),

    actor_declaration: ($) =>
      seq("actor", optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($.value_assignment), choice($._body, ";")),

    objective_declaration: ($) =>
      seq("objective", optional(field("name", $.identifier)),
          optional($._type_relationships),
          choice($._body, ";")),

    // KerML bare keyword usage (e.g. `class A { }`, `feature f;`, `type T;`)
    kerml_usage: ($) =>
      choice(
        // Connector/binding forms with endpoint clauses
        seq(
          $._kerml_connector_keyword,
          optional("all"),
          optional($.short_name),
          optional(field("name", $.identifier)),
          optional($.multiplicity),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($._type_relationships),
          optional($.value_assignment),
          optional(choice(
            seq("from", $._feature_ref, "to", $._feature_ref),
            seq($._feature_ref, "to", $._feature_ref),
            seq($._feature_ref, "=", $._feature_ref),
            seq("of", $._feature_ref, "=", $._feature_ref),
            seq("to", $._feature_ref),
          )),
          choice($._body, ";"),
        ),
        // All other KerML keywords (no endpoint clause)
        seq(
          $._kerml_keyword,
          optional("all"),
          optional($.short_name),
          optional(field("name", $.identifier)),
          optional($.multiplicity),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($._type_relationships),
          optional($.value_assignment),
          choice($._body, ";"),
        ),
      ),

    _kerml_connector_keyword: ($) =>
      choice("connector", seq("assoc", "struct")),

    _kerml_keyword: ($) =>
      choice(
        "class", "struct", "datatype", "type",
        "behavior", "function", "predicate",
        "interaction", "feature", "assoc",
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
        $._body_element,
      )), "}"),

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
        $.redefines_keyword,
        $.subsets_keyword,
        $.conjugates_keyword,
        $.references_keyword,
        $.chains_keyword,
        $.inverse_keyword,
        $.specializes_keyword,
        $.typed_by_keyword,
        $.crosses_keyword,
        $.unions_keyword,
        $.intersects_keyword,
        $.differences_keyword,
        $.featuring_keyword,
        $.disjoint_from_keyword,
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

    redefines_keyword: ($) =>
      seq("redefines", commaSep1(field("target", $._feature_ref))),

    subsets_keyword: ($) =>
      seq("subsets", commaSep1(field("target", $._feature_ref))),

    conjugates_keyword: ($) =>
      seq("conjugates", commaSep1(field("target", $._feature_ref))),

    references_keyword: ($) =>
      seq("references", commaSep1(field("target", $._feature_ref))),

    chains_keyword: ($) =>
      seq("chains", commaSep1(field("target", $._feature_ref))),

    inverse_keyword: ($) =>
      seq("inverse", "of", field("target", $._feature_ref)),

    specializes_keyword: ($) =>
      seq("specializes", commaSep1(field("target", $._feature_ref))),

    typed_by_keyword: ($) =>
      seq(choice(seq("typed", "by"), seq("defined", "by")), commaSep1(field("type", $.qualified_name))),

    crosses_keyword: ($) =>
      seq(choice("crosses", "=>"), commaSep1(field("target", $._feature_ref))),

    unions_keyword: ($) =>
      seq("unions", commaSep1(field("target", $._feature_ref))),

    intersects_keyword: ($) =>
      seq("intersects", commaSep1(field("target", $._feature_ref))),

    differences_keyword: ($) =>
      seq("differences", commaSep1(field("target", $._feature_ref))),

    featuring_keyword: ($) =>
      seq(choice(seq("featuring", "by"), seq("featured", "by")), commaSep1(field("target", $._feature_ref))),

    disjoint_from_keyword: ($) =>
      seq("disjoint", "from", commaSep1(field("target", $._feature_ref))),

    tilde_conjugation: ($) =>
      prec(1, seq("~", field("target", $._feature_ref))),

    multiplicity: ($) =>
      seq("[", choice("*", seq($._expression, optional(seq("..", choice("*", $._expression))))), "]",
          optional(choice(
            seq("ordered", optional("nonunique")),
            seq("nonunique", optional("ordered")),
          ))),

    value_assignment: ($) =>
      seq(choice("=", ":=", seq("default", optional(choice("=", ":=")))), $._expression),

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
        // type operators
        prec.left(9, seq($._expression, choice("hastype", "istype", "as"), $._expression)),
        // collect/select arrow with body
        prec.left(10, seq($._expression, "->", $.identifier, "{", repeat(choice($._body_element, $._expression)), "}")),
        // collect/select arrow with invocation
        prec.left(10, seq($._expression, "->", $.identifier, "(", commaSep($._argument), ")")),
        // collect/select arrow with quoted name
        prec.left(10, seq($._expression, "->", $.identifier, $.quoted_identifier)),
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
        seq($.identifier, "=", $._expression),
        $._expression,
      ),

    meta_expression: ($) =>
      seq($._feature_ref, "meta", $._feature_ref),

    conditional_expression: ($) =>
      prec.right(1, seq(
        "if", $._expression,
        "?", $._expression,
        "else", $._expression,
      )),

    // --- Names ---

    qualified_name: ($) =>
      prec.left(choice(
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
