export interface IJSXServeHandlerObject {
    file: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    handler: Function;
    args: string[];
    path: string[];
}