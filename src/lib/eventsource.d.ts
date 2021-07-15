interface EventSourceFeature {
    name: string
    object: EventSourceStub
    install: () => void
}

interface EventSourceStub {
    eventSource: EventSource
    listeners: EventListenerEntry[]
    retryCount: number
    open: (url?:string) => void
    close: () => void
    addEventListener: (type: keyof HTMLElementEventMap, listener:(event: Event) => any, options?: boolean | AddEventListenerOptions) => void
}

interface EventListenerEntry {
    type: string
    handler: EventHandlerNonNull
    options?: any
}
