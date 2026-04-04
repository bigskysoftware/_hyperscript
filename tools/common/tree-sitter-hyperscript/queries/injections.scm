; Inject hyperscript into HTML attributes: _="...", hs="...", data-hs="..."
; This file is used by editors (Neovim, Helix, Zed) that support Tree-sitter injections.
; The actual injection configuration depends on the HTML tree-sitter grammar.

; For use with tree-sitter-html, add to your html injections.scm:
; ((attribute
;   (attribute_name) @_attr
;   (quoted_attribute_value (attribute_value) @injection.content))
;  (#any-of? @_attr "_" "hs" "data-hs")
;  (#set! injection.language "hyperscript"))
;
; ((script_element
;   (start_tag (attribute
;     (attribute_name) @_type
;     (quoted_attribute_value (attribute_value) @_val))
;   (#eq? @_type "type")
;   (#eq? @_val "text/hyperscript"))
;   (raw_text) @injection.content)
;  (#set! injection.language "hyperscript"))
