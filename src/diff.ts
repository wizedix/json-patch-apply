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

import { PatchDiff } from "./common";
import {
    Change,
    ChangeValue,
    DiffFlags,
    PatchOperation,
    PatchOptional,
    ValueType,
    CopySearchResult,
    IndexChange,
    TrackedMin
} from "./types";
import * as _ from "lodash";
import * as pointer from "json-pointer"

export class DiffProducer extends PatchDiff {

    diff(source: any, target: any, flags?: DiffFlags[]): PatchOperation[] {
        let changes: Change[] = this.diffAny(source, target, "", "", flags);
        let ops: PatchOperation[] = [];
        let arrayShifts: {[key: string]: number[]} = {};
        let visited: number[] = [];

        for(let i=0; i < changes.length; i++) {
            if(visited.includes(i))
                continue;
            let change = changes[i];
            let op: PatchOperation | null = null;
            let test: PatchOperation | null = null;

            for(let j=i + 1; j < changes.length; j++) {
                if(visited.includes(j))
                    continue;
                let other = changes[j];
                let move: PatchOperation[] = [];

                if(change.new) {
                    if(other.old && _.isEqual(change.new.value, other.old.value)) {
                        let parentPath = this.getParentPath(change.new.path)
                        move = this.processMove(source, arrayShifts, parentPath, other.old, change.new, flags)

                        if(this.isReplace(other)) {
                            delete other.old;
                        } else {
                            visited.push(j);
                        }

                        if(! this.isAdd(change)) {
                            delete change.new;
                            i --;
                        }
                    }
                } else if(change.old) {
                    if(other.new && _.isEqual(change.old.value, other.new.value)) {
                        let parentPath = this.getParentPath(other.new.path)
                        move = this.processMove(source, arrayShifts, parentPath, change.old, other.new, flags)

                        if(this.isReplace(other)) {
                            delete other.new;
                        } else {
                            visited.push(j);
                        }

                        if(! this.isRemove(change)) {
                            delete change.old;
                            i --;
                        }
                    }
                }

                if(move.length == 2) {
                    test = move[0];
                    op = move[1];
                    break
                } else if(move.length == 1) {
                    op = move[0];
                    break
                }
            }

            if(!op) {
                if(change.old == undefined && change.new != undefined) {
                    // For copy this type of search can be slow for large objects hence we need a limit of how deep + wide
                    // we are willing to look.  For a value to be a candidate for copy it must exist both in the target
                    // and source object, hence search will omit paths which do not exist in both trees.
                    // path: string, value: any, source: any, target: any, limit: number
                    let result = this.findPathForCopy(change.new.key, change.new.path, change.new.value, source, target, 150);
                    if(result.from != undefined) {
                        let loc = result.from;
                        let parent = pointer.get(source, loc.path);
                        this.checkKey(source, arrayShifts, loc, change.new, flags);
                        if(parent instanceof Array && typeof loc.key == "number" && typeof change.new.key == "number") {
                            arrayShifts[loc.path] = arrayShifts[loc.path] ? arrayShifts[loc.path] : this.createArrayShifts(parent.length);
                            if(loc.key < change.new.key)
                                this.updateAdj(loc.key, change.new.key + 1, -1, arrayShifts[loc.path]);
                            else
                                this.updateAdj(change.new.key, loc.key + 1, 1, arrayShifts[loc.path]);
                        }
                        if(this.hasFlag(DiffFlags.GENERATE_TESTS, flags)) {
                            test = this.createOperation("test", loc.path, {value: loc.value});
                        }
                        op =  this.createOperation("copy", change.new.path, {from: loc.path});
                    }
                }
            }

            if(!op) {
                this.checkKey(source, arrayShifts, change.old || null, change.new || null, flags);

                if(change.old && this.hasFlag(DiffFlags.GENERATE_TESTS, flags)) {
                    test = this.createOperation("test", change.old.path, {value: change.old.value});
                }

                if(change.new) {
                    let opName = "add";
                    if(change.old) {
                        opName = "replace";
                        let isRoot = "" == change.new.path;
                        let isRootAdd = isRoot && this.hasFlag(DiffFlags.USE_ADD_FOR_REPLACE_OF_ROOT, flags);
                        isRootAdd = isRoot && (isRootAdd || (change.old.value instanceof Object && (this.getNodeCount(change.old.value) - 1) <= 0));
                        let isNullAdd = change.old.value == null;
                        if((isRootAdd || isNullAdd) && (! (flags && flags.includes(DiffFlags.USE_REPLACE_FOR_NULL))))
                            opName = "add";
                    }

                    op = this.createOperation(opName, change.new.path, {value: change.new.value});

                    if( ! change.old) {
                        this.updateShifts(source, arrayShifts, change.new.path, null, change.new.key);
                    }
                } else if(change.old) {
                    op = this.createOperation("remove", change.old.path, {});
                    this.updateShifts(source, arrayShifts, change.old.path, change.old.key, null);
                }
            }

            if(test) ops.push(test)
            if(op) ops.push(op);
        }
        return ops;
    }

