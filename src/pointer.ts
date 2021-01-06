/**
 This file is part of json-patch-apply.

 json-patch-apply is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 json-patch-apply is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with json-patch-apply.  If not, see <https://www.gnu.org/licenses/>.
 */

import {hasKey} from "./common";

export interface FindResult {
    source: any
    parent: any
    key: PropertyKey
}

export class JsonPointer {
    static encode(key: string) {
        return key
            .replace(/\~/, '~0')
            .replace(/\//, '~1');
    }

    static decode(key: string | undefined) {
        return key == undefined ? undefined : key
            .replace(/\~1/, '/')
            .replace(/\~0/, '~');
    }

    static findParent(source: any, path: string): FindResult | undefined {
        let parts = this.getParts(path);
        let current: any = source;
        let last = this.decode(parts.pop());

        parts.forEach(part => {
            if(current !== undefined && hasKey(current, part)) {
                current = current[part];
            } else {
                current = undefined;
            }
        });

        if(current || current == source) {
            return {
                source: source,
                parent: current,
                key: last || ""
            };
        }
    }

    private static getParts(path: string): string[] {
        let parts = path.split(/\//);
        if(parts[0] != "")
            throw new Error("Invalid JSON Pointer syntax.  Path should always begin with a /");
        parts.shift();
        return parts;
    }
}