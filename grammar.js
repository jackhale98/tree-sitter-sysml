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
    [$.then_succession, $.state_body],
  ],

  rules: {
    source_file: ($) => repeat($._element),

    _element: ($) =>
      choice(
        $.package_declaration,
        $._declaration,
        $.feature_usage,
        $.import_statement,
        $.alias_declaration,
        $.comment_element,
        $.doc_comment,
        $.satisfy_statement,
        $.filter_statement,
        $.metadata_annotation,
        $._statement,
      ),

    // =================================================================
    // Declaration wrapper — the key optimization.
    // ONE rule handles the modifier prefix, then dispatches to the
    // specific definition or usage type based on the keyword.
    // =================================================================

    _declaration: ($) =>
      seq(
        repeat($._prefix_metadata),
        repeat($._modifier),
        choice($._definition_type, $._usage_type),
      ),

    // --- Package ---

    package_declaration: ($) =>
      seq(
        optional($.visibility),
        optional(choice(seq("standard", "library"), "library")),
        "package",
        field("name", $.identifier),
        $.package_body,
      ),

    package_body: ($) => seq("{", repeat($._element), "}"),

    // --- Import ---

    import_statement: ($) =>
      seq(
        optional($.visibility),
        "import",
        optional("all"),
        $.qualified_name,
        optional(token(seq("::", "*"))),
        optional(token(seq("::", "**"))),
        choice($._body, ";"),
      ),

    // --- Alias ---

    alias_declaration: ($) =>
      seq(
        optional($.visibility),
        "alias",
        field("name", $.identifier),
        "for",
        $.qualified_name,
        ";",
      ),

    // --- Comments ---

    comment_element: ($) =>
      seq(
        "comment",
        optional(field("name", $.identifier)),
        optional(seq("about", $.qualified_name)),
        $.block_comment,
      ),

    doc_comment: ($) =>
      seq("doc", $.block_comment),

    // --- Satisfy ---

    satisfy_statement: ($) =>
      seq(
        "satisfy",
        optional("requirement"),
        optional($._feature_ref),
        optional(seq("by", $._feature_ref)),
        optional($.requirement_body),
        optional(";"),
      ),

    // =================================================================
    // Definitions — no prefix (provided by _declaration wrapper)
    // =================================================================

    _definition_type: ($) =>
      choice(
        $.part_definition,
        $.action_definition,
        $.state_definition,
        $.port_definition,
        $.connection_definition,
        $.flow_definition,
        $.attribute_definition,
        $.item_definition,
        $.requirement_definition,
        $.constraint_definition,
        $.view_definition,
        $.viewpoint_definition,
        $.rendering_definition,
        $.concern_definition,
        $.use_case_definition,
        $.analysis_case_definition,
        $.verification_case_definition,
        $.allocation_definition,
        $.interface_definition,
        $.enumeration_definition,
        $.individual_definition,
        $.occurrence_definition,
        $.metadata_definition,
        $.calc_definition,
        $.case_definition,
        $.class_definition,
        $.struct_definition,
        $.assoc_definition,
        $.behavior_definition,
        $.datatype_definition,
        $.feature_definition,
        $.function_definition,
        $.predicate_definition,
        $.connector_definition,
        $.interaction_definition,
        $.type_definition,
        $.namespace_definition,
        // Additional KerML definitions
        $.classifier_definition,
        $.metaclass_definition,
        $.expr_definition,
        $.step_definition,
      ),

    part_definition: ($) =>
      seq(
        "part", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    action_definition: ($) =>
      seq(
        "action", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    state_definition: ($) =>
      seq(
        "state", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.state_body, ";"),
      ),

    port_definition: ($) =>
      seq(
        "port", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    connection_definition: ($) =>
      seq(
        optional("flow"),
        "connection", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    flow_definition: ($) =>
      seq(
        "flow", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    attribute_definition: ($) =>
      seq(
        "attribute", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    item_definition: ($) =>
      seq(
        "item", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    requirement_definition: ($) =>
      seq(
        "requirement", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    constraint_definition: ($) =>
      seq(
        "constraint", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    view_definition: ($) =>
      seq(
        "view", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    viewpoint_definition: ($) =>
      seq(
        "viewpoint", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    rendering_definition: ($) =>
      seq(
        "rendering", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    concern_definition: ($) =>
      seq(
        "concern", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    use_case_definition: ($) =>
      seq(
        "use", "case", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    analysis_case_definition: ($) =>
      seq(
        "analysis", optional("case"), "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    verification_case_definition: ($) =>
      seq(
        "verification", optional("case"), "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    allocation_definition: ($) =>
      seq(
        "allocation", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    interface_definition: ($) =>
      seq(
        "interface", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    enumeration_definition: ($) =>
      seq(
        choice("enum", "enumeration"), "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        $.enumeration_body,
      ),

    individual_definition: ($) =>
      seq(
        "individual", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    occurrence_definition: ($) =>
      seq(
        "occurrence", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    metadata_definition: ($) =>
      seq(
        "metadata", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    calc_definition: ($) =>
      seq(
        "calc", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    // --- KerML definitions ---

    case_definition: ($) =>
      seq(
        "case", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    class_definition: ($) =>
      seq(
        "class", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    struct_definition: ($) =>
      seq(
        "struct", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    assoc_definition: ($) =>
      seq(
        "assoc", optional("struct"), "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    behavior_definition: ($) =>
      seq(
        "behavior", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    datatype_definition: ($) =>
      seq(
        "datatype", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    feature_definition: ($) =>
      seq(
        "feature", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    function_definition: ($) =>
      seq(
        "function", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    predicate_definition: ($) =>
      seq(
        "predicate", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    connector_definition: ($) =>
      seq(
        "connector", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    interaction_definition: ($) =>
      seq(
        "interaction", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    type_definition: ($) =>
      seq(
        "type", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    namespace_definition: ($) =>
      seq(
        "namespace", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    // Additional KerML definitions

    classifier_definition: ($) =>
      seq(
        "classifier", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    metaclass_definition: ($) =>
      seq(
        "metaclass", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    expr_definition: ($) =>
      seq(
        "expr", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    step_definition: ($) =>
      seq(
        "step", "def",
        optional($.short_name),
        field("name", $.identifier),
        optional($._type_relationships),
        choice($.definition_body, ";"),
      ),

    // --- Definition body ---

    definition_body: ($) =>
      seq("{", repeat($._body_element), "}"),

    enumeration_body: ($) =>
      seq("{", repeat(choice($.enum_member, $._body_element)), "}"),

    enum_member: ($) =>
      prec(1, seq(
        optional("enum"),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.value_assignment),
        ";",
      )),

    // =================================================================
    // Usages — no prefix (provided by _declaration wrapper)
    // =================================================================

    _usage_type: ($) =>
      choice(
        $.part_usage,
        $.attribute_usage,
        $.port_usage,
        $.action_usage,
        $.state_usage,
        $.item_usage,
        $.connection_usage,
        $.interface_usage,
        $.constraint_usage,
        $.requirement_usage,
        $.ref_usage,
        $.event_usage,
        $.occurrence_usage,
        $.allocation_usage,
        $.flow_usage,
        $.snapshot_usage,
        $.timeslice_usage,
        $.calc_usage,
        $.view_usage,
        $.viewpoint_usage,
        $.rendering_usage,
        $.concern_usage,
        $.use_case_usage,
        $.analysis_usage,
        $.verification_usage,
        $.metadata_usage,
        // Additional KerML usages
        $.classifier_usage,
        $.metaclass_usage,
        $.expr_usage,
        $.step_usage,
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
        $.merge_node,
        $.decide_node,
        $.fork_node,
        $.join_node,
      ),

    part_usage: ($) =>
      seq(
        "part",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        optional($.metadata_annotation_list),
        choice($._body, ";"),
      ),

    attribute_usage: ($) =>
      seq(
        "attribute",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        optional($.metadata_annotation_list),
        choice($._body, ";"),
      ),

    port_usage: ($) =>
      seq(
        "port",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        optional($.metadata_annotation_list),
        choice($._body, ";"),
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
          seq("send", $._expression, optional(seq("via", $._feature_ref))),
          seq("accept", optional(field("accept_name", $.identifier)),
              optional($._type_relationships),
              optional(seq("via", $._feature_ref))),
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

    item_usage: ($) =>
      seq(
        optional("ref"),
        "item",
        optional(field("name", $.identifier)),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    connection_usage: ($) =>
      seq(
        optional("flow"),
        "connection",
        optional(field("name", $.identifier)),
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
        optional($.connect_clause),
        choice($._body, ";"),
      ),

    constraint_usage: ($) =>
      seq(
        optional(choice("require", "assert", "assume")),
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
        choice($.requirement_body, ";"),
      ),

    ref_usage: ($) =>
      seq(
        "ref",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    event_usage: ($) =>
      seq(
        "event",
        optional("occurrence"),
        optional($._feature_ref),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    occurrence_usage: ($) =>
      seq(
        "occurrence",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
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
        optional(seq("of", $._feature_ref)),
        optional(choice(
          seq("from", $._feature_ref, "to", $._feature_ref),
          seq($._feature_ref, "to", $._feature_ref),
        )),
        choice($._body, ";"),
      ),

    snapshot_usage: ($) =>
      seq(
        "snapshot",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    timeslice_usage: ($) =>
      seq(
        "timeslice",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    calc_usage: ($) =>
      seq(
        "calc",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    view_usage: ($) =>
      seq(
        "view",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    viewpoint_usage: ($) =>
      seq(
        "viewpoint",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    rendering_usage: ($) =>
      seq(
        "rendering",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    concern_usage: ($) =>
      seq(
        "concern",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    use_case_usage: ($) =>
      seq(
        "use", "case",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    analysis_usage: ($) =>
      seq(
        "analysis",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    verification_usage: ($) =>
      seq(
        "verification",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    metadata_usage: ($) =>
      seq(
        "metadata",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    // Additional KerML usages

    classifier_usage: ($) =>
      seq(
        "classifier",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    metaclass_usage: ($) =>
      seq(
        "metaclass",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    expr_usage: ($) =>
      seq(
        "expr",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    step_usage: ($) =>
      seq(
        "step",
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        optional($.value_assignment),
        choice($._body, ";"),
      ),

    end_feature: ($) =>
      seq(
        "end",
        repeat($._prefix_metadata),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional($.multiplicity),
        choice($._body, ";"),
      ),

    // Implicit feature usage (modifier-driven, no keyword — stays outside _declaration)
    feature_usage: ($) =>
      choice(
        // With modifiers: name and type are optional
        seq(
          repeat($._prefix_metadata),
          repeat1($._modifier),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($.value_assignment),
          choice($._body, ";"),
        ),
        // Without modifiers: name and type are required
        seq(
          repeat($._prefix_metadata),
          field("name", $.identifier),
          $._type_relationships,
          optional($.multiplicity),
          optional($.value_assignment),
          choice($._body, ";"),
        ),
      ),

    // --- Behavioral ---

    then_succession: ($) =>
      seq(
        "then",
        optional(choice("action", "fork", "join", "merge", "decide", "event")),
        optional($._feature_ref),
        optional($.multiplicity),
        optional($._type_relationships),
        optional($.value_assignment),
        optional(choice(
          seq("send", $._expression, optional(seq("via", $._feature_ref))),
          seq("accept", optional(field("accept_name", $.identifier)),
              optional($._type_relationships),
              optional(seq("via", $._feature_ref))),
        )),
        choice($._body, ";"),
      ),

    succession_statement: ($) =>
      choice(
        seq("first", $._feature_ref, "then", $._feature_ref, ";"),
        seq("first", $._feature_ref, ";"),
      ),

    perform_statement: ($) =>
      seq(
        "perform",
        optional("action"),
        $._feature_ref,
        optional(seq("redefines", $._feature_ref)),
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
        repeat1(choice("use", "case", "action", "state")),
        field("name", $.identifier),
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
        optional($.do_clause),
        seq("then", $._feature_ref),
        ";",
      ),

    accept_clause: ($) =>
      seq(
        "accept",
        choice(
          seq("when", $._expression),
          seq("at", $._feature_ref),
          seq(
            $._feature_ref,
            optional($._type_relationships),
            optional(seq("via", $._feature_ref)),
          ),
        ),
      ),

    do_clause: ($) =>
      seq("do", choice(
        seq("send", $._expression, choice("to", "via"), $._feature_ref),
        seq($._feature_ref, choice(";", $._body)),
        $._body,
      )),

    send_action: ($) =>
      seq("send", $._expression, "to", $._feature_ref, ";"),

    if_action: ($) =>
      seq(
        "if", $._expression,
        "then", $._feature_ref,
        optional(seq("else", $._feature_ref)),
        ";",
      ),

    while_action: ($) =>
      seq(
        "while", $._expression,
        "do", $._feature_ref,
        ";",
      ),

    for_action: ($) =>
      seq(
        "for", $.identifier,
        ":", $._feature_ref,
        "in", $._feature_ref,
        "do", $._feature_ref,
        ";",
      ),

    assign_action: ($) =>
      seq(
        "assign", $._feature_ref,
        ":=", $._expression,
        ";",
      ),

    loop_action: ($) =>
      seq(
        "loop",
        optional("action"),
        optional(field("name", $.identifier)),
        optional($._type_relationships),
        optional(seq("until", $._expression)),
        choice($._body, ";"),
      ),

    merge_node: ($) =>
      seq("merge", field("name", $.identifier), ";"),

    decide_node: ($) =>
      seq("decide", field("name", $.identifier), ";"),

    fork_node: ($) =>
      seq("fork", field("name", $.identifier), ";"),

    join_node: ($) =>
      seq("join", field("name", $.identifier), ";"),

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
          optional(seq("from", $._feature_ref)),
          "to", $._feature_ref, ";"),

    allocate_statement: ($) =>
      seq("allocate", $._feature_ref, "to", $._feature_ref,
          choice($._body, ";")),

    message_statement: ($) =>
      seq(
        "message",
        optional(field("name", $.identifier)),
        optional(seq("of", $._feature_ref, optional($._type_relationships))),
        optional(seq("from", $._feature_ref, "to", $._feature_ref)),
        ";",
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
      seq("allocate", $._feature_ref, "to", $._feature_ref),

    // --- Body variants ---

    _body: ($) => $.definition_body,

    state_body: ($) =>
      seq(
        "{",
        optional(seq("entry", optional("action"), choice(
          seq(";", optional(seq("then", $._feature_ref, ";"))),
          $.definition_body,
          seq($._feature_ref, choice(
            seq(";", optional(seq("then", $._feature_ref, ";"))),
            $.definition_body,
          )),
        ))),
        optional(seq("do", choice(
          seq($._feature_ref, choice(";", $._body)),
          $._body,
        ))),
        optional(seq("exit", choice(
          seq($._feature_ref, ";"),
          ";",
        ))),
        repeat($._body_element),
        "}",
      ),

    requirement_body: ($) =>
      seq("{", repeat($._body_element), "}"),

    constraint_body: ($) =>
      seq("{", repeat(choice($._body_element, $._expression)), "}"),

    // --- Body elements ---

    _body_element: ($) =>
      choice(
        $._declaration,
        $.feature_usage,
        $.import_statement,
        $.alias_declaration,
        $.comment_element,
        $.doc_comment,
        $.satisfy_statement,
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
        ":", token.immediate(prec(2, ">>")),
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
      seq("require", $._feature_ref, ";"),

    return_statement: ($) =>
      seq("return",
          optional(choice("attribute", "part", "port", "ref")),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
          optional($.value_assignment),
          ";"),

    render_statement: ($) =>
      seq("render", $._feature_ref, ";"),

    expose_statement: ($) =>
      seq(
        optional($.visibility),
        "expose",
        $.qualified_name,
        optional(token(seq("::", "*"))),
        optional(token(seq("::", "**"))),
        choice($._body, ";"),
      ),

    stakeholder_declaration: ($) =>
      seq("stakeholder", optional(field("name", $.identifier)),
          optional($._type_relationships),
          ";"),

    frame_statement: ($) =>
      seq("frame", optional("concern"),
          optional(field("name", $.identifier)),
          optional($._type_relationships),
          ";"),

    verify_statement: ($) =>
      seq("verify", optional("requirement"), $._feature_ref,
          optional($.value_assignment), choice($._body, ";")),

    bind_statement: ($) =>
      seq("bind", $._feature_ref, "=", $._feature_ref, ";"),

    connect_statement: ($) =>
      seq("connect", optional($.multiplicity),
          $._feature_ref, optional($._type_relationships),
          "to",
          optional($.multiplicity), $._feature_ref, optional($._type_relationships),
          choice($._body, ";")),

    interface_statement: ($) =>
      seq("interface",
          $.feature_chain, "to", $.feature_chain,
          choice($._body, ";")),

    subject_declaration: ($) =>
      seq("subject", optional(field("name", $.identifier)),
          optional($.multiplicity),
          optional($._type_relationships),
          optional($.value_assignment), ";"),

    actor_declaration: ($) =>
      seq("actor", field("name", $.identifier),
          optional($._type_relationships),
          optional($.multiplicity),
          optional($.value_assignment), ";"),

    objective_declaration: ($) =>
      seq("objective", optional(field("name", $.identifier)),
          optional($._type_relationships),
          choice($._body, ";")),

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
      seq("@", $._feature_ref, optional(seq("about", $._feature_ref)), optional($._body), optional(";")),

    metadata_annotation_list: ($) =>
      prec.left(repeat1(seq("{", "@", $._feature_ref, optional($._body), "}"))),

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
      seq(token.immediate(prec(2, ">>")), field("target", $._feature_ref)),

    specialization: ($) =>
      seq(token.immediate(prec(1, ">")), field("target", $._feature_ref)),

    binding: ($) =>
      seq(token(seq("::", ">")), field("target", $._feature_ref)),

    typed_by: ($) =>
      seq(optional("~"), field("type", $.qualified_name)),

    redefines_keyword: ($) =>
      seq("redefines", field("target", $._feature_ref)),

    subsets_keyword: ($) =>
      seq("subsets", field("target", $._feature_ref)),

    conjugates_keyword: ($) =>
      seq("conjugates", field("target", $._feature_ref)),

    references_keyword: ($) =>
      seq("references", field("target", $._feature_ref)),

    chains_keyword: ($) =>
      seq("chains", field("target", $._feature_ref)),

    inverse_keyword: ($) =>
      seq("inverse", "of", field("target", $._feature_ref)),

    multiplicity: ($) =>
      seq("[", choice("*", seq($._expression, optional(seq("..", choice("*", $._expression))))), "]",
          optional(choice("ordered", "nonunique"))),

    value_assignment: ($) =>
      seq(choice("=", ":=", "default"), $._expression),

    connect_clause: ($) =>
      seq("connect", optional($.multiplicity),
          $._feature_ref, optional($._type_relationships), "to",
          optional($.multiplicity), $._feature_ref, optional($._type_relationships)),

    // --- Short name ---

    short_name: ($) =>
      seq("<", $.quoted_name, ">"),

    quoted_name: ($) =>
      /[^>]+/,

    // --- Prefix metadata ---

    _prefix_metadata: ($) =>
      $.hash_tag,

    hash_tag: ($) =>
      seq("#", $.identifier),

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
        "disjoint",
        "portion",
        "var",
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
      ),

    binary_expression: ($) =>
      prec.left(
        1,
        seq(
          $._expression,
          choice(
            "==", "!=", "<", ">", "<=", ">=",
            "+", "-", "*", "/", "%", "**",
            "and", "or", "xor", "implies",
            "hastype", "istype", "as",
            ".", "::",
          ),
          $._expression,
        ),
      ),

    unary_expression: ($) =>
      prec(2, seq(choice("not", "-", "~"), $._expression)),

    paren_expression: ($) =>
      seq("(", commaSep1($._expression), ")"),

    bracket_expression: ($) =>
      prec.left(1, seq($._expression, "[", $._expression, "]")),

    index_expression: ($) =>
      prec(3, seq($._expression, "#", "(", $._expression, ")")),

    invocation_expression: ($) =>
      prec(3, seq($.identifier, "(", commaSep($._expression), ")")),

    new_expression: ($) =>
      seq("new", $.identifier, "(", commaSep($._argument), ")"),

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
      prec.left(
        seq($.identifier, repeat(seq("::", $.identifier))),
      ),

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

    line_comment: ($) => token(seq("//", /.*/)),

    block_comment: ($) =>
      token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
