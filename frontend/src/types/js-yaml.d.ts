declare module 'js-yaml' {
    export function load(input: string, options?: any): any;
    export function dump(obj: any, options?: any): string;
    export function loadAll(input: string, iterator?: (doc: any) => void, options?: any): any[];
}
