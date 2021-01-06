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

import {PatchOperation, ValueType} from "./common";
import {FindResult, JsonPointer} from "./pointer";
import * as _ from "lodash";

/**
 * This class is capable of patching any object.
 */
export class PatchApply {

    /**
     * Applies a set of patch operations to a given object.
     * @param source
     * @param operations
     */
    apply<T extends object>(source: T, ...operations: PatchOperation[]): T | undefined{
        let result: T | undefined = source;
        operations.forEach(operation => {
            result = this.applyPatchOperation(result, operation);
        });
        return result;
    }

    /**
     * Applies the given patch operation to the given object.
     *
     * @param source
     * @param patch
     */
    private applyPatchOperation<T extends object>(source: any, patch: PatchOperation): T | undefined {
        let find = JsonPointer.findParent(source, patch.path);
        if(find == undefined) {
            throw new Error(patch.op + " op should fail with missing parent key");
        } else if(patch.path == "") {
            source = this.applyPatchToSelf(source, patch);
        } else {
            this.applyPatchToChild(find, patch);
        }
        return source;
    }

    private applyPatchToChild(find: FindResult, patch: PatchOperation) {
        if(patch.op == "remove") {
            if (find.parent instanceof Array) {
                find.parent.splice(parseInt(String(find.key)), 1);
            } else {
                delete find.parent[find.key];
            }
        } else if("replace" == patch.op) {
            find.parent[find.key] = this.applyPatchToSelf(find.parent[find.key], patch);
        } else if("move" == patch.op || "copy" == patch.op) {
            if(!patch.from) {
                throw new Error("Cannot move without a from path");
            }

            let from = JsonPointer.findParent(find.source, patch.from);
            if(from == undefined || ! from.parent.hasOwnProperty(from.key)) {
                throw new Error("from path '" + patch.from + "' does not exist");
            } else if(patch.from != patch.path) {
                if(find.parent instanceof Array && find.parent == from.parent) {
                    let from_idx = parseInt(String(from.key));
                    let to_idx = parseInt(String(find.key));
                    let value = from.parent[from_idx];
                    if("move" == patch.op) {
                        find.parent.splice(from_idx, 1);
                    }
                    find.parent.splice(to_idx, 0, value);
                } else {
                    find.parent[find.key] = from.parent[from.key];
                    if("move" == patch.op) {
                        delete from.parent[from.key];
                    }
                }
            }
        } else if("add" == patch.op) {
            if(find.parent instanceof Array) {
                let idx = parseInt(String(find.key));

                if(find.key == "-") {
                    idx = find.parent.length;
                } else {
                    if(isNaN(idx)) {
                        throw new Error("Object operation on array target");
                    } else if(idx > find.parent.length || idx < 0) {
                        throw new Error("array index " + idx + " out of bounds");
                    }
                }

                if(idx >= find.parent.length) {
                    find.parent[idx] = this.applyPatchToSelf(find.parent[idx], patch);
                } else {
                    find.parent.splice(idx, 0, this.getValue(patch.type, patch.value));
                }
            } else {
                find.parent[find.key] = this.applyPatchToSelf(find.parent[find.key], patch);
            }
        } else if("test" == patch.op) {
            if(!_.isEqual(find.parent[find.key], patch.value)) {
                throw new Error(JSON.stringify(find.parent[find.key]) + "\n is not equal to \n" + JSON.stringify(patch.value));
            }
        } else {
            this.handleConflict(`Unsupported operation "${patch.op}": ${JSON.stringify(patch)}`);
        }
    }

    private applyPatchToSelf<T extends object>(source: any, patch: PatchOperation): T | undefined {
        if("remove" == patch.op) {
            source = undefined;
        } else if("add" == patch.op || "replace" == patch.op) {
            source = this.getValue(patch.type, patch.value);
        } else {
            this.handleConflict(`Unhandled condition: Patch ${JSON.stringify(patch)} cannot be applied to ${JSON.stringify(source)}`);
        }
        return source;
    }

    private getValue(type: ValueType | undefined, value: any): any {
        if(ValueType.array == type) {
            return value != undefined ? value : [];
        } else if(ValueType.object == type) {
            return value != undefined ? value : {};
        } else {
            return value;
        }
    }

    private handleConflict(msg: string): void {
        throw new Error(msg);
    }
}