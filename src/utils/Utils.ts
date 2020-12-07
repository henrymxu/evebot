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