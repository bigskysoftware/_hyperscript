
interface ASTNode {
    isFeature?: boolean;
    type?: string;
    args?: any[];
    op?: (this: _GrammarElement, ctx:Context, root:any, ...args:any) => any;
    evaluate?: (this: _GrammarElement, context?:Context) => any;
    parent?: GrammarElement;
    children?: Set<_GrammarElement>;
    root?: GrammarElement;
    keyword?: String;
    endToken?: Token;
    next?: GrammarElement;
    resolveNext?: (context:Context) => GrammarElement;
    eventSource?: EventSource;
    install?: (this: _GrammarElement) => void;
    execute?: (this: _GrammarElement, context:Context) => void;
    apply?: (this: _GrammarElement, target: object, source: object, args?: Object) => void;
    [expando: string]: any
}
