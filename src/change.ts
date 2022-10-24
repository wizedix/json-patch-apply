import {DiffBase} from "./common";
import {
    ArrayChange,
    Change,
    ChangeValue,
    CopySearchResult,
    DiffFlags,
    PatchOperation, PatchOptional,
    PatchResult,
    ValueType
} from "./types";
import * as pointer from "json-pointer";
import * as _ from "lodash";
import {DiffConfig, ProcessorArgs} from "./processor";

export class ChangeProcessor extends DiffBase {

    public processAll(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult, processors: ChangeItemProcessor[]): number {
        if(change.new)
            this.getArrayChange(config, args, change.new);
        else if(change.old)
            this.getArrayChange(config, args, change.old);

        let adj = 0;
        for(let i=0; i < processors.length; i++) {
            let processor = processors[i];
            if(result.op)
                break;
            adj += processor.process(config, args, change, result);
        }
        return adj;
    }

    private getArrayChange(config: DiffConfig, args: ProcessorArgs, changeValue: ChangeValue): ArrayChange | null {
        let parentPath = this.getParentPath(changeValue.path);
        if(! config.arrayChanges[parentPath]) {
            let sourceParent = pointer.get(args.source, parentPath)
            if(sourceParent instanceof Array) {
                let targetParent = pointer.get(args.target, parentPath)
                if(targetParent instanceof Array) {
                    config.arrayChanges[parentPath] = new ArrayChange(
                        args,
                        parentPath,
                        sourceParent,
                        targetParent);
                }
            }
        }
        return config.arrayChanges[parentPath];
    }
}

export abstract class ChangeItemProcessor extends DiffBase {

    abstract process(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): number

    isAdd(change: Change): boolean {
        return !change.old && !!change.new;
    }

    isRemove(change: Change): boolean {
        return !!change.old && !change.new;
    }

    isReplace(change: Change): boolean {
        return !!change.old && !!change.new;
    }

    protected updateShiftsForAdd(config: DiffConfig, newValue: ChangeValue): void {
        let parentPath: string = this.getParentPath(newValue.path)
        let arrayChange = config.arrayChanges[parentPath]
        if(arrayChange != null && typeof newValue.key == "number") {
            let targetKey = newValue.adj != null ? newValue.adj : newValue.key
            let start = arrayChange.getAdjustedSourceKeyFromToKey(targetKey)
            let end = Math.max(arrayChange.sourceParent.length, arrayChange.arraySize)
            arrayChange.arraySize = arrayChange.arraySize + 1
            this.updateAdj(arrayChange, start, end, 1);
            arrayChange.visitedTo.push(newValue.key);
        }
    }

    protected updateShiftsForRemove(config: DiffConfig, oldValue: ChangeValue): void {
        let parentPath = this.getParentPath(oldValue.path);
        let arrayChange = config.arrayChanges[parentPath];
        if(arrayChange != null && typeof oldValue.key == "number") {
            arrayChange.arraySize = arrayChange.arraySize - 1;
            let start = oldValue.key;
            let end = Math.max(arrayChange.sourceParent.length, arrayChange.arraySize);
            this.updateAdj(arrayChange, start, end, -1);
        }
    }

    protected checkKey(config: DiffConfig, from: ChangeValue | null, to: ChangeValue | null) {
        if(from && typeof from.key == "number")
            this.checkFromKey(config, from, from.key);
        if(to && typeof to.key == "number")
            this.checkToKey(config, to, to.key);
    }

    protected checkFromKey(config: DiffConfig, from: ChangeValue, index: number) {
        let parentPath = this.getParentPath(from.path);
        if(config.arrayChanges[parentPath]) {
            let arrayChange = config.arrayChanges[parentPath];
            let updated = arrayChange.getAdjustedSourceKeyFromSourceKey(index);
            if(updated != index) {
                from.adj = updated;
                from.path = parentPath + "/" + from.adj;
            }
        }
    }

