import {DiffBase} from "./common";
import {
    Change,
    ChangeValue,
    CopySearchResult,
    DiffFlags,
    PatchOperation,
    PatchResult,
    ValueType
} from "./types";
import * as pointer from "json-pointer";
import * as _ from "lodash";
import {DiffArguments, DiffConfig, ProcessorArgs} from "./processor";

export abstract class ChangeProcessor extends DiffBase {

    abstract process(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): void

    static processAll(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult, processors: ChangeProcessor[]): void {
        for(let i=0; i < processors.length; i++) {
            let processor = processors[i];
            if(result.op)
                break;
            processor.process(config, args, change, result);
        }
    }
}

export class MoveChangeProcessor extends ChangeProcessor {

    process(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): void {
        let move: PatchOperation[] = [];
        let adj: number = 0;

        for(let j=args.index + 1; j < args.changes.length; j++) {
            if(args.visited.includes(j))
                continue;
            let other = args.changes[j];

            if(change.new) {
                if(other.old && _.isEqual(change.new.value, other.old.value)) {
                    let parentPath = this.getParentPath(change.new.path)
                    move = this.createMove(config, args, parentPath, other.old, change.new)

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
            } else if(change.old) {
                if(other.new && _.isEqual(change.old.value, other.new.value)) {
                    let parentPath = this.getParentPath(other.new.path)
                    move = this.createMove(config, args, parentPath, change.old, other.new)

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
            }

            if(move.length == 2) {
                result.test = move[0]
                result.op = move[1]
                break
            } else if(move.length == 1) {
                result.op = move[0]
                break
            }
        }

        args.index += adj;
    }

    private createMove(config: DiffConfig, args: DiffArguments, parentPath: string, from: ChangeValue, to: ChangeValue): PatchOperation[] {
        let source = args.source;
        let arrayShifts = config.arrayShifts;
        let flags = config.flags;
        let parent = pointer.get(source, parentPath);
        this.checkKey(config, args.source, from, to);
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

    private isAdd(change: Change): boolean {
        return !change.old && !!change.new;
    }

    private isRemove(change: Change): boolean {
        return !!change.old && !change.new;
    }

    private isReplace(change: Change): boolean {
        return !!change.old && !!change.new;
    }
}

export class CopyChangeProcessor extends ChangeProcessor {

    process(config: DiffConfig, args: ProcessorArgs, change: Change, patchResult: PatchResult): void {
        if(change.old == undefined && change.new != undefined) {
            let result = this.findPathForCopy(change.new.key, change.new.path, change.new.value, args.source, args.target, 150);
            if(result.from != undefined) {
                let loc = result.from;
                let parent = pointer.get(args.source, loc.path);
                this.checkKey(config, args.source, loc, change.new);
                if(parent instanceof Array && typeof loc.key == "number" && typeof change.new.key == "number") {
                    config.arrayShifts[loc.path] = config.arrayShifts[loc.path] ? config.arrayShifts[loc.path] : this.createArrayShifts(parent.length);
                    if(loc.key < change.new.key)
                        this.updateAdj(loc.key, change.new.key + 1, -1, config.arrayShifts[loc.path]);
                    else
                        this.updateAdj(change.new.key, loc.key + 1, 1, config.arrayShifts[loc.path]);
                }
                if(this.hasFlag(DiffFlags.GENERATE_TESTS, config.flags)) {
                    patchResult.test = this.createOperation("test", loc.path, {value: loc.value});
                }
                patchResult.op =  this.createOperation("copy", change.new.path, {from: loc.path});
            }
        }
    }

    /**
     * Searches for the given value in source and target.  To be a copy candidate the value must exist in both the
     * source and target at the same path, that path must not equal the path we want to copy to.  The search shall not
     * exceed more than limit number of checks for the sum of breadth and depth.
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
        let props: PropertyKey[] = [];

        if(source instanceof Array && target instanceof Array) {
            props = this.getCommonArrayKeys(source, target);
        } else if(source instanceof Object && target instanceof Object) {
            props = this.getCommonObjectKeys(source, target);
        } else if(this.getValueType(source) === ValueType.primitive && this.getValueType(target) === ValueType.primitive) {
            if(! this.incrementAndVerifyCost(result, limit))
                return result;
            if(path != current && _.isEqual(source, value))
                result.from = { path: current, key: key, value: source }
        }

        this.processCommonKeys(path, current, value, source, target, limit, result, props);

        return result;
    }

    private processCommonKeys(path: string, current: string, value: any, source: any, target: any, limit: number, result: CopySearchResult, props: PropertyKey[]): void {
        for(let i=0; i < props.length; i++) {
            let prop = props[i];
            if(this.incrementAndVerifyCost(result, limit)) {
                let cur = `${current}/${String(prop)}`;
                if(cur != path) {
                    let child = source[prop];
                    let tChild = target[prop];
                    if (_.isEqual(value, child) || value===null && child===null) {
                        result.from = {
                            path: cur,
                            key: prop,
                            value: child
                        }
                        break;
                    } else {
                        let childSearch = this.doFindPathForCopy(i, path, cur, value, child, tChild, limit, result.cost);
                        result.cost += childSearch.cost;
                        if(childSearch.from) {
                            result.cost = childSearch.cost;
                            result.from = childSearch.from;
                        }
                    }
                }
            }

            if(result.from)
                break;
        }
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
        return a1.length < a2.length ? Object.keys(a1) : Object.keys(a2);
    }

    incrementAndVerifyCost(result: CopySearchResult, limit: number): boolean {
        result.cost ++;
        return result.cost <= limit;
    }
}

export class DefaultChangeProcessor extends ChangeProcessor {

    process(config: DiffConfig, args: ProcessorArgs, change: Change, result: PatchResult): void {
        this.checkKey(config, args.source, change.old || null, change.new || null);
        let hasNewInWork = change.new && "" !== change.new.path && pointer.has(args.source, change.new.path);

        if((change.old || hasNewInWork) && this.hasFlag(DiffFlags.GENERATE_TESTS, config.flags)) {
            let testPath, testValue;
            if(change.old) {
                testPath = change.old.path;
                testValue = change.old.value;
            } else if(change.new) {
                testPath = change.new.path;
                testValue = change.new.value;
            }
            if(testPath !== undefined)
                result.test = this.createOperation("test", testPath, {value: testValue});
        }

        if(change.new) {
            let opName = "add";
            if(change.old) {
                opName = "replace";
                let isRoot = "" == change.new.path;
                let isRootAdd = isRoot && this.hasFlag(DiffFlags.USE_ADD_FOR_REPLACE_OF_ROOT, config.flags);
                isRootAdd = isRoot && (isRootAdd || (change.old.value instanceof Object && (this.getNodeCount(change.old.value) - 1) <= 0));
                let isNullAdd = change.old.value == null;
                if((isRootAdd || isNullAdd) && ! (this.hasFlag(DiffFlags.USE_REPLACE_FOR_NULL, config.flags)))
                    opName = "add";
            }

            result.op = this.createOperation(opName, change.new.path, {value: change.new.value});

            if( ! change.old) {
                this.updateShifts(config, args.source, change.new.path, null, change.new.key);
            }
        } else if(change.old) {
            result.op = this.createOperation("remove", change.old.path, {});
            this.updateShifts(config, args.source, change.old.path, change.old.key, null);
        }
    }
}