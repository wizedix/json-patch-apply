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

import {Change, ChangeValue, DiffFlags, getValueType, hasKey, PatchOperation, PatchOptional, ValueType} from "./common";
import * as _ from "lodash";

export class PatchDiff {

    diff(source: any, target: any, flags?: DiffFlags[]): PatchOperation[] {
        let changes = this.diffAny(source, target, "", flags);
        let ops: PatchOperation[] = [];
        let used: number[] = [];
        let futureOp: any = {};
        C: for(let i=0; i < changes.length; i++) {
            if(used.includes(i))
                continue;
            let change = changes[i];
            let op: PatchOperation = !!futureOp[i] ? futureOp[i] : null;

            if(!op) {
                for(let j=i + 1; j < changes.length; j++) {
                    if(used.includes(j))
                        continue;
                    let other = changes[j];
                    if(change.new && !other.new && other.old && _.isEqual(change.new.value, other.old.value)) {
                        used.push(j);
                        op = this.createOperation("move", change.new.path, {from: other.old.path});
                        break;
                    } else if(!change.new && change.old && other.new && _.isEqual(change.old.value, other.new.value)) {
                        futureOp[j] = this.createOperation("move", other.new.path, {from: change.old.path});
                        continue C;
                    }
                }

                if(!op) {
                    if(change.old == undefined && change.new != undefined) {
                        // For copy this type of search can be slow for large objects hence we need a limit of how deep + wide
                        // we are willing to look.  For a value to be a candidate for copy it must exist both in the target
                        // and source object, hence search will omit paths which do not exist in both trees.
                        // path: string, value: any, source: any, target: any, limit: number
                        let result = this.findPathForCopy(change.new.path, change.new.value, source, target, 150);
                        if(result.path != undefined) {
                            op =  this.createOperation("copy", change.new.path, {from: result.path});
                        }
                    }
                }
            }

            if(!op) {
                if(change.new) {
                    let opName = "add";
                    if(change.old) {
                        opName = "replace";
                        let isRoot = "" == change.new.path;
                        let isRootAdd = isRoot && this.hasFlag(DiffFlags.USE_ADD_FOR_REPLACE_OF_ROOT, flags);
                        isRootAdd = isRoot && (isRootAdd || (change.old.value instanceof Object && (this.getNodeCount(change.old.value) - 1) <= 0));
                        let isNullAdd = change.old.value == null;
                        if(isRootAdd || isNullAdd) {
                            if(! (flags && flags.includes(DiffFlags.USE_REPLACE_FOR_NULL))) {
                                opName = "add";
                            }
                        }
                    }
                    op = this.createOperation(opName, change.new.path, {value: change.new.value});
                } else if(change.old) {
                    op = this.createOperation("remove", change.old.path, {});
                }
            }

            ops.push(op);
        }
        return ops;
    }

    private diffAny(source: any, target: any, path: string, flags?: DiffFlags[]): Change[] {
        let diff: Change[] = [];
        let srcType: ValueType = getValueType(source);
        let newVal = {
            path: path,
            value: target
        }
        if(srcType == ValueType.undefined) {
            diff.push({new: newVal});
        } else {
            let tgtType: ValueType = getValueType(target);
            let oldVal: ChangeValue = {
                path: path,
                value: source
            };
            if(tgtType == ValueType.undefined) {
                diff.push({old: oldVal});
            } else if(tgtType != srcType) {
                diff.push({old: oldVal, new: newVal});
            } else if(tgtType == ValueType.array) {
                diff.push(...this.diffArray(path, source, target, flags));
            } else if(tgtType == ValueType.object) {
                diff.push(...this.diffObject(source, target, path, flags));
            } else {
                diff.push({old: oldVal, new: newVal});
            }
        }
        return diff;
    }

    private diffObject(source: any, target: any, path: string, flags?: DiffFlags[]): Change[] {
        let diff: Change[] = [];
        let sourceKeys = Object.keys(source);
        let targetKeys = Object.keys(target);
        targetKeys.filter(key => {
            return ! _.isEqual(target[key], source[key])
        }).map(key => {
            if(sourceKeys.includes(key))
                return this.diffAny(source[key], target[key], `${path}/${key}`, flags);
            return  this.diffAny(undefined, target[key], `${path}/${key}`, flags);
        }).forEach(ops => {
            diff.push(...ops)
        });

        sourceKeys.filter(key => ! targetKeys.includes(key)).forEach(key =>
            diff.push({old: {path: `${path}/${key}`, value: source[key]}}));

        let diff2: Change[] = [{old: {path: path, value: source}, new: {path: path, value: target}}];
        diff = this.selectDiff(diff, diff2);

        return diff;
    }

    /**
     * Compares the two arrays and returns a matrix for the computed edit distance to make the
     * source array into the target array.  Uses levenshtein distance and backtracking to determine
     * which operations will convert the one array into the other.
     *
     * @param path - The path so far in the object to the array being diffed
     * @param source - The original array we want to compute the distance of edits to make it into target
     * @param target - The desired array we want to convert source into
     * @param flags - (optional) diff flags to apply to generating the diff
     *
     * @private
     */
    private diffArray(path: string, source: any[], target: any[], flags?: DiffFlags[]): Change[] {
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

        return this.levenshteinBacktrack(path, source, target, dist, track, flags);
    }