    private diffAny(source: any, target: any, key: PropertyKey, path: string, flags?: DiffFlags[]): Change[] {
        let diff: Change[] = [];
        let srcType: ValueType = this.getValueType(source);
        let tgtType: ValueType = this.getValueType(target);

        if(srcType == tgtType && (_.isEqual(source, target) || source === null && target === null))
            return diff;

        let newVal: ChangeValue = {
            key: key,
            path: path,
            value: target
        }

        if(srcType == ValueType.undefined) {
            diff.push({new: newVal});
        } else {
            let oldVal: ChangeValue = {
                key: key,
                path: path,
                value: source
            };
            if(tgtType == ValueType.undefined) {
                diff.push({old: oldVal});
            } else if(tgtType != srcType) {
                diff.push({old: oldVal, new: newVal});
            } else if(tgtType == ValueType.array) {
                diff.push(...this.diffArray(source, target, key, path, flags));
            } else if(tgtType == ValueType.object) {
                diff.push(...this.diffObject(source, target, key, path, flags));
            } else {
                diff.push({old: oldVal, new: newVal});
            }
        }
        return diff;
    }

    private diffObject(source: any, target: any, key: PropertyKey, path: string, flags?: DiffFlags[]): Change[] {
        let diff: Change[] = [];
        let sourceKeys = Object.keys(source);
        let targetKeys = Object.keys(target);

        targetKeys.filter(key => {
            return ! _.isEqual(target[key], source[key])
        }).map(key => {
            if(sourceKeys.includes(key))
                return this.diffAny(source[key], target[key], key, `${path}/${key}`, flags);
            return this.diffAny(undefined, target[key], key, `${path}/${key}`, flags);
        }).forEach(ops => {
            diff.push(...ops)
        });

        sourceKeys.filter(key => ! targetKeys.includes(key)).forEach(key =>
            diff.push({old: {key: key, path: `${path}/${key}`, value: source[key]}}));

        let diff2: Change[] = [{old: {key: key, path: path, value: source}, new: {key: key, path: path, value: target}}];
        diff = this.selectDiff(diff, diff2);

        return diff;
    }

    private diffArray(source: any[], target: any[], key: PropertyKey, path: string, flags?: DiffFlags[]): Change[] {
        let track: any[] = [];
        let dist: any[] = [];

        for(let i=0; i < source.length + 1; i++) {
            dist[i] = Array(target.length + 1);
            track[i] = Array(target.length + 1);
            dist[i].fill(0);
            dist[i][0] = i;
        }

        for(let j=1; j < target.length + 1; j++)
            dist[0][j] = j;

        for(let i=1; i < source.length + 1; i++) {
            for(let j=1; j < target.length + 1; j++) {
                let aC = source[i - 1];
                let bC = target[j - 1];
                let min = this.trackedMin(
                    dist[i - 1][j] + 1,
                    dist[i][j - 1] + 1,
                    dist[i - 1][j - 1] + (_.isEqual(aC, bC) ? 0 : 1)
                );
                track[i][j] = min.index;
                dist[i][j] = min.value;
            }
        }

        return this.levenshteinBacktrack(source, target, key, path, dist, track, flags);
    }

