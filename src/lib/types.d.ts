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
