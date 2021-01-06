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

import {
    firstElement, getValue, getValueType, hasKey, ObjectKeys, PatchOperation, PatchOptional, Primitive, ValueType
} from "./common";

export class PatchDiff {

    diff(source: any, target: any): PatchOperation[] {
        return this.diffAny(source, target, "");
    }

    private createOperation(op: string, path: string, optional: PatchOptional): PatchOperation {
        let operation: PatchOperation = {
            op: op,
            path: path
        };
        Object.keys(optional).forEach(key => {
            if(hasKey(optional, key) && optional[key] != undefined)
                operation[key] = optional[key];
        });
        return operation;
    }

    private diffAny(source: any, target: any, path: string): PatchOperation[] {
        let diff: PatchOperation[] = [];
        if(source == undefined) {
            diff.push(...this.add(target, path));
        } else if(target instanceof Object) {
            diff.push(...this.diffObject(source, target, path));
        } else {
            diff.push(...this.diffPrimitive(source, target, path));
        }
        return diff;
    }

    private diffObject<T extends object>(source: any, target: T, path: string): PatchOperation[] {
        let diff: PatchOperation[] = [];
        if(source instanceof Object) {
            let keys = this.getObjectKeys(source, target);

            // handles properties which are only in the source but not in the target
            keys.source.forEach(key =>
                diff.push(...this.remove(source[key], `${path}/${String(key)}`)));

            // handle the keys which are in target only but not in source
            keys.target.forEach(key =>
                diff.push(...this.add(getValue(target, key), `${path}/${String(key)}`)));

            // handle keys which are both in source and target
            keys.both.forEach(key =>
                diff.push(...this.diffAny(source[key], getValue(target, key), `${path}/${String(key)}`)));
        } else {
            diff.push(...this.replace(target, path, source));
        }

        return diff;
    }

    private getObjectKeys<T extends object>(source: T, target: T): ObjectKeys {
        let sk: {[k in PropertyKey]: any} = {};
        let keys: ObjectKeys = {
            source: [],
            target: [],
            both: []
        };
        Object.keys(source).forEach(key => sk[key] = 1);
        Object.keys(target).forEach(key => {
            if(sk[key]) {
                delete sk[key];
                keys.both.push(key);
            } else {
                keys.target.push(key);
            }
        });
        keys.source.push(...Object.keys(sk));
        return keys;
    }

    private diffPrimitive(source: Primitive, target: any, path: string): PatchOperation[] {
        let diff: PatchOperation[] = [];
        if(source !== target) {
            if(typeof source !== "undefined" && typeof target == "undefined") {
                diff.push(...this.remove(source, path));
            } else {
                diff.push(...this.replace(target, path, source));
            }
        }
        return diff;
    }

    /**
     * Recursively scans source creating micro patches to add each and every branch and leaf in the
     * tree of data under the given object.  This is needed because we cannot merge adds of large
     * branches if they are an all or nothing operation.
     *
     * @param target
     * @param path
     * @param last
     */
    private add(target: any, path: string): PatchOperation[] {
        let diff: PatchOperation[] = [];
        if(target instanceof Object) {
            diff.push(this.createOperation("add", path, {
                type: getValueType(target)
            }));
            Object.keys(target).forEach(key => diff.push(...this.add(target[key], `${path}/${key}`)));
        } else {
            diff.push({
                op: "add",
                path: path || "",
                value: target
            });
        }
        return diff;
    }

    /**
     * Creates a remove for all values removed for auditing purposes
     * @param source
     * @param path
     */
    private remove(source: any, path: string): PatchOperation[] {
        let diff: PatchOperation[] = [];
        let optional: PatchOptional = {};

        if(source instanceof Object) {
            let keys = Object.keys(source);
            if(source instanceof Array) {
                keys = keys.sort((a: any, b: any) => b - a);
            }
            keys.forEach(key => diff.push(...this.remove(source[key], `${path}/${key}`)));
            if (source instanceof Array) {
                optional.type = ValueType.array;
            } else {
                optional.type = ValueType.object;
            }
        } else {
            optional.old = source;
        }

        diff.push(this.createOperation("remove", path, optional));

        return diff;
    }

    private replace(target: any, path: string, old: any): PatchOperation[] {
        let diff: PatchOperation[] = [];
        diff.push(...this.remove(old, path));

        let rem = firstElement(diff);
        let add = this.add(target, path);
        let first = firstElement(add);
        diff.push(this.createOperation("replace", path, {
            type: first.type,
            value: first.value,
            old: rem.old
        }));
        diff.push(...add);
        return diff;
    }
}