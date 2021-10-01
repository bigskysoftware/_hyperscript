declare namespace _hyperscript {
  function addFeature(keyword: string, definition: GrammarDefinition): any;

  function addCommand(keyword: string, definition: GrammarDefinition): any;

  function addLeafExpression(
    keyword: string,
    definition: GrammarDefinition
  ): any;

  function addIndirectExpression(
    keyword: string,
    definition: GrammarDefinition
  ): any;

  function evaluate(str: string, ctx: Context): any;

  function parse(str: string): any;

  function processNode(elt: HTMLElement): void;

  let internals: HyperscriptInternalsObject;

  let config: HyperscriptConfigObject;
}

interface _GrammarElement {
  type?: string;
  args?: any[];
  op?: (ctx:Context, root:any, ...args:any) => any;
  evaluate?: (context?:Context) => any;
  parent?: GrammarElement;
  root?: GrammarElement;
  keyword?: String;
  endToken?: Token;
  next?: GrammarElement;
  resolveNext?: (context:Context) => GrammarElement;
  eventSource?: EventSource;
  install?: () => void;
  execute?: (context:Context) => void;
  apply?: (target: Element, source: Element) => void;
  [others: string]: any;
}

interface _ConversionMap {
  dynamicResolvers: DynamicConversionFunction[];
}

interface _Context {
  meta: ContextMetaData;
  me: Element;
  event:Event;
  target: Element;
  detail: any;
  body: HTMLElement;
  beingTold?: Element;
  [others: string]: any;
}

interface _ContextMetaData {
  parser: ParserObject;
  lexer: LexerObject;
  runtime: RuntimeObject;
  owner: any;
  feature: GrammarElement;
  iterators: any;
  ctx?: Context;
  command?: GrammarElement;
  [others: string]: any;
}
