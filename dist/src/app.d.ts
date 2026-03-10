import express from "express";
declare class App {
    expressApp: express.Express;
    port: number;
    constructor();
    run(): Promise<void>;
}
declare const app: App;
export default app;
