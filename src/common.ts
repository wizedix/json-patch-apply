import * as pointer from "json-pointer";
import {
    Change,
    ChangeValue,
    DiffFlags,
    PatchOperation,
    PatchOptional,
    ValueType
} from "./types";
import {DiffConfig} from "./processor";

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

    protected createArrayShifts(size: number): number[] {
        let adj: number[] = [];
        for(let x=0; x < size; x++)
            adj[x] = 0;
        return adj;
    }

    protected updateAdj(start: number, end: number, change: number, remAdj: number[]) {
        for(let i=start; i < end; i++) {
            remAdj[i] += change;
        }
    }

    protected checkKey(config: DiffConfig, source: any, from: ChangeValue | null, to: ChangeValue | null) {
        if(from && typeof from.key == "number") {
            let parentPath = this.getParentPath(from.path);
            if(config.arrayShifts[parentPath]) {
                let parent = pointer.get(source, parentPath);
                if(parent instanceof Array) {
                    let shifts = config.arrayShifts[parentPath];
                    let idx = from.key;
                    if(shifts[idx] != 0) {
                        from.key += shifts[from.key];
                        from.path = `${parentPath}/${from.key}`;
                    }
                }
            }
        }

        if(! this.hasFlag(DiffFlags.FAVOR_ORDINAL, config.flags) && to) {
            if(to && typeof to.key == "number") {
                let idx: number = to.key;
                let parentPath = this.getParentPath(to.path);
                let parent = pointer.get(source, parentPath);
                if(idx >= parent.length) {
                    to.path = parentPath + "/-";
                }
            }
        }
    }

    protected createOperation(op: string, path: string, optional: PatchOptional): PatchOperation {
        let operation: PatchOperation = {
            op: op,
            path: path
        };
        if(optional) {
            let keys = Object.keys(optional)
            if(keys.includes("from"))
                operation.from = optional.from;
            if(keys.includes("value"))
                operation.value = this.deepCopy(optional.value);
        }
        return operation;
    }

    /**
     * Returns true of the given optional set of flags has the given flag.
     *
     * @param flag
     * @param flags
     * @private
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

    protected updateShifts(config: DiffConfig, source: any, path: string, oldKey: PropertyKey | null, newKey: PropertyKey | null) {
        let parentPath = this.getParentPath(path);
        let parent = pointer.get(source, parentPath);
        if(parent instanceof Array) {
            if(! config.arrayShifts[parentPath])
                config.arrayShifts[parentPath] = this.createArrayShifts(parent.length);

            let shifts = config.arrayShifts[parentPath];
            let start = 0;
            let end = shifts.length;
            let amount = -1;
            if(typeof oldKey == "number") {
                start = oldKey + 1;
                if(typeof newKey == "number") {
                    end = newKey;
                }
            } else if(typeof newKey == "number") {
                amount = 1;
                start = newKey + 1;
            }
            this.updateAdj(start, end, amount, shifts);
        }
    }

    protected getNodeCount(node: any): number {
        let count = 1;
        if(node instanceof Array) {
            for (let i = 0; i < node.length; i++)
                count += this.getNodeCount(node[i]);
        } else if(node instanceof Object) {
            Object.keys(node).forEach(field =>
                count += this.getNodeCount(node[field]));
        } else if(node === null)
            count -= 0.5;
        return count;
    }

    /**
     * Selects which diff is better based on complexity and number of operations.
     *
     * @param diff1
     * @param diff2
     * @private
     */
    protected selectDiff(diff1: Change[], diff2: Change[]): Change[] {
        let score1 = this.getComplexity(diff1);
        let score2 = this.getComplexity(diff2);
        return score1 <= score2 ? diff1 : diff2;
    }

    /**
     * Returns a complexity score for the given set of operations, this can be used when trying to evalute
     * which of a set of patch strategies we should use when multiple are possible.
     *
     * @param ops
     * @private
     */
    protected getComplexity(ops: Change[]): number {
        let oldNew = 0;
        let complexity = ops.length / 10;
        let values: any[] = [];
        ops.forEach(op => {
            let value = null;
            if(op.new) {
                value = op.new.value;
                if(values.includes(value))
                    return;
                values.push(value);
            }
            if(op.old) {
                if(values.includes(op.old.value))
                    return;
            }
            if(op.new) oldNew += 1;
            if(op.old) oldNew += 1;
            let cnt = Math.max(1, this.getNodeCount(value));
            complexity += cnt;
        });
        return complexity + oldNew / 9;
    }
}