    private levenshteinBacktrack(source: any[], target: any[], key: PropertyKey, path: string,dist: any[], track: any[], flags?: DiffFlags[]): Change[] {
        let i = source.length;
        let j = target.length;
        let indexChanges: IndexChange[] = [];

        while(i > 0 && j > 0) {
            let d1 = dist[i][j];
            let current: IndexChange[];
            switch(track[i][j]) {
                case 0: // remove
                    current = [{sourceIndex: i - 1}];
                    --i;
                    break;
                case 1: // insert
                    current = [{targetIndex: j - 1}];
                    --j;
                    break;
                case 2: // update
                    current = [ {sourceIndex: i - 1, targetIndex: j - 1}];
                    --i;
                    --j;
                    break;
                default:
                    throw new Error("invalid track operation");
            }
            let d2 = dist[i][j];
            if(current && d1 != d2)
                indexChanges.push(...current);
        }
        if(i==0 && j > 0) {
            while(j > 0) { // add
                indexChanges.push({targetIndex: j - 1});
                --j;
            }
        }
        if(i > 0 && j==0) {
            while(i > 0) { // remove
                indexChanges.push({sourceIndex: i - 1});
                --i;
            }
        }

        indexChanges = indexChanges.reverse();

        let changes: Change[] = [];
        let size = source.length;

        indexChanges.forEach(change => {
             if(change.targetIndex === undefined && change.sourceIndex !== undefined) { // remove
                 let idx = change.sourceIndex;
                 changes.push({
                     old: { key: idx, path: `${path}/${idx}`, value: source[change.sourceIndex] }
                 });
                 size --;
             } else if(change.sourceIndex === undefined && change.targetIndex !== undefined) { // insert
                 let idx = change.targetIndex;
                 changes.push({
                     new: { key: idx, path: `${path}/${idx}`, value: target[change.targetIndex] }
                 });
                 size ++;
             } else if(change.sourceIndex !== undefined && change.targetIndex !== undefined) { // replace
                 // when value exists in both arrays we can clobber the whole value or
                 // drill in and modify the values within the array value.  Here we will
                 // compare both options to determine which is more efficient.
                 let oldValue = source[change.sourceIndex];
                 let newValue = target[change.targetIndex];
                 let oldType: ValueType = this.getValueType(oldValue);
                 let newType: ValueType = this.getValueType(newValue);
                 let srcIdx = change.sourceIndex;
                 let replace = {
                     old: {
                         key: srcIdx,
                         path: `${path}/${srcIdx}`,
                         value: oldValue
                     },
                     new: {
                         key: change.targetIndex,
                         path: `${path}/${change.targetIndex}`,
                         value: newValue
                     }
                 };
                 let diff: Change[] = [replace];
                 if(newType == oldType) {
                     if(ValueType.object == newType || ValueType.array == newType) {
                         let diff2 = this.diffAny(oldValue, newValue,  replace.new.key,replace.new.path, flags);
                         diff = this.selectDiff(diff, diff2);
                     }
                 }
                 changes.push(...diff);
             }
        });

        return  this.selectDiff(changes, [{
            old: {key: key, path: path, value: source},
            new: {key: key, path: path, value: target}
        }]);
    }

    processMove(source: any, arrayShifts: {[key: string]: number[]}, parentPath: string, from: ChangeValue, to: ChangeValue, flags?: DiffFlags[]): PatchOperation[] {
        let parent = pointer.get(source, parentPath);
        this.checkKey(source, arrayShifts, from, to, flags);
        if(parent instanceof Array && typeof from.key == "number" && typeof to.key == "number") {
            arrayShifts[parentPath] = arrayShifts[parentPath] ? arrayShifts[parentPath] : this.createArrayShifts(parent.length);
            if(from.key < to.key)
                this.updateAdj(from.key, to.key + 1, -1, arrayShifts[parentPath]);
            else
                this.updateAdj(to.key, from.key + 1, 1, arrayShifts[parentPath]);
        }
        let op = this.createOperation("move", to.path, {from: from.path});
        if(this.hasFlag(DiffFlags.GENERATE_TESTS, flags)) {
            let test = this.createOperation("test", from.path, {value: from.value});
            return [test, op]
        } else {
            return [op]
        }
    }

