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