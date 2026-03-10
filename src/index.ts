import "reflect-metadata";
import { argv, exit } from 'node:process';

import Cli from './cli';

async function main(): Promise<void> {
    const args: string[] = argv.slice(2);
    const success: boolean = await Cli.Run(args);
    if (!success) {
        console.error('Failed to start backend. Exiting.');
        exit(1);
    }
}

main().catch((err: unknown) => {
    if (err instanceof Error) {
        console.error('Unexpected error:', err.stack ?? err.message);
    } else {
        console.error('Unexpected error:', err);
    }
    exit(1);
});