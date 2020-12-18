import {randomBytes} from 'crypto'

export namespace Utils {
    export function generateUUID(): string {
        return randomBytes(16).toString('hex')
    }

    export function convertSecondsToTimeString(totalSeconds: number): string {
        const date = new Date(0)
        date.setSeconds(totalSeconds)
        return date.toISOString().substr(11, 8)
    }

    export function isLowercaseString(input: string): boolean {
        return input === input.toLowerCase()
    }

    export function truncate(input: string, maxLength: number): string {
        return (input.length > maxLength) ? input.substr(0, maxLength - 1) + ' ...' : input;
    }

    export function randomlySelectNElementsInArray(arr: any[], n: number): any[] {
        let result = new Array(n),
            len = arr.length,
            taken = new Array(len)
        if (n > len)
            throw new RangeError("More elements taken than available");
        while (n--) {
            let x = Math.floor(Math.random() * len)
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    export function shuffleArray(arr: any[]) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    export function getAllNestedKeysOfObject(obj: object) {
        const isObject = (val: any) => typeof val === 'object' && !Array.isArray(val)
        const addDelimiter = (a: any, b: any) => a ? `${a}.${b}` : b
        const paths = (obj: object = {}, head: string = ''): any => {
            return Object.entries(obj).reduce((product, [key, value]) => {
                let fullPath = addDelimiter(head, key)
                return isObject(value) ? product.concat(paths(value, fullPath)) : product.concat(fullPath)}, [])
        }
        return paths(obj);
    }

    export function dynamicallySetObjectKeyValue(obj: any, key: any, value: any): any {
        if (typeof key == 'string')
            return dynamicallySetObjectKeyValue(obj,key.split('.'), value);
        else if (key.length == 1 && value !== undefined)
            return obj[key[0]] = value;
        else if (key.length==0)
            return obj;
        else
            return dynamicallySetObjectKeyValue(obj[key[0]],key.slice(1), value);
    }

    export function roughSizeOfObject( object: any): number {
        const objectList = []
        const stack = [object]
        let bytes = 0

        while ( stack.length ) {
            const value = stack.pop()

            if ( typeof value === 'boolean' ) {
                bytes += 4;
            }
            else if ( typeof value === 'string' ) {
                bytes += value.length * 2;
            }
            else if ( typeof value === 'number' ) {
                bytes += 8;
            }
            else if
            (
                typeof value === 'object'
                && objectList.indexOf( value ) === -1
            )
            {
                objectList.push( value );

                for(let i in value ) {
                    stack.push( value[ i ] );
                }
            }
        }
        return bytes;
    }
}
