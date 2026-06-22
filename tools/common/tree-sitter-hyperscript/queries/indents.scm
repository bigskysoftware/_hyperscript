(on_feature) @indent.begin
(init_feature) @indent.begin
(def_feature) @indent.begin
(behavior_feature) @indent.begin
(eventsource_feature) @indent.begin
(socket_feature) @indent.begin
(worker_feature) @indent.begin

(event_handler) @indent.begin

(if_statement) @indent.begin
(repeat_statement) @indent.begin

(else_if_clause) @indent.branch
(else_clause) @indent.branch
(catch_block) @indent.branch
(finally_block) @indent.branch

(js_command) @indent.begin

"end" @indent.branch @indent.end
