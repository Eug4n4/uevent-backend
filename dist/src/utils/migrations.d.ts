declare class Migrator {
    private dataSource;
    constructor();
    up(): Promise<void>;
    down(): Promise<void>;
}
declare const migrator: Migrator;
export default migrator;