    private checkKey(source: any, arrayShifts: {[key: string]: number[]}, from: ChangeValue | null, to: ChangeValue | null, flags?: DiffFlags[]) {
        if(from && typeof from.key == "number") {
            let parentPath = this.getParentPath(from.path);
            if(arrayShifts[parentPath]) {
                let parent = pointer.get(source, parentPath);
                if(parent instanceof Array) {
                    let shifts = arrayShifts[parentPath];
                    if(shifts[from.key] != 0) {
                        from.key += shifts[from.key];
                        from.path = `${parentPath}/${from.key}`;
                    }
                }
            }
        }

        if(! this.hasFlag(DiffFlags.ARRAY_INDEX_LITERAL, flags) && to) {
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

    updateShifts(source: any, arrayShifts: {[key: string]: number[]}, path: string, oldKey: PropertyKey | null, newKey: PropertyKey | null) {
        let parentPath = this.getParentPath(path);
        let parent = pointer.get(source, parentPath);
        if(parent instanceof Array) {
            if(! arrayShifts[parentPath])
                arrayShifts[parentPath] = this.createArrayShifts(source.length);
            let shifts = arrayShifts[parentPath];
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

    private createArrayShifts(size: number): number[] {
        let adj: number[] = [];
        for(let x=0; x < size; x++)
            adj[x] = 0;
        return adj;
    }

    private updateAdj(start: number, end: number, change: number, remAdj: number[]) {
        for(let i=start; i < end; i++) {
            remAdj[i] += change;
        }
    }

    private trackedMin(a: number, b: number, c: number): TrackedMin {
        let min: TrackedMin = {value: a, index: 0};
        if(b < min.value) {
            min.value = b;
            min.index = 1;
        }
        if(c < min.value) {
            min.value = c;
            min.index = 2;
        }
        return min;
    }

    private createOperation(op: string, path: string, optional: PatchOptional): PatchOperation {
        let operation: PatchOperation = {
            op: op,
            path: path
        };
        Object.keys(optional).forEach(key => {
            if(this.hasKey(optional, key) && optional[key] !== undefined)
                operation[key] = optional[key];
        });
        return operation;
    }

    /**
     * Selects which diff is better based on complexity and number of operations.
     *
     * @param diff1
     * @param diff2
     * @private
     */
    private selectDiff(diff1: Change[], diff2: Change[]): Change[] {
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
    private getComplexity(ops: Change[]): number {
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

    private getNodeCount(node: any): number {
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
     * Searches for the given value in source and target.  To be a copy candidate the value must exist in both the
     * source and target at the same path, that path must not equal the path we want to copy to.  The search shall not
     * exceed more than limit number of checks for the sum of breadth and depth.
     *
     * @param path - The path we want to copy to
     * @param value - The value we are searching for
     * @param source - The source object
     * @param target - The target object
     * @param limit - The max breadth + depth to search
     * @private
     */
    private findPathForCopy(key: PropertyKey, path: string, value: any, source: any, target: any, limit: number): CopySearchResult {
        return this.doFindPathForCopy(key, path, "", value, source, target, limit, 0);
    }

    /**
     * Searches for the given value in source and target.  To be a copy candidate the value must exist in both the
     * source and target at the same path, that path must not equal the path we want to copy to.  The search shall not
     * exceed more than limit number of checks for the sum of breadth and depth.
     *
     * @param key - The key in the path
     * @param path - The path we want to copy to
     * @param current - The current path to where we have traversed so far (searches start with "")
     * @param value - The value we are searching for
     * @param source - The source object
     * @param target - The target object
     * @param limit - The max breadth + depth to search
     * @param cost - The cost so far for the search
     * @private
     */
    private doFindPathForCopy(key: PropertyKey, path: string, current: string, value: any, source: any, target: any, limit: number, cost: number): CopySearchResult {
        let result: CopySearchResult = {cost: cost};

        if(source instanceof Array && target instanceof Array) {
            for(let i=0; i < Math.min(source.length, target.length); i++) {
                if(! this.incrementAndVerifyCost(result, limit))
                    return result;

                let cur = `${current}/${i}`;
                if(cur != path) {
                    if (_.isEqual(value, source[i]) || value===null && source[i]===null) {
                        result.from = {
                            path: cur,
                            key: i,
                            value: source[i]
                        }
                        break;
                    } else {
                        let childSearch = this.doFindPathForCopy(i, path, cur, value, source[i], target[i], limit, result.cost);
                        result.cost += childSearch.cost;
                        if(childSearch.from != null) {
                            result = childSearch;
                            break;
                        }
                    }
                }
            }
        } else if(source instanceof Object && target instanceof Object) {
            let keys = Object.keys(source);
            for(let i=0; i < keys.length; i++) {
                if(! this.incrementAndVerifyCost(result, limit))
                    return result;

                let key = keys[i];
                let cur = `${current}/${key}`;
                if(cur != path) {
                    if(_.isEqual(value, source[key]) || value===null && source[key]===null) {
                        result.from = {
                            path: cur,
                            key: key,
                            value: source[key]
                        };
                        break;
                    } else {
                        let childSearch = this.doFindPathForCopy(key, path, cur, value, source[key], target[key], limit, result.cost);
                        result.cost += childSearch.cost;
                        if(childSearch.from != null) {
                            result = childSearch;
                            break;
                        }
                    }
                }
            }
        } else if(this.getValueType(source) === ValueType.primitive && this.getValueType(target) === ValueType.primitive) {
            if(! this.incrementAndVerifyCost(result, limit))
                return result;

            if(path != current && _.isEqual(source, value))
                result.from = {
                    path: current,
                    key: key,
                    value: source
                }
        }
        return result;
    }

    incrementAndVerifyCost(result: CopySearchResult, limit: number): boolean {
        result.cost ++;
        return result.cost <= limit;
    }

    /**
     * Returns true of the given optional set of flags has the given flag.
     *
     * @param flag
     * @param flags
     * @private
     */
    private hasFlag(flag: DiffFlags, flags?: DiffFlags[]): boolean {
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

    isAdd(change: Change): boolean {
        return !change.old && !!change.new;
    }

    isRemove(change: Change): boolean {
        return !!change.old && !change.new;
    }

    isReplace(change: Change): boolean {
        return !!change.old && !!change.new;
    }
}