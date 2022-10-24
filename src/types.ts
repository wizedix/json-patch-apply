import {ProcessorArgs} from "./processor";
import _ from "lodash";

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
    key: PropertyKey
    value: any
    adj?: number
}

export interface IndexChange {
    sourceIndex?: number
    targetIndex?: number
}

export interface CopySearchResult {
    cost: number,
    from?: ChangeValue
}

export interface TrackedMin {
    value: number
    index: number
}

export enum DiffFlags {
    /**
     * By default, tests are not generated, when this flag is present in a diff tests are generated.  For example:
     *
     * let diff = Patch.diff({a:1,b:2}, {a:1,b:999}, [DiffFlags.GENERATE_TESTS]);
     *
     * will produce: [{op:"test",path:"/b",value:2},{op:"replace",path:"/b",value:999}];
     *
     * these tests can ensure that concurrent modified records have a way to detect conflicts.
     */
    GENERATE_TESTS,

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
    FAVOR_ORDINAL,

    /**
     * When present we will favor array reorder algorithm.  This is mostly useful for testing though it could be
     * useful in other circumstances.  Without this parameter the default behavior is to find the least values
     * modified which will typically favor complete array replacement when none of the values match.  Array
     * reorder is the most efficient method typically when one value is moved from one place to another.  For example
     * source [1,2,3,4]
     * target [4,1,2,3]
     * will generate a single move operation with a from /3 to /0 which is very efficient.  However, if none of the
     * values match for example:
     * source [1,2,3,4]
     * target [5,6,7,8]
     * the array reorder algorithm will produce 4 replace operations to replace 1 with 5, 3 with 6, and so on.  In
     * this case the default behavior is to return a single patch operation to replace the entire array with [5,6,7,8]
     * which generally feel more concise and simpler.  But when we want to test the array reorder algorithm from
     * JsonDiff we can use this flag to disregard selecting the most efficient patch and only use the array reorder
     * method.
     */
    FAVOR_ARRAY_REORDER,

    /**
     * Will create a verbose set of statements rather then a bulk update.  For example
     * diff = jsonDiff.diff({}, {"a":{"b":[{"c":4}]}})
     *
     * Without VERBOSE_PATCH the diff would look like this:
     * [{"op":"add","path":"/a","value":{"b":[{"c":4}]}}}]
     *
     * With VERBOSE_PATCH the diff would look like this:
     * [
     *    {"op":"add","path":"/a","value":{}},
     *    {"op":"add","path":"/a/b","value":[]},
     *    {"op":"add","path":"/a/b/-","value":{}},
     *    {"op":"add","path":""/a/b/0/c,"value":4},
     * ]
     *
     * This can be useful if you need code to verify if specific paths have been modified.  It is more difficult
     * to determine that without the ability to split a patch up like this, but it will result in a number of
     * unnecessary operations which may decrease performance.
     */
    VERBOSE_PATCH,

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
    USE_REPLACE_FOR_NULL
}

export enum PatchFlags {

    /**
     * Forces invalid operations for example a patch to replace at /foo/bar when there is no /foo property would
     * normally throw an exception due to invalid path.  When FORCE is enabled a replace to /foo/bar would first create
     * /foo then replace it without raising and exception.  One other feature of FORCE is that failed test operations
     * will be ignored (will not raise exception) and the following operations will still be applied.
     *
     * Note that there are some situations in which force can still fail due to invalid path.  For example if a property
     * exists already and is nether an object or array and you try to add a child to it for example this would still
     * throw exception, but most changes should be applied without error.
     */
    FORCE,

    /**
     * Applies all changes which do not have test conflicts.  When a test conflict occurs the next operation is
     * skipped, but all that do not conflict are still applied even if the operation follows.  Note SKIP_CONFLICTS do
     * not effect errors or invalid operations, such exceptions will still throw exceptions.
     */
    SKIP_CONFLICTS,

    /**
     * Ignores errors which happen while applying patch operations.  Every operation which can be applied is applied
     * however and the errors are just ignored.  Note: It is normally a bad idea, this exists for backward compatibility
     * as previous library treated conflicts and errors in teh same way.
     */
    IGNORE_ERRORS
}

export interface PatchResult {
    op?: PatchOperation
    test?: PatchOperation
}

export class ArrayChange {
    readonly args: ProcessorArgs
    readonly parentPath: string
    readonly sourceParent: any[]
    readonly targetParent: any[]
    readonly shifts: number[]
    arraySize: number
    readonly visitedTo: number[]

    constructor(
        args: ProcessorArgs,
        parentPath: string,
        sourceParent: any[],
        targetParent: any[]
    ) {
        this.args = args
        this.parentPath = parentPath
        this.sourceParent = sourceParent
        this.targetParent = targetParent
        this.shifts = []
        this.arraySize = sourceParent.length
        this.visitedTo = []

        for(let i=0; i < this.arraySize; i++) {
            this.shifts[i] = 0;
        }
    }

    public getAdjustedTargetKey(newKey: number, currentVal: any): number {
        if(this.getNearestLeft(newKey) == -1)
            return newKey;

        let countAdj = this.getShifts(currentVal, false);
        return newKey - countAdj;
    }

    /**
     * returns the number of remaining shifts between the current args.index up until a change has a new
     * value equal to the search.
     *
     * Note if null is passed for search all changes are searched form current args.index to the end of the
     * set of changes.
     *
     * @param search The new value to search for, stop looking if this value is found.
     * @param skipDelete When true deletes are not counted in the shifts.
     *
     * @return
     */
    private getShifts(search: any, skipDelete: boolean): number {
        let countAdj = 0;
        for(let i=this.args.index + 1; i < this.args.changes.length; i++) {
            let c: Change = this.args.changes[i];
            if(! this.args.visited.includes(i)) {
                if (search != null && c.new != null && _.isEqual(c.new.value, search)) {
                    break;
                }

                if (! skipDelete && c.old != null && c.new == null) {
                    countAdj--;
                } else if (c.new != null && c.old == null) {
                    countAdj++;
                }
            }
        }
        return countAdj;
    }

    /**
     * Returns the actual current index for the given sourceKey.  This assumes the sourceKey has been modified to
     * represent the current index in the array as we are processing.  This will find the original index from an
     * adjusted index.
     */
    public getAdjustedSourceKeyFromSourceKey(fromKey: number): number {
        let index = fromKey;
        if(this.shifts[fromKey] != 0) {
            index += this.shifts[fromKey];
        }
        return index;
    }

    public getAdjustedSourceKeyFromToKey(toKey: number): number {
        let list: number[] = [];
        for(let i=0; i < this.shifts.length; i++) {
            let adjusted = i + this.shifts[i];
            if(toKey == adjusted) {
                list.push(i);
            }
        }
        return list.length == 0 ? toKey : list[0];
    }

    public getNearestLeft(toIdx: number): number {
        this.visitedTo.sort();
        let last = -1;
        for(let i=0; i < this.visitedTo.length; i++) {
            let value = this.visitedTo[i];
            if(value < toIdx) {
                last = value;
            } else {
                break;
            }

            if(last >= toIdx)
                break
        }
        return last;
    }
}