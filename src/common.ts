import * as pointer from "json-pointer";
import {
    DiffFlags,
    ValueType
} from "./types";

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

export class PatchDiff {

    public hasKey<T extends object>(obj: T, k: keyof any): k is keyof T {
        return k in obj;
    }

    public getParentPath(path: string): string {
        let segments = pointer.parse(path);
        segments.splice(segments.length - 1, 1);
        return pointer.compile(segments);
    }

    public getKey(path: string): PropertyKey {
        let idx = path.lastIndexOf("/");
        let key: any = path;
        if(idx >= 0) {
            key = path.substr(idx + 1);
        }
        return pointer.unescape(key);
    }

    protected deepCopy(source: any): any {
        return source===undefined ? undefined : JSON.parse(JSON.stringify(source));
    }
}

export class DiffBase extends PatchDiff {

    /**
     * Returns true of the given optional set of flags has the given flag.
     */
    protected hasFlag(flag: DiffFlags, flags?: DiffFlags[]): boolean {
        return flags instanceof Array && flags.includes(flag);
    }

    getValueType(value: any): ValueType {
        let type;
        if(value === null) {
            type = ValueType.null;
        } else if (value === undefined) {
            type = ValueType.undefined;
        } else if(value instanceof Array) {
            type = ValueType.array;
        } else if(value instanceof Object) {
            type = ValueType.object;
        } else {
            type = ValueType.primitive;
        }
        return type;
    }
}