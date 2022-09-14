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

export function getValueType(value: any): ValueType {
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

export enum ValueType {
    undefined,
    null,
    primitive,
    array,
    object
}

export interface PatchOperation extends PatchOptional {
    op: string,
    path: string
}

export interface PatchOptional {
    value?: any,
    from?: string
}

/**
 * when old is missing and new is not it is an add,
 * when new is missing and old is not it is a remove,
 * when both old and new are present it is a replacement
 * no valid change will have both old and new missing
 */
export interface Change {
    old?: ChangeValue,
    new?: ChangeValue
}

export interface ChangeValue {
    path: string,
    value: any
}

export enum DiffFlags {
    /**
     * By default, the path for adding to the end of an array is /- when this flag is present
     * we would return the actual index for example /2 or whatever if the size of the array were 2.
     * For example:
     *
     * let diff = Patch.diff([], [1]);
     *
     * will produce [{op:"add",path:"/-",value:1}];
     *
     * let diff = Patch.diff([], [1], [DiffFlags.ARRAY_INDEX_LITERAL]);
     *
     * will produce [{op:"add",path:"/0",value:1}];
     */
    ARRAY_INDEX_LITERAL,

    /**
     * Normally diff will generate an add for replacement of existing null value, when this flag is passed
     * then in such cases replace will be used instead.
     *
     * For example:
     *
     * let diff = Patch.diff({a:null}, {a:123});
     *
     * will produce [{op:"add",path:"/a",value:"123"}];
     * "add" is used since we consider a null value the same as the property not being set.
     *
     * let diff = Patch.diff({a:null}, {a:123}, [DiffFlags.USE_REPLACE_FOR_NULL]);
     *
     * will produce [{op:"replace",path:"/a",value:"123"}]
     *
     * In this case we treat the presence of the null as similar to the presence of any value and use replace instead.
     */
    USE_REPLACE_FOR_NULL,

    /**
     * Normally when the root is not empty and it is being replaced we would use replace as the operation.  For
     * example:
     *
     * let diff = Patch.diff({"foo":"bar"}, {"baz":"qux"});
     *
     * will produce [{"op":"replace","path":"","value":{"baz":"qux"}}]
     * which makes sense because the entire value is being replace and it was previously not empty.
     *
     * If this flag is passed for example:
     *
     * let diff = Patch.diff({"foo":"bar"}, {"baz":"qux"}, [DiffFlags.USE_ADD_FOR_REPLACE_OF_ROOT]);
     *
     * will produce [{"op":"add","path":"","value":{"baz":"qux"}}]
     *
     * generally this is not recommended but can be useful if you need to match a diff generated from another library
     * which favors add over replace.
     */
    USE_ADD_FOR_REPLACE_OF_ROOT,
}

export enum PatchFlags {

}