    private levenshteinBacktrack(path: string, source: any[], target: any[], dist: any[], track: any[], flags?: DiffFlags[]): Change[] {
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
        let src: number[] = [], tgt: number[] = [];
        for(let x=0; x < source.length; x++)
            src[x] = 0;
        for(let x=0; x < target.length; x++)
            tgt[x] = 0;

        indexChanges.forEach(change => {
             if(change.targetIndex === undefined && change.sourceIndex !== undefined) { // remove
                 let idx = change.sourceIndex + src[change.sourceIndex];
                 changes.push({
                     old: {
                         path: this.getArrayPath(path, idx, false, flags),
                         value: source[change.sourceIndex]
                     }
                 });
                 size --;
                 this.updateAdj(change.sourceIndex, -1, src);
             } else if(change.sourceIndex === undefined && change.targetIndex !== undefined) { // insert
                 let idx = change.targetIndex + tgt[change.targetIndex];
                 let last = idx == size;
                 changes.push({
                     new: {
                         path: this.getArrayPath(path, idx, last, flags),
                         value: target[change.targetIndex]
                     }
                 });
                 size ++;
                 this.updateAdj(change.targetIndex, 1, tgt);
             } else if(change.sourceIndex !== undefined && change.targetIndex !== undefined) { // replace
                 // when value exists in both arrays we can clobber the whole value or
                 // drill in and modify the values within the array value.  Here we will
                 // compare both options to determine which is more efficient.
                 let oldValue = source[change.sourceIndex];
                 let newValue = target[change.targetIndex];
                 let oldType: ValueType = getValueType(oldValue);
                 let newType: ValueType = getValueType(newValue);
                 let sIdx = change.sourceIndex + src[change.sourceIndex];
                 let tIdx = change.targetIndex + tgt[change.targetIndex];
                 let replace = {
                     old: {
                         path: this.getArrayPath(path, sIdx, false, flags),
                         value: oldValue
                     },
                     new: {
                         path: this.getArrayPath(path, tIdx, false, flags),
                         value: newValue
                     }
                 };
                 let diff: Change[] = [replace];
                 if(newType == oldType) {
                     if(ValueType.object == newType || ValueType.array == newType) {
                         let diff2 = this.diffAny(oldValue, newValue, replace.new.path, flags);
                         diff = this.selectDiff(diff, diff2);
                     }
                 }
                 changes.push(...diff);
             }
        });

        return changes;
    }

    private updateAdj(index: number, change: number, adj: number[]) {
        for(let i=index; i < adj.length; i++) {
            adj[i] += change;
        }
    }

    private getArrayPath(path: string, index: number, last: boolean, flags?: DiffFlags[]): string {
        let segment = ! this.hasFlag(DiffFlags.ARRAY_INDEX_LITERAL, flags) && last ? "-" : index;
        return `${path}/${segment}`;
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
            if(hasKey(optional, key) && optional[key] !== undefined)
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
    private findPathForCopy(path: string, value: any, source: any, target: any, limit: number): CopySearchResult {
        return this.doFindPathForCopy(path, "", value, source, target, limit, 0);
    }

    /**
     * Searches for the given value in source and target.  To be a copy candidate the value must exist in both the
     * source and target at the same path, that path must not equal the path we want to copy to.  The search shall not
     * exceed more than limit number of checks for the sum of breadth and depth.
     *
     * @param path - The path we want to copy to
     * @param current - The current path to where we have traversed so far (searches start with "")
     * @param value - The value we are searching for
     * @param source - The source object
     * @param target - The target object
     * @param limit - The max breadth + depth to search
     * @param cost - The cost so far for the search
     * @private
     */
    private doFindPathForCopy(path: string, current: string, value: any, source: any, target: any, limit: number, cost: number): CopySearchResult {
        let result: CopySearchResult = {cost: cost};

        if(source instanceof Array && target instanceof Array) {
            for(let i=0; i < Math.min(source.length, target.length); i++) {
                if(! this.incrementAndVerifyCost(result, limit))
                    return result;

                let cur = `${current}/${i}`;
                if(cur != path) {
                    if (_.isEqual(value, source[i]) || value===null && source[i]===null) {
                        result.path = cur;
                        break;
                    } else {
                        let childSearch = this.doFindPathForCopy(path, cur, value, source[i], target[i], limit, result.cost);
                        result.cost += childSearch.cost;
                        if(childSearch.path != null) {
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
                        result.path = cur;
                        break;
                    } else {
                        let childSearch = this.doFindPathForCopy(path, cur, value, source[key], target[key], limit, result.cost);
                        result.cost += childSearch.cost;
                        if(childSearch.path != null) {
                            result = childSearch;
                            break;
                        }
                    }
                }
            }
        } else if(getValueType(source) === ValueType.primitive && getValueType(target) === ValueType.primitive) {
            if(! this.incrementAndVerifyCost(result, limit))
                return result;

            if(path != current && _.isEqual(source, value))
                result.path = current;
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
}

interface IndexChange {
    sourceIndex?: number
    targetIndex?: number
}

interface CopySearchResult {
    cost: number,
    path?: string
}

interface TrackedMin {
    value: number
    index: number
}