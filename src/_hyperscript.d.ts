
interface ASTNode {
    isFeature?: boolean;
    type?: string;
    args?: any[];
    op?: (this: ASTNode, ctx:Context, root:any, ...args:any) => any;
    evaluate?: (this: ASTNode, context?:Context) => any;
    parent?: ASTNode;
    children?: Set<ASTNode>;
    root?: ASTNode;
    keyword?: String;
    endToken?: Token;
    next?: ASTNode;
    resolveNext?: (context:Context) => ASTNode;
    eventSource?: EventSource;
    install?: (this: ASTNode) => void;
    execute?: (this: ASTNode, context:Context) => void;
    apply?: (this: ASTNode, target: object, source: object, args?: Object) => void;
    [expando: string]: any
}