    protected checkToKey(config: DiffConfig, to: ChangeValue, index: number) {
        let parentPath = this.getParentPath(to.path);
        if(config.arrayChanges[parentPath]) {
            let arrayChange = config.arrayChanges[parentPath];
            let size = arrayChange.arraySize;
            if (index >= size && !this.hasFlag(DiffFlags.FAVOR_ORDINAL, config.flags)) {
                to.path = parentPath + "/-";
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

    protected updateAdj(arrayChange: ArrayChange, start: number, end: number, change: number) {
        let max = arrayChange.shifts.length;
        if(start >= max)
            start = max;
        for(let i=Math.max(0,start); i < Math.min(max, end); i++) {
            arrayChange.shifts[i] += change;
        }
    }
}

export class MoveChangeItemProcessor extends ChangeItemProcessor {

    process(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): number {
        let adj: number = 0;

        if(! config.fastDiff) {
            let move: PatchOperation[] = [];
            for(let j=args.index + 1; j < args.changes.length; j++) {
                if(!args.visited.includes(j)) {
                    let other = args.changes[j];

                    if(change.new) {
                        adj += this.handleChangeWithNew(config, args, change, other, move, j);
                    } else if(change.old) {
                        adj += this.handleChangeWithOld(config, args, change, other, move, j);
                    }

                    this.setMoveInResult(move, result);

                    if(move.length > 0)
                        break
                }
            }
        }

        return adj;
    }

    private setMoveInResult(move: PatchOperation[], result: PatchResult): void {
        if(move.length == 2) {
            result.test = move[0];
            result.op = move[1];
        } else if(move.length == 1) {
            result.op = move[0];
        }
    }

    private handleChangeWithNew(config: DiffConfig, args: ProcessorArgs, change: Change, other: Change, move: PatchOperation[], j: number): number {
        let adj: number = 0;
        if(other.old && change.new && _.isEqual(change.new.value, other.old.value)) {
            move.push(...this.createMove(config, other.old, change.new))

            if(this.isReplace(other)) {
                delete other.old;
            } else {
                args.visited.push(j);
            }

            if(! this.isAdd(change)) {
                delete change.new;
                adj --;
            }
        }
        return adj;
    }

    private handleChangeWithOld(config: DiffConfig, args: ProcessorArgs, change: Change, other: Change, move: PatchOperation[], j: number): number {
        let adj: number = 0;
        if(other.new && change.old && _.isEqual(change.old.value, other.new.value)) {
            move.push(...this.createMove(config, change.old, other.new))

            if(this.isReplace(other)) {
                delete other.new;
            } else {
                args.visited.push(j);
            }

            if(! this.isRemove(change)) {
                delete change.old;
                adj --;
            }
        }
        return adj;
    }

    private createMove(config: DiffConfig, from: ChangeValue, to: ChangeValue): PatchOperation[] {
        this.checkKey(config, from, to)

        let parentPath = this.getParentPath(to.path)
        let arrayChange = config.arrayChanges[parentPath]

        this.updateShiftsForRemove(config, from);

        if(arrayChange != null && typeof from.key == "number" && typeof to.key == "number") {
            if(from.key < to.key) {
                let currentVal: any = to.value
                to.adj = arrayChange.getAdjustedTargetKey(to.key, currentVal)
                to.path = arrayChange.parentPath + "/" + to.adj
            }
        }

        let op = this.createOperation("move", to.path, {from: from.path});

        if(arrayChange != null) {
            this.updateShiftsForAdd(config, to);
        }

        if(this.hasFlag(DiffFlags.GENERATE_TESTS, config.flags)) {
            let test = this.createOperation("test", from.path, {value: from.value});
            return [test, op]
        } else {
            return [op]
        }
    }
}

export class DiffSelector {

    /**
     * Selects which diff is better based on complexity and number of operations.
     *
     * @param diff1
     * @param diff2
     * @private
     */
    public selectDiff(diff1: Change[], diff2: Change[]): Change[] {
        let score1 = this.getComplexity(diff1);
        let score2 = this.getComplexity(diff2);
        if(score1 == score2) {
            let fromToCount1 = this.getFromToCount(diff1);
            let fromToCount2 = this.getFromToCount(diff2);
            if(fromToCount1 < fromToCount2)
                score1 --;
            else if(fromToCount2 < fromToCount1)
                score2 --;
        }
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
            let cnt = Math.max(1, JsonNodeCounter.getNodeCount(value));
            complexity += cnt;
        });
        return complexity + oldNew / 9;
    }

    private getFromToCount(diff: Change[]): number {
        let count = 0;
        for(let i=0; i < diff.length; i++) {
            let c = diff[i];
            if (c.new)
                count ++;
            if(c.old)
                count ++;
        }
        return count;
    }
}

export class JsonNodeCounter {

    public static getNodeCount(node: any): number {
        let count = 1;
        if(node instanceof Array) {
            for (let i = 0; i < node.length; i++)
                count += JsonNodeCounter.getNodeCount(node[i]);
        } else if(node instanceof Object) {
            Object.keys(node).forEach(field =>
                count += JsonNodeCounter.getNodeCount(node[field]));
        }
        return count;
    }
}

export class CopyChangeItemProcessor extends ChangeItemProcessor {

    process(config: DiffConfig, args: ProcessorArgs, change: Change, patchResult: PatchResult): number {
        if(! config.fastDiff && change.old == undefined && change.new != undefined) {
            let result = this.findPathForCopy(change.new, args.source, args.target, 150);
            if(result.from != undefined) {
                let loc = result.from;
                let parentPath = this.getParentPath(loc.path);
                let arrayChange = config.arrayChanges[parentPath];
                this.checkKey(config, loc, change.new);
                if(arrayChange != null && typeof change.new.key == "number") {
                    arrayChange.arraySize = arrayChange.arraySize + 1;
                    this.updateAdj(arrayChange, change.new.key, arrayChange.sourceParent.length, 1);
                }
                if(this.hasFlag(DiffFlags.GENERATE_TESTS, config.flags)) {
                    patchResult.test = this.createOperation("test", loc.path, {value: loc.value});
                }
                patchResult.op = this.createOperation("copy", change.new.path, {from: loc.path});
            }
        }
        return 0;
    }

    /**
     * Searches for the given value in source and target.  To be a copy candidate the value must exist in both the
     * source and target at the same path, that path must not equal the path we want to copy to.  The search shall not
     * exceed more than limit number of checks for the sum of breadth and depth.
     */
    private findPathForCopy(changeValue: ChangeValue, source: any, target: any, limit: number): CopySearchResult {
        return this.doFindPathForCopy(changeValue, source, target, "", limit, 0);
    }

    /**
     * Searches for the given value in source and target.  To be a copy candidate the value must exist in both the
     * source and target at the same path, that path must not equal the path we want to copy to.  The search shall not
     * exceed more than limit number of checks for the sum of breadth and depth.
     *
     * @param changeValue - The value
     * @param source - The source object
     * @param target - The target object
     * @param current - The current path to where we have traversed so far (searches start with "")
     * @param limit - The max breadth + depth to search
     * @param cost - The cost so far for the search
     * @private
     */
    private doFindPathForCopy(changeValue: ChangeValue, source: any, target: any, current: string, limit: number, cost: number): CopySearchResult {
        let result: CopySearchResult = {cost: cost};
        let props: PropertyKey[] = [];

        if(source instanceof Array && target instanceof Array) {
            props = this.getCommonArrayKeys(source, target);
        } else if(source instanceof Object && target instanceof Object) {
            props = this.getCommonObjectKeys(source, target);
        } else if(this.getValueType(source) === ValueType.primitive && this.getValueType(target) === ValueType.primitive) {
            if(! this.incrementAndVerifyCost(result, limit))
                return result;
            if(changeValue.path != current && this.isValidCopyValue(changeValue.value, source, target))
                result.from = { path: current, key: changeValue.key, value: source }
        }

        this.processCommonKeys(changeValue, current, source, target, limit, result, props);

        return result;
    }

    private processCommonKeys(changeValue: ChangeValue, current: string, source: any, target: any, limit: number, result: CopySearchResult, props: PropertyKey[]): void {
        for(let i=0; i < props.length; i++) {
            let prop = props[i];
            if(this.incrementAndVerifyCost(result, limit)) {
                let cur = `${current}/${String(prop)}`;
                if(cur != changeValue.path) {
                    this.handleChild(changeValue, source, target, limit, result, prop, cur);
                }
            }

            if(result.from)
                break;
        }
    }

    private handleChild(changeValue: ChangeValue, source: any, target: any, limit: number, result: CopySearchResult, prop: PropertyKey, cur: string): void {
        let sChild = source[prop];
        let tChild = target[prop];
        if (this.isValidCopyValue(changeValue.value, sChild, tChild)) {
            result.from = {
                path: cur,
                key: prop,
                value: sChild
            }
        } else {
            let childSearch = this.doFindPathForCopy({key: prop, path: changeValue.path, value: changeValue.value}, sChild, tChild, cur, limit, result.cost);
            result.cost += childSearch.cost;
            if(childSearch.from) {
                result.cost = childSearch.cost;
                result.from = childSearch.from;
            }
        }
    }

    private isValidCopyValue(search: any, source: any, target: any): boolean {
        if(search === null)
            return source===null && target===null
        else
            return _.isEqual(search, source) && _.isEqual(source, target)
    }

    private getCommonObjectKeys(o1: object, o2: object): PropertyKey[] {
        let keys = Object.keys(o1);
        let common: string[] = [];
        Object.keys(o2).forEach(k => {
            if(keys.includes(k))
                common.push(k);
        });
        return common;
    }

    private getCommonArrayKeys(a1: any[], a2: any[]): PropertyKey[] {
        let keys = a1.length < a2.length ? Object.keys(a1) : Object.keys(a2);
        return keys.map(k => parseInt(k));
    }

    incrementAndVerifyCost(result: CopySearchResult, limit: number): boolean {
        result.cost ++;
        return result.cost <= limit;
    }
}

export class DefaultChangeItemProcessor extends ChangeItemProcessor {

    process(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): number {
        this.checkKey(config, change.old || null, change.new || null);
        this.handleTest(config, args, change, result);

        if(change.new) {
            let opName = "add";
            if(change.old) {
                opName = "replace";
                let isRoot = "" == change.new.path;
                let isRootAdd = isRoot && this.hasFlag(DiffFlags.USE_ADD_FOR_REPLACE_OF_ROOT, config.flags);
                isRootAdd = isRoot && (isRootAdd || (change.old.value instanceof Object && (JsonNodeCounter.getNodeCount(change.old.value) - 1) <= 0));
                let isNullAdd = change.old.value == null;
                if((isRootAdd || isNullAdd) && ! (this.hasFlag(DiffFlags.USE_REPLACE_FOR_NULL, config.flags)))
                    opName = "add";
            }

            result.op = this.createOperation(opName, change.new.path, {value: change.new.value});

            if(change.old)
                this.updateShiftsForRemove(config, change.old);

            this.updateShiftsForAdd(config, change.new);
        } else if(change.old) {
            result.op = this.createOperation("remove", change.old.path, {});
            this.updateShiftsForRemove(config, change.old);
        }
        return 0;
    }

    handleTest(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): void {
        let hasNewInWork = change.new && "" !== change.new.path && pointer.has(args.source, change.new.path);

        if((change.old || hasNewInWork) && this.hasFlag(DiffFlags.GENERATE_TESTS, config.flags)) {
            let testPath, testValue;
            if(change.old) {
                testPath = change.old.path;
                testValue = change.old.value;
            }
            if(testPath !== undefined)
                result.test = this.createOperation("test", testPath, {value: testValue});
        }
    }
}