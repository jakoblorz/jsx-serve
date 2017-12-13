
export interface IJSXServeHandlerConfiguration {
    file: string;
    alias?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
}

export interface IJSXServeHandlerObject {
    file: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    handler: Function;
    args: string[];
    path: string[];
}

export interface IJSXServeConfiguration {
    defaults: {
        host: string;
        port: string;
        mode: "strict" | "unstrict";
    };

    handlers: IJSXServeHandlerConfiguration[];
}