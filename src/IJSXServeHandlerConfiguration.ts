export interface IJSXServeHandlerConfiguration {
    file: string;
    alias?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
}