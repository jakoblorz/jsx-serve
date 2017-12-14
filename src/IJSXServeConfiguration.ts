import { IJSXServeHandlerConfiguration } from "./IJSXServeHandlerConfiguration";

export interface IJSXServeConfiguration {
    defaults: {
        host: string;
        port: number;
        mode: "strict" | "unstrict";
    };

    handlers: IJSXServeHandlerConfiguration[];
}