/**
 * @file A scripting language for the web
 * @author tanomartinoli <ignamartinoli@proton.me>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
	OR: 1,
	COMPARE: 2,
	MATH: 3,
	UNARY: 4,
	MEMBER: 5,
	POSTFIX: 6,
};

module.exports = grammar({
	name: "hyperscript",

	externals: ($) => [$.query_literal, $._lt, $._lte, $.class_literal, $.js_body, $._transition_over, $._transition_using, $._feature_on, $._feature_init, $._template_chars, $._attr_query_open, $._possessive_s, $._single_string, $._show_when],

	extras: ($) => [/[ \t\r\f]+/, $.comment],

	word: ($) => $.identifier,

	supertypes: ($) => [$.feature, $.command, $.literal, $.dom_literal],

	conflicts: ($) => [
		[$.event_predicate, $.special_identifier],
		[$.command_sequence],
	],

	rules: {
		source_file: ($) =>
			seq(
				repeat($._sep),
				optional(choice(prec(1, $.feature_script), $.command_script)),
			),

		feature_script: ($) => $.feature_sequence,
		command_script: ($) => $.command_sequence_top,

		_sep: (_) => token(/(?:[;\n][ \t\r\f]*)+/),

		_cmd_sep: ($) => choice("then", $._sep),

		feature_sequence: ($) =>
			prec.right(
				seq(
					$.feature,
					repeat(
						choice(
							alias($._behavior_on_feature, $.on_feature),
							alias($._behavior_init_feature, $.init_feature),
							seq($._sep, $.feature),
						),
					),
					optional($._sep),
				),
			),

		command_sequence_top: ($) =>
			prec.right(
				seq(
					$.command_statement,
					repeat(seq(repeat1($._cmd_sep), $.command_statement)),
					optional($._cmd_sep),
				),
			),

		feature: ($) =>
			choice(
				$.on_feature,
				$.init_feature,
				$.def_feature,
				$.behavior_feature,
				$.eventsource_feature,
				$.socket_feature,
				$.worker_feature,
			),

		on_feature: ($) =>
			prec.right(
				seq(
					choice("on", alias($._feature_on, "on")),
					field("events", $.event_spec),
					field("body", $.feature_body),
					optional(field("catch", $.catch_block)),
					optional(field("finally", $.finally_block)),
					optional("end"),
				),
			),

		init_feature: ($) =>
			prec.right(
				seq(
					choice("init", alias($._feature_init, "init")),
					optional("immediately"),
					field("body", $.feature_body),
					optional("end"),
				),
			),

		feature_body: ($) => seq(repeat($._cmd_sep), $.command_sequence),

		def_feature: ($) =>
			seq(
				"def",
				field("name", choice($.dotted_identifier, $.identifier)),
				optional(field("params", $.param_list)),
				field("body", $.feature_body),
				optional(field("catch", $.catch_block)),
				optional(field("finally", $.finally_block)),
				"end",
			),

		catch_block: ($) =>
			seq(
				"catch",
				field("error", $.identifier),
				field("body", $.feature_body),
			),

		finally_block: ($) =>
			seq(
				"finally",
				field("body", $.feature_body),
			),

		behavior_feature: ($) =>
			seq(
				"behavior",
				field("name", $.identifier),
				optional(field("params", $.param_list)),
				field("body", $.behavior_body),
				optional($._sep),
				"end",
			),

		behavior_body: ($) =>
			repeat1(
				choice(
					alias($._behavior_on_feature, $.on_feature),
					alias($._behavior_init_feature, $.init_feature),
				),
			),

		_behavior_on_feature: ($) =>
			prec.right(
				seq(
					alias($._feature_on, "on"),
					field("events", $.event_spec),
					field("body", $.feature_body),
					optional(field("catch", $.catch_block)),
					optional(field("finally", $.finally_block)),
					optional("end"),
				),
			),

		_behavior_init_feature: ($) =>
			prec.right(
				seq(
					alias($._feature_init, "init"),
					optional("immediately"),
					field("body", $.feature_body),
					optional("end"),
				),
			),

		eventsource_feature: ($) =>
			seq(
				"eventsource",
				field("name", $.identifier),
				optional(
					seq("from", field("url", choice($.naked_string, $.string, $.identifier))),
				),
				repeat(field("handler", $.event_handler)),
				optional($._sep),
				"end",
			),

		socket_feature: ($) =>
			seq(
				"socket",
				field("name", $.identifier),
				field("url", choice($.naked_string, $.string, $.identifier)),
				optional(
					seq("with", "timeout", field("timeout", $.time_literal)),
				),
				repeat(field("handler", $.event_handler)),
				optional($._sep),
				"end",
			),

		event_handler: ($) =>
			prec.right(
				seq(
					alias($._feature_on, "on"),
					field("event", $.event_name),
					optional(seq("as", field("encoding", $.identifier))),
					field("body", $.feature_body),
					optional("end"),
				),
			),

		worker_feature: ($) =>
			seq(
				"worker",
				field("name", $.identifier),
				optional(field("scripts", $.argument_list)),
				repeat(
					seq(repeat1($._sep), field("member", choice($.def_feature, $.js_command))),
				),
				optional($._sep),
				"end",
			),

		command_sequence: ($) =>
			prec.right(
				seq(
					$.command_statement,
					repeat(seq(repeat1($._cmd_sep), $.command_statement)),
					optional($._cmd_sep),
				),
			),

		command_statement: ($) =>
			prec.right(
				seq(
					choice($.async_command, $.if_statement, $.repeat_statement, $.command),
					optional(seq("unless", field("unless", $.expression))),
				),
			),

		async_command: ($) =>
			seq("async", choice($.if_statement, $.repeat_statement, $.command)),

		event_predicate: ($) =>
			seq(
				"event",
				field("event", $._postfix),
				optional(seq("from", field("source", $.expression))),
			),

		event_spec: ($) =>
			seq(
				field("event", $.event_binding),
				repeat(seq("or", field("event", $.event_binding))),
				optional(
					seq("queue", field("queue", choice("all", "first", "last", "none"))),
				),
			),

		event_binding: ($) =>
			seq(
				optional("every"),
				field("name", $.event_name),
				optional(field("params", $.param_list)),
				optional(field("filter", $.filter_clause)),
				optional(seq("of", field("of", $.dom_literal))),
				optional(field("count", $.count_filter)),
				optional(seq("from", field("source", $.expression))),
				optional(seq("in", field("in", $.expression))),
				optional(field("rate_limit", $.rate_limit)),
				optional(field("having", $.having_clause)),
			),

		event_name: ($) =>
			choice($.dotted_identifier, $.colon_identifier, $.identifier, $.string),

		colon_identifier: ($) =>
			seq($.identifier, repeat1(seq(":", $.identifier))),

		dotted_identifier: ($) =>
			seq($.identifier, repeat1(seq(".", $.identifier))),

		param_list: ($) =>
			seq(
				"(",
				optional(seq($.identifier, repeat(seq(",", $.identifier)))),
				")",
			),

		filter_clause: ($) => seq("[", $.expression, "]"),

		count_filter: ($) =>
			choice(
				$.number,
				seq($.number, "to", $.number),
				seq($.number, "and", "on"),
			),

		rate_limit: ($) =>
			seq(choice("debounced", "throttled"), "at", $.duration),

		having_clause: ($) =>
			seq(
				"having",
				field("property", $.identifier),
				field("value", $.expression),
			),

		if_statement: ($) =>
			prec.right(
				seq(
					"if",
					field("condition", $.expression),
					repeat($._cmd_sep),
					field("consequence", $.command_sequence),
					repeat(field("else_if", $.else_if_clause)),
					optional(field("alternative", $.else_clause)),
					optional("end"),
				),
			),

		else_if_clause: ($) =>
			prec(1,
				seq(
					"else",
					"if",
					field("condition", $.expression),
					repeat($._cmd_sep),
					field("consequence", $.command_sequence),
				),
			),

		else_clause: ($) =>
			seq(
				choice("else", "otherwise"),
				repeat($._cmd_sep),
				field("alternative", $.command_sequence),
			),

		repeat_statement: ($) =>
			choice(
				seq(
					"repeat",
					optional(field("clause", $.repeat_clause)),
					repeat1($._cmd_sep),
					field("body", $.command_sequence),
					"end",
				),
				seq(
					"for",
					field("variable", $.identifier),
					"in",
					field("iterable", $.expression),
					optional(field("index", $.repeat_index)),
					repeat1($._cmd_sep),
					field("body", $.command_sequence),
					"end",
				),
			),

		repeat_clause: ($) =>
			choice(
				seq("forever", optional(field("index", $.repeat_index))),
				seq(
					"while",
					field("condition", choice($.event_predicate, $.expression)),
					optional(field("index", $.repeat_index)),
				),
				seq(
					"until",
					field("condition", choice($.event_predicate, $.expression)),
					optional(field("index", $.repeat_index)),
				),
				seq(
					"for",
					field("variable", $.identifier),
					"in",
					field("iterable", $.expression),
					optional(field("index", $.repeat_index)),
				),
				seq(
					"in",
					field("iterable", $.expression),
					optional(field("index", $.repeat_index)),
				),
				seq(
					field("times", $.number),
					"times",
					optional(field("index", $.repeat_index)),
				),
			),

		repeat_index: ($) => seq("index", field("name", $.identifier)),

		command: ($) =>
			choice(
				$.js_command,
				$.set_command,
				$.put_command,
				$.add_command,
				$.remove_command,
				$.toggle_command,
				$.tell_command,
				$.hide_command,
				$.show_command,
				$.make_command,
				$.call_command,
				$.settle_command,
				$.wait_command,
				$.send_command,
				$.return_command,
				$.throw_command,
				$.halt_command,
				$.break_command,
				$.continue_command,
				$.transition_command,
				$.fetch_command,
				$.log_command,
				$.beep_command,
				$.install_command,
				$.invocation_command,
				$.generic_command,
			),

		beep_command: ($) =>
			seq("beep", token.immediate("!"), optional(field("value", $.expression))),

		install_command: ($) =>
			seq(
				"install",
				field("behavior", choice($.dotted_identifier, $.identifier)),
				optional(field("args", $.named_argument_list)),
			),

		named_argument_list: ($) =>
			seq(
				"(",
				optional(
					seq(
						$.named_argument,
						repeat(seq(",", $.named_argument)),
					),
				),
				")",
			),

		named_argument: ($) =>
			seq(
				field("name", $.identifier),
				":",
				field("value", $.expression),
			),

		js_command: ($) =>
			seq(
				"js",
				optional(field("params", $.param_list)),
				field("body", $.js_body),
				"end",
			),

		set_command: ($) =>
			choice(
				seq(
					"set",
					optional($.scope_modifier),
					field("target", $.expression),
					"to",
					field("value", $.expression),
				),
				seq(
					"set",
					field("value", $.object_literal),
					"on",
					field("target", $.expression),
				),
			),

		scope_modifier: (_) => choice("global", "element", "local"),

		put_command: ($) =>
			prec.right(
				PREC.POSTFIX + 1,
				seq(
					"put",
					field("value", $.expression),
					field("position", choice(
						"into",
						"in",
						"before",
						"after",
						seq("at", optional("the"), "start", "of"),
						seq("at", optional("the"), "end", "of"),
					)),
					field("target", $.expression),
				),
			),

		_dom_list_item: ($) =>
			choice(
				$.class_literal,
				$.id_literal,
				$.attribute_literal,
				$.query_literal,
				$.attribute_query_literal,
				$.style_property,
			),

		add_command: ($) =>
			seq(
				"add",
				field("what", $.expression),
				repeat(field("what", $._dom_list_item)),
				optional(seq("to", field("target", $.expression))),
				optional(seq("where", field("where", $.expression))),
			),

		remove_command: ($) =>
			seq(
				"remove",
				field("what", $.expression),
				repeat(field("what", $._dom_list_item)),
				optional(seq("from", field("target", $.expression))),
			),

		toggle_command: ($) =>
			seq(
				"toggle",
				choice(
					seq("between", field("from", $._compare), "and", field("to", $._compare)),
					field("what", $.expression),
				),
				optional(seq(choice("on", "in"), field("target", $.expression))),
				optional(choice(
					seq("for", field("duration", $.time_literal)),
					seq("until", field("until_event", $.event_name),
						optional(seq("from", field("until_source", $.expression)))),
				)),
			),

		hide_command: ($) => seq("hide", optional($._visibility_command_body)),
		show_command: ($) => seq("show", optional($._visibility_command_body)),

		_visibility_command_body: ($) =>
			choice(
				seq(
					field("target", $.expression),
					optional(seq("in", field("in", $.expression))),
					optional(seq(alias($._show_when, "when"), field("when", $.expression))),
					optional(seq("with", field("strategy", $.expression))),
				),
				seq(
					seq("in", field("in", $.expression)),
					optional(seq(alias($._show_when, "when"), field("when", $.expression))),
					optional(seq("with", field("strategy", $.expression))),
				),
				seq(
					seq(alias($._show_when, "when"), field("when", $.expression)),
					optional(seq("with", field("strategy", $.expression))),
				),
				seq("with", field("strategy", $.expression)),
			),

		make_command: ($) =>
			seq(
				"make",
				optional(choice("a", "an")),
				field("type", choice($.identifier, $.query_literal)),
				optional(
					seq(
						choice("from", "with"),
						field("args", seq($.expression, repeat(seq(",", $.expression)))),
					),
				),
				optional(seq("called", field("name", $.identifier))),
			),

		call_command: ($) => seq(choice("call", "get"), field("fn", $.expression)),

		tell_command: ($) =>
			prec.right(
				seq(
					"tell",
					field("target", $.expression),
					repeat($._cmd_sep),
					field("body", $.command_sequence),
					optional("end"),
				),
			),

		settle_command: (_) => "settle",

		wait_command: ($) =>
			seq(
				"wait",
				choice(
					field("time", $.time_literal),
					seq(
						"for",
						field("event", $.wait_event),
						repeat(seq("or", field("event", $.wait_event))),
						optional(seq("or", field("timeout", $.time_literal))),
					),
				),
			),

		wait_event: ($) =>
			seq(
				optional(choice("a", "an", "the")),
				optional("event"),
				field("name", $.event_name),
				optional(seq("from", field("source", $.expression))),
			),

		send_command: ($) =>
			seq(
				choice("send", "trigger"),
				field("event", $.event_name),
				optional(field("args", $.named_argument_list)),
				optional(
					seq(choice("to", "on"), field("target", $.expression)),
				),
			),

		fetch_command: ($) =>
			seq(
				"fetch",
				field("url", choice($.naked_string, $.string, $.backtick_string)),
				optional(seq("as", optional(choice("a", "an")),
					field("as", choice(
						alias("json", $.identifier),
						alias("Object", $.identifier),
						alias("html", $.identifier),
						alias("response", $.identifier),
						$.identifier,
					)))),
				optional(choice(
					field("options", $.object_literal),
					seq("with", field("options", $.fetch_options)),
				)),
			),

		fetch_options: ($) =>
			seq(
				$.named_argument,
				repeat(seq(",", $.named_argument)),
			),

		log_command: ($) =>
			seq(
				"log",
				optional(
					seq(
						field("value", $.expression),
						repeat(seq(",", field("value", $.expression))),
						optional(seq("with", field("logger", $.expression))),
					),
				),
			),

		return_command: ($) => seq("return", optional($.expression)),
		throw_command: ($) => seq("throw", $.expression),

		halt_command: ($) =>
			seq("halt", optional(choice("a", "an")), optional($.expression)),

		break_command: (_) => "break",
		continue_command: (_) => "continue",

		invocation_command: ($) =>
			prec(
				1,
				seq(
					field("callee", $.identifier),
					field("args", $.argument_list),
					optional(
						seq(
							optional(
								field(
									"prep",
									choice("to", "on", "with", "into", "from", "at"),
								),
							),
							field("receiver", $.expression),
						),
					),
				),
			),

		generic_command: ($) =>
			prec.right(
				-1,
				seq(
					field("name", $.identifier),
					repeat1(field("arg", $._primary_no_parens)),
				),
			),

		_primary_no_parens: ($) =>
			choice(
				$.literal,
				$.special_identifier,
				$.identifier,
				$.dom_literal,
				$._keyword_as_arg,
			),

		_keyword_as_arg: (_) =>
			choice(
				"to", "from", "the", "a", "an", "of", "on", "in", "at", "with",
				"into", "before", "after", "as", "for",

				"match",
			),

		transition_command: ($) =>
			seq(
				"transition",
				optional(field("target", choice("my", "its", "the"))),
				choice(
					$.transition_inline,
					seq($._sep, field("body", $.transition_block)),
				),
			),

		transition_inline: ($) =>
			seq(
				field("property", $.style_property_name),
				optional(seq("from", field("from", $.expression))),
				"to",
				field("to", $.expression),
				optional(
					choice(
						seq("over", field("duration", $.expression)),
						seq("using", field("using", $.expression)),
					),
				),
			),

		transition_block: ($) =>
			seq(
				field("property", $.style_property_name),
				$._sep,
				optional(seq("from", field("from", $.expression), $._sep)),
				"to",
				field("to", $.expression),
				optional(
					choice(
						seq(alias($._transition_over, "over"), field("duration", $.expression)),
						seq(alias($._transition_using, "using"), field("using", $.expression)),
					),
				),
			),

		style_property_name: ($) => choice($.style_property, $.identifier),
		style_property: (_) => token(seq("*", /[A-Za-z_-][A-Za-z0-9_-]*/)),

		expression: ($) => $._logical,

		_logical: ($) => choice($.logical_expression, $._compare),

		logical_expression: ($) =>
			prec.left(
				PREC.OR,
				seq($._compare, field("operator", choice("or", "and")), $._compare),
			),

		_compare: ($) => choice($.comparison_expression, $.not_exists_expression, $._math),

		comparison_expression: ($) =>
			prec.left(
				PREC.COMPARE,
				seq(
					$._math,
					field("operator", $.comparison_operator),
					$._math,
				),
			),

		comparison_operator: ($) =>
			prec.right(
				choice(
					"==",
					"!=",
					"===",
					alias($._lt, "<"),
					alias($._lte, "<="),
					">",
					">=",
					prec(2, seq("is", "greater", "than", "or", "equal", "to")),
					prec(2, seq("is", "less", "than", "or", "equal", "to")),
					prec(1, seq("is", "greater", "than")),
					prec(1, seq("is", "less", "than")),
					prec(1, seq("is", "equal", "to")),
					prec(1, seq("is", "not", "equal", "to")),
					prec(1, seq("is", "really", "equal", "to")),
					prec(1, seq("is", "not", "really", "equal", "to")),
					prec(1, seq("is", choice("a", "an"))),
					prec(1, seq("is", "not", choice("a", "an"))),
					prec(1, seq("is", "in")),
					seq("is", optional("not")),
					seq("am", optional("not")),
					"equals",
					seq("really", "equals"),
					"matches",
					"match",
					"contains",
					"contain",
					"includes",
					seq(choice("do", "does"), "not", choice("match", "contain", "include")),
				),
			),

		not_exists_expression: ($) =>
			prec.left(
				PREC.COMPARE,
				seq($._math, choice("does", "do"), "not", "exist"),
			),

		_math: ($) => choice($.math_expression, $._unary),

		math_expression: ($) =>
			prec.left(
				PREC.MATH,
				seq($._math, field("operator", choice("+", "-", "*", "/", "mod")), $._unary),
			),

		_unary: ($) => choice($.unary_expression, $.block_literal, $._of),

		unary_expression: ($) =>
			choice(
				prec(PREC.UNARY, seq(field("operator", "beep"), token.immediate("!"), $._unary)),
				prec(PREC.UNARY, seq(field("operator", choice("not", "no", "!", "-", "+", "async")), $._unary)),
			),

		_of: ($) => choice($.of_expression, $._postfix),

		of_expression: ($) =>
			prec.left(
				PREC.POSTFIX,
				seq(field("property", $._postfix), "of", field("owner", $._postfix)),
			),

		_postfix: ($) =>
			prec.left(
				PREC.POSTFIX,
				seq(
					$._primary,
					repeat(
						choice(
							$.member_access,
							$.attr_access,
							$.index_access,
							field("args", $.argument_list),
							$.as_expression,
							$.in_expression,
							$.exists_expression,
							$.possessive_access,
						),
					),
				),
			),

		member_access: ($) =>
			prec.left(PREC.MEMBER, seq(token.immediate("."), field("property", $.identifier))),

		attr_access: ($) =>
			prec.left(PREC.MEMBER, seq("@", field("attribute", $.attribute_name))),

		index_access: ($) =>
			prec.left(
				PREC.MEMBER,
				seq(token.immediate("["), field("index", $.expression), "]"),
			),

		as_expression: ($) =>
			prec.left(PREC.MEMBER, seq("as", optional(choice("a", "an")), field("type", $.identifier))),

		in_expression: ($) =>
			prec.left(PREC.MEMBER, seq("in", field("context", $._primary))),

		exists_expression: (_) => prec.left(PREC.MEMBER, "exists"),

		possessive_access: ($) =>
			prec.left(
				PREC.MEMBER,
				seq(
					alias($._possessive_s, "'s"),
					choice(
						field("property", $.identifier),
						seq("@", field("attribute", $.attribute_name)),
						seq("attribute", field("attribute", $.string_like)),
					),
				),
			),

		_primary: ($) =>
			choice(
				$.literal,
				$.special_identifier,
				$.identifier,
				$.dom_literal,
				$.pronoun_possessive_primary,
				$.parenthesized_expression,
				$.the_expression,
				$.closest_expression,
				$.positional_expression,
				$.object_literal,
				$.array_literal,
			),

		parenthesized_expression: ($) => seq("(", $.expression, ")"),

		the_expression: ($) =>
			seq(
				"the",
				choice(
					$.closest_expression,
					$.positional_expression,
					prec.right(seq(
						field("modifier", choice("next", "previous")),
						field("value", choice($.identifier, $.special_identifier, $.dom_literal)),
						optional(seq("from", field("from", $.expression))),
						optional(seq("within", field("within", $.expression))),
						optional(seq("with", "wrapping")),
					)),
					field("value", $.parenthesized_expression),
					field(
						"value",
						choice($.identifier, $.special_identifier, $.dom_literal),
					),
				),
			),

		closest_expression: ($) =>
			seq(
				"closest",
				optional("parent"),
				field("value", $.dom_literal),
			),

		positional_expression: ($) =>
			seq(
				choice("first", "last", "random"),
				choice(
					alias($._positional_in, $.in_expression),
					seq(
						optional(choice("of", "from")),
						choice($.identifier, $.special_identifier, $.dom_literal),
					),
				),
			),

		_positional_in: ($) =>
			seq("in", choice($.identifier, $.special_identifier, $.dom_literal)),

		pronoun_possessive_primary: ($) =>
			prec.right(
				seq(
					field("pronoun", choice("my", "its", "your")),
					choice(
						seq(
							field("property", choice($.identifier, $.style_property)),
							repeat(seq(token.immediate("."), field("property", $.identifier))),
						),
						seq(
							token.immediate("."),
							field("property", $.identifier),
							repeat(seq(token.immediate("."), field("property", $.identifier))),
						),
					),
				),
			),

		block_literal: ($) =>
			seq(
				"\\",
				optional(
					seq(
						field("param", $.identifier),
						repeat(seq(",", field("param", $.identifier))),
					),
				),
				"->",
				field("body", $.expression),
			),

		argument_list: ($) =>
			seq(
				"(",
				optional(seq($.expression, repeat(seq(",", $.expression)))),
				")",
			),

		object_literal: ($) =>
			seq(
				"{",
				optional(
					seq($.object_pair, repeat(seq(",", $.object_pair)), optional(",")),
				),
				"}",
			),

		object_pair: ($) =>
			seq(
				field("key", choice($.identifier, $.hyphenated_identifier, $.string, $.computed_key)),
				":",
				field("value", $.expression),
			),

		hyphenated_identifier: (_) =>
			token(seq(/[A-Za-z_]/, repeat(/[A-Za-z0-9_]/), repeat1(seq("-", repeat1(/[A-Za-z0-9_]/))))),

		computed_key: ($) => seq("[", $.expression, "]"),

		array_literal: ($) =>
			seq(
				"[",
				optional(
					seq($.expression, repeat(seq(",", $.expression)), optional(",")),
				),
				"]",
			),

		dom_literal: ($) =>
			choice(
				$.class_literal,
				$.id_literal,
				$.query_literal,
				$.attribute_literal,
				$.attribute_query_literal,
				$.style_property,
				$.templated_id_literal,
				$.templated_class_literal,
			),

		id_literal: (_) => token(seq("#", /[A-Za-z_][A-Za-z0-9_-]*/)),

		templated_id_literal: ($) =>
			seq(token(prec(1, "#{")), field("value", $.expression), "}"),

		templated_class_literal: ($) =>
			seq(token(prec(1, ".{")), field("value", $.expression), "}"),

		attribute_name: (_) => /[A-Za-z_][A-Za-z0-9_-]*/,

		attribute_literal: (_) => token(seq("@", /[A-Za-z_][A-Za-z0-9_-]*/)),

		attribute_query_literal: ($) =>
			seq(
				$._attr_query_open,
				field("name", $.attribute_name),
				optional(
					seq(
						choice("=", "==", "!=", "is", seq("is", "not")),
						field("value", $.expression),
					),
				),
				"]",
			),

		identifier: (_) => token(prec(-1, /[A-Za-z_:$][A-Za-z0-9_$]*/)),

		special_identifier: (_) =>
			choice("it", "result", "me", "you", "yourself", "I", "event"),

		time_literal: ($) => choice($.duration, $.number),

		literal: ($) =>
			choice(
				$.duration,
				$.css_measurement,
				$.number,
				$.string,
				$.backtick_string,
				$.boolean,
				$.null,
				$.empty_value,
				$.naked_string,
			),

		duration: ($) => choice(
			token(/\d+(?:\.\d+)?(?:ms|s)/),
			seq($.number, choice("milliseconds", "seconds")),
		),
		css_measurement: (_) => token(/\d+(?:\.\d+)?(?:px|em|rem|vh|vw|pt|cm|mm|ch|ex|%)/),
		number: (_) => token(choice(/\d+\.\d+/, /\d+/)),

		string: ($) =>
			choice(
				token(seq('"', repeat(choice(/[^"\\\n]/, /\\./)), '"')),
				$._single_string,
			),

		backtick_string: ($) =>
			seq(
				"`",
				repeat(
					choice(
						$._template_chars,
						$.template_substitution,
					),
				),
				"`",
			),

		template_substitution: ($) =>
			seq(alias("${", $.interpolation_start), $.expression, alias("}", $.interpolation_end)),

		naked_string: (_) =>
			token(choice(/\/[^\s)]+/, /(?:https?|wss?):\/\/[^\s)]+/)),

		string_like: ($) =>
			choice($.string, $.backtick_string, $.naked_string, $.identifier),

		boolean: (_) => choice("true", "false"),
		null: (_) => "null",
		empty_value: (_) => "empty",

		comment: (_) => token(seq("--", /[^\n]*/)),
	},
});
