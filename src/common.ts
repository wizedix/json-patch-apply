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

export function hasKey<T extends object>(obj: T, k: keyof any): k is keyof T {
    return k in obj;
}

export function getValue<T extends Object>(obj: T, key: PropertyKey): any {
    return hasKey(obj, key) ? obj[key] : undefined;
}

export function firstElement<T extends Object>(ops: T[]): T {
    let first = ops.shift();
    if(first == undefined) {
        throw new Error("cannot get first of empty list");
    }
    return first;
}

export function getValueType(target: any): ValueType {
    let type = ValueType.primitive;
    if(target instanceof Array) {
        type = ValueType.array;
    } else if(target instanceof Object) {
        type = ValueType.object;
    }
    return type;
}

export enum ValueType {
    primitive,
    array,
    object
}

export type Primitive = string | number | boolean;

export interface PatchOperation extends PatchOptional {
    op: string,
    path: string
}

export interface PatchOptional {
    value?: any,
    old?: any,
    type?: ValueType
    from?: string
}

export interface ObjectKeys {
    source: PropertyKey[]
    target: PropertyKey[]
    both: PropertyKey[]
}