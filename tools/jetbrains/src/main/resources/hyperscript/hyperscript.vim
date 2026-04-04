" Vim syntax file for _hyperscript
" Language: Hyperscript
" Maintainer: hyperscript.org

if exists("b:current_syntax")
  finish
endif

syn case match

" Comments
syn match hsComment "--.*$"
syn region hsComment start="/\*" end="\*/"

" Strings
syn region hsString start=+"+ end=+"+ skip=+\\"+
syn region hsString start=+'+ end=+'+ skip=+\\'+
syn region hsString start=+`+ end=+`+ contains=hsInterp
syn match hsInterp "\$\w\+" contained
syn match hsInterp "\${[^}]*}" contained

" Numbers
syn match hsNumber "\<\d\+\(\.\d\+\)\?\(ms\|s\|milliseconds\|seconds\)\?\>"

" Booleans
syn keyword hsBoolean true false null

" Keywords (commands and features)
syn keyword hsKeyword on def js worker eventsource socket init behavior install catch
syn keyword hsKeyword add async call get hide measure if else log put remove
syn keyword hsKeyword repeat return send settle set show take throw toggle
syn keyword hsKeyword transition trigger wait fetch tell go make then end
syn keyword hsKeyword while until for break continue exit halt default
syn keyword hsKeyword increment decrement append focus blur swap morph
syn keyword hsKeyword open close render pick empty answer ask speak select scroll beep

" Modifiers
syn keyword hsModifier from in to with over into before after at is am as
syn keyword hsModifier and or not no of the closest first last next previous
syn keyword hsModifier random when where unless between forever every queue
syn keyword hsModifier debounced throttled elsewhere called its my me it I
syn keyword hsModifier result you your yourself

" Built-in types
syn keyword hsType String Number Int Float Date Array HTML Fragment JSON Object Values Boolean Fixed

" CSS references
syn match hsCssClass "\s\.\w[a-zA-Z0-9_\-$]*"
syn match hsCssId "#\w[a-zA-Z0-9_\-$]*"
syn match hsCssSelector "<[a-zA-Z][^>]*/>"
syn match hsAttributeRef "@\w[a-zA-Z0-9_\-]*"

" Operators
syn match hsOperator "[+\-*/%=<>!|\\~^]"
syn match hsOperator "->"
syn match hsOperator "\.\."

" Highlighting
hi def link hsComment Comment
hi def link hsString String
hi def link hsInterp Special
hi def link hsNumber Number
hi def link hsBoolean Boolean
hi def link hsKeyword Keyword
hi def link hsModifier Type
hi def link hsType Type
hi def link hsCssClass Identifier
hi def link hsCssId Identifier
hi def link hsCssSelector Tag
hi def link hsAttributeRef Identifier
hi def link hsOperator Operator

let b:current_syntax = "hyperscript"
