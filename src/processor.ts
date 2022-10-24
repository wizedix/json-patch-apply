import {DiffBase} from "./common";
import {ArrayChange, Change, ChangeValue, DiffFlags, IndexChange, PatchOperation, TrackedMin, ValueType} from "./types";
import * as _ from "lodash";
import {DiffSelector} from "./change";

export interface DiffConfig {
    flags?: DiffFlags[]
    processors: DiffProcessor[]
    arrayChanges: {[key: string]: ArrayChange}

    /**
     * When this is true all optional paths are no longer explored, only a default and simple logic is used to
     * create a diff.  This diff will not be optimized, for example it will skip the processing of move and copy
     * operations, it will skip evaluation of different array comparison strategies, it will no longer evaluate from
     * multiple ways of processing and will use a single predefined method which is best in most circumstances.
     *
     * With or without this option the diff will have the same effect.  The problem with fastDiff is that the size
     * of the diff will generally be a bit larger and take more room to store in DBs and be harder for humans to
     * understand.  These issues are resolved by setting fastDiff to false however this will then take more time
     * in calculating the diff and for large objects may result in higher latency then we would want.
     *
     * This option was invented to handle the case where for example we need to
     */
    fastDiff: boolean
}

export interface DiffArguments {
    source: any
    target: any
    key: PropertyKey
    path: string
}

export interface ProcessorArgs extends DiffArguments {
    index: number
    changes: Change[]
    ops: PatchOperation[]
    visited: number[]
}

class DiffProcessorIterator implements NextDiffProcessor {
    processors: DiffProcessor[]
    private index = -1;

    constructor(processors: DiffProcessor[]) {
        this.processors = processors;
    }

    hasNext(): boolean {
        return this.index + 1 < this.processors.length;
    }

    next(): DiffProcessor {
        if(this.hasNext()) {
            this.index ++;
            return this.processors[this.index];
        }
        throw new Error("End of list");
    }
}

export interface NextDiffProcessor {
    next(): DiffProcessor;
}

export abstract class DiffProcessor extends DiffBase {

    readonly diffSelector = new DiffSelector()

    static createNextDiffProcessor(processors: DiffProcessor[]): NextDiffProcessor {
        return new DiffProcessorIterator(processors);
    }

    /**
     * Implementing classes shall either return a diff and NOT invoke next, or return the diff from next.
     *
     * @param config
     * @param args
     * @param next
     */
    abstract diff(config: DiffConfig, args: DiffArguments, next: NextDiffProcessor): Change[]

    diffAny(config: DiffConfig, args: DiffArguments): Change[] {
        let next: NextDiffProcessor = DiffProcessor.createNextDiffProcessor(config.processors);
        return next.next().diff(config, args, next);
    }

    isOfSameType(source: any, target: any): boolean {
        return this.getValueType(source) == this.getValueType(target);
    }
}

export class MissingAndSameDiff extends DiffProcessor {
    diff(config: DiffConfig, args: DiffArguments, next: NextDiffProcessor): Change[] {
        let srcType: ValueType = this.getValueType(args.source);
        let tgtType: ValueType = this.getValueType(args.target);
        if(srcType == tgtType && _.isEqual(args.source, args.target)) {
            return [];
        } else if(srcType == ValueType.undefined) {
            let newVal: ChangeValue = { key: args.key, path: args.path, value: args.target }
            return [{new: newVal}];
        } else if(tgtType == ValueType.undefined) {
            let oldVal: ChangeValue = { key: args.key, path: args.path, value: args.source }
            return [{old: oldVal}];
        }
        return next.next().diff(config, args, next);
    }
}

export class TypeMismatchDiff extends DiffProcessor {
    diff(config: DiffConfig, args: DiffArguments, next: NextDiffProcessor): Change[] {
        let srcType: ValueType = this.getValueType(args.source);
        let tgtType: ValueType = this.getValueType(args.target);
        if(srcType != tgtType) {
            let oldVal: ChangeValue = { key: args.key, path: args.path, value: args.source }
            let newVal: ChangeValue = { key: args.key, path: args.path, value: args.target }
            return [{old: oldVal, new: newVal}]
        }
        return next.next().diff(config, args, next);
    }
}

export class ArrayDiff extends DiffProcessor {

    diff(config: DiffConfig, args: DiffArguments, next: NextDiffProcessor): Change[] {
        let tgtType = this.getValueType(args.target);
        if(this.isOfSameType(args.source, args.target) && tgtType == ValueType.array)
            return this.diffArray(config, args.source, args.target, args.key, args.path, config.flags);
        return next.next().diff(config, args, next);
    }

    private diffArray(config: DiffConfig, source: any[], target: any[], key: PropertyKey, path: string, flags?: DiffFlags[]): Change[] {
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

        let changes = this.levenshteinBacktrack(config, source, target, path, dist, track, flags);

        if(! config.fastDiff && ! this.hasFlag(DiffFlags.FAVOR_ARRAY_REORDER, flags)) {
            changes = this.diffSelector.selectDiff(changes, [{
                old: {key: key, path: path, value: source},
                new: {key: key, path: path, value: target}
            }]);
        }

        return changes;
    }

    private levenshteinBacktrack(config: DiffConfig, source: any[], target: any[], path: string,dist: any[], track: any[], flags?: DiffFlags[]): Change[] {
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

        return this.indexChangesToChanges(config, source, target, path, indexChanges, flags);
    }

    private indexChangesToChanges(config: DiffConfig, source: any, target: any, path: string, indexChanges: IndexChange[], flags?:DiffFlags[]): Change[] {
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
                let oldValue = source[change.sourceIndex];
                let newValue = target[change.targetIndex];
                let oldType: ValueType = this.getValueType(oldValue);
                let newType: ValueType = this.getValueType(newValue);
                let srcIdx = change.sourceIndex;
                let newPath = `${path}/${change.targetIndex}`;
                let replace: Change = {
                    old: {
                        key: srcIdx,
                        path: `${path}/${srcIdx}`,
                        value: oldValue
                    },
                    new: {
                        key: change.targetIndex,
                        path: newPath,
                        value: newValue
                    }
                };
                let diff: Change[] = [replace];
                if(! config.fastDiff && newType == oldType && (ValueType.object == newType || ValueType.array == newType)) {
                    let args: DiffArguments = {
                        source: oldValue,
                        target: newValue,
                        key: change.targetIndex,
                        path: newPath
                    };
                    let diff2 = this.diffAny(config, args)
                    diff = this.diffSelector.selectDiff(diff, diff2);
                }
                changes.push(...diff);
            }
        });

        return changes;
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

}

export class ObjectDiff extends DiffProcessor {

    diff(config: DiffConfig, args: DiffArguments, next: NextDiffProcessor): Change[] {
        let tgtType = this.getValueType(args.target)
        if(this.isOfSameType(args.source, args.target) && tgtType == ValueType.object)
            return this.diffObject(config, args.source, args.target, args.key, args.path)
        return next.next().diff(config, args, next)
    }

    private diffObject(config: DiffConfig, source: any, target: any, key: PropertyKey, path: string): Change[] {
        let diff: Change[] = [];
        let sourceKeys = Object.keys(source);
        let targetKeys = Object.keys(target);

        targetKeys.filter(key => {
            return ! _.isEqual(target[key], source[key])
        }).map(key => {
            if(sourceKeys.includes(key))
                return this.diffAny(config, {source: source[key], target: target[key], key: key, path: `${path}/${key}`});
            return this.diffAny(config, {source: undefined, target: target[key], key: key, path: `${path}/${key}`});
        }).forEach(ops => {
            diff.push(...ops)
        });

        sourceKeys.filter(key => ! targetKeys.includes(key)).forEach(key => {
            let change: Change = {old: {key: key, path: `${path}/${key}`, value: source[key]}};
            diff.push(change)
        });

        let selected: Change[] = diff;
        if(! config.fastDiff) {
            let diff2: Change[] = [{old: {key: key, path: path, value: source}, new: {key: key, path: path, value: target}}];
            selected = this.diffSelector.selectDiff(diff, diff2);
        }

        return selected;
    }
}

export class FallbackDiff extends DiffProcessor {
    diff(config: DiffConfig, args: DiffArguments, next: NextDiffProcessor): Change[] {
        let oldVal: ChangeValue = { key: args.key, path: args.path, value: args.source }
        let newVal: ChangeValue = { key: args.key, path: args.path, value: args.target }
        return [{old: oldVal, new: newVal}]
    }
}