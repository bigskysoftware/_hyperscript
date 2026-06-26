(comment) @comment

(toggle_command "on" @keyword.operator)
(send_command "on" @keyword.operator)
(invocation_command "on" @keyword.operator)

(toggle_command "for" @keyword.operator)

(repeat_statement "in" @keyword.repeat)
(repeat_clause "in" @keyword.repeat)

"on" @keyword
"init" @keyword
"def" @keyword.function
"behavior" @keyword
"eventsource" @keyword
"socket" @keyword
"worker" @keyword
"end" @keyword

(def_feature
  name: (identifier) @function)
(def_feature
  name: (dotted_identifier) @function)
(behavior_feature
  name: (identifier) @type)
(eventsource_feature
  name: (identifier) @type)
(socket_feature
  name: (identifier) @type)
(worker_feature
  name: (identifier) @type)
(install_command
  behavior: (identifier) @type)
(install_command
  behavior: (dotted_identifier) @type)
(make_command
  type: (identifier) @type)

"set" @keyword
"put" @keyword
"add" @keyword
"remove" @keyword
"toggle" @keyword
"call" @keyword
"get" @keyword
"send" @keyword
"trigger" @keyword
"fetch" @keyword
"log" @keyword
"install" @keyword
"hide" @keyword
"show" @keyword
"make" @keyword
"tell" @keyword
"transition" @keyword
"halt" @keyword
"wait" @keyword
"js" @keyword
"beep" @keyword
"async" @keyword
(settle_command) @keyword
(break_command) @keyword
(continue_command) @keyword

(generic_command
  name: (identifier) @keyword)

"if" @keyword.conditional
"else" @keyword.conditional
"otherwise" @keyword.conditional
"then" @keyword.conditional
"unless" @keyword.conditional
"when" @keyword.conditional

"repeat" @keyword.repeat
"for" @keyword.repeat
"while" @keyword.repeat
"until" @keyword.repeat
"forever" @keyword.repeat
"times" @keyword.repeat

"return" @keyword.return
"throw" @keyword.exception
"catch" @keyword.exception
"finally" @keyword

"and" @keyword.operator
"or" @keyword.operator
"not" @keyword.operator
"no" @keyword.operator
"is" @keyword.operator
"am" @keyword.operator
"match" @keyword.operator
"matches" @keyword.operator
"contain" @keyword.operator
"contains" @keyword.operator
"includes" @keyword.operator
"equals" @keyword.operator
"really" @keyword.operator
"do" @keyword.operator
"does" @keyword.operator
"mod" @keyword.operator
"greater" @keyword.operator
"less" @keyword.operator
"than" @keyword.operator
"equal" @keyword.operator
(exists_expression) @keyword.operator

"+" @operator
"-" @operator
"*" @operator
"/" @operator
"=" @operator
"==" @operator
"!=" @operator
"<" @operator
"<=" @operator
">" @operator
">=" @operator
"!" @operator

"to" @keyword.operator
"from" @keyword.operator
"into" @keyword.operator
(put_command "in" @keyword.operator)
"before" @keyword.operator
"after" @keyword.operator
"at" @keyword.operator
"in" @keyword.operator
"of" @keyword.operator
"with" @keyword.operator
"between" @keyword.operator
"over" @keyword.operator
"using" @keyword.operator
"as" @keyword.operator
"start" @keyword.operator

"a" @keyword
"an" @keyword

"every" @keyword
"queue" @keyword
"debounced" @keyword
"throttled" @keyword
"having" @keyword

"immediately" @keyword
"index" @keyword
"timeout" @keyword
"all" @keyword
"none" @keyword

"global" @keyword
"element" @keyword
"local" @keyword

(fetch_command
  as: (identifier) @type)

(as_expression
  type: (identifier) @type)
(event_handler
  encoding: (identifier) @type)

(special_identifier) @variable.builtin

(pronoun_possessive_primary
  pronoun: _ @variable.builtin)
"the" @keyword
"closest" @keyword
"parent" @keyword
"first" @keyword
"last" @keyword
"next" @keyword
"previous" @keyword

(number) @number
(duration) @number
(css_measurement) @number
(boolean) @boolean
(null) @constant.builtin
(empty_value) @constant.builtin
(string) @string
(backtick_string) @string
(interpolation_start) @punctuation.special
(interpolation_end) @punctuation.special
(naked_string) @string.special

(class_literal) @tag
(id_literal) @tag
(query_literal) @tag
(attribute_literal) @attribute
(style_property) @property
(templated_id_literal) @tag
(templated_class_literal) @tag
(attribute_query_literal
  name: (attribute_name) @attribute)

(js_body) @string.special

(named_argument
  name: (identifier) @property)
(object_pair
  key: (identifier) @property)
(object_pair
  key: (hyphenated_identifier) @property)
(member_access
  property: (identifier) @property)
(attr_access
  attribute: (attribute_name) @attribute)
(possessive_access
  property: (identifier) @property)
(possessive_access
  "attribute" @keyword)
(of_expression
  property: (the_expression
    value: (identifier) @property))
(of_expression
  property: (identifier) @property)

(event_binding
  name: (event_name) @string.special)
(event_handler
  event: (event_name) @string.special)

(param_list
  (identifier) @variable.parameter)

(expression
  (identifier) @function.call
  (argument_list))
(invocation_command
  callee: (identifier) @function.call)

"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket

"," @punctuation.delimiter
"." @punctuation.delimiter
":" @punctuation.delimiter
"@" @punctuation.delimiter
"'s" @punctuation.delimiter
"\\" @punctuation.delimiter
"->" @punctuation.delimiter
