import { IJSXServeHandlerConfiguration } from "./IJSXServeHandlerConfiguration";

export interface IJSXServeConfiguration {
    defaults: {
        host: string;
        port: string;
        mode: "strict" | "unstrict";
    };

    handlers: IJSXServeHandlerConfiguration[];
}