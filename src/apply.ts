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

import { PatchFlags, PatchOperation } from "./common";
import { JsonPointer  } from "./pointer";
import * as _ from "lodash";

/**
 * This class is capable of patching any object.
 */
export class PatchApply {

    /**
     * Applies a set of patch operations to a given object.
     *
     * @param source - The object to apply the operations to
     * @param operations - The operations to apply
     * @param flags - (optional) patch flags
     */
    apply<T extends object>(source: T, operations: PatchOperation[], flags?: PatchFlags[]): T | undefined {
        let src = JSON.stringify(source);
        let result: any = src===undefined ? undefined : JSON.parse(src);
        operations.forEach(patch =>
            result = this.applyPatch(result, patch));
        return result;
    }

    private applyPatch(result: any, patch: PatchOperation): any {
        let find = JsonPointer.findParent(result, patch.path);
        if(find == undefined)
            throw new Error(patch.op + " op should fail with missing parent key");

        if(patch.op == "add") {
            if("" === patch.path) {
                return patch.value;
            } else if(find.parent instanceof Array) {
                let to_idx = parseInt(String(find.key));
                find.parent.splice(to_idx, 0, patch.value);
            } else {
                if(find.parent.hasOwnProperty(find.key)) {
                    let existing = find.parent[find.key];
                    if(existing !== null)
                        throw new Error(`Cannot to an object with a value at specified key ${JSON.stringify(patch)}`);
                }
                find.parent[find.key] = patch.value;
            }
        } else if(patch.op == "replace") {
            if("" === patch.path) {
                return patch.value;
            } else if(find.parent instanceof Array) {
                let to_idx = parseInt(String(find.key));
                if(to_idx >= find.parent.length)
                    throw new Error(`Cannot replace an element that does ot exist ${JSON.stringify(patch)}`);
                find.parent[to_idx] = patch.value;
            } else {
                if(! find.parent.hasOwnProperty(find.key))
                    throw new Error(`Cannot replace for missing key ${JSON.stringify(patch)}`);
                find.parent[find.key] = patch.value;
            }
        } else if(patch.op == "remove") {
            if("" === patch.path) {
                return patch.value;
            } else if (find.parent instanceof Array) {
                find.parent.splice(parseInt(String(find.key)), 1);
            } else {
                delete find.parent[find.key];
            }
        } else if(patch.op == "move" || patch.op == "copy") {
            if(!patch.from)
                throw new Error(`Cannot ${patch.op} without a from path`);
            if(patch.from == patch.path)
                return result; // has not effect

            let from = JsonPointer.findParent(find.source, patch.from);
            if(from == undefined || ! from.parent.hasOwnProperty(from.key))
                throw new Error("from path '" + patch.from + "' does not exist");

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
        } else if(patch.op == "test") {
            if(!_.isEqual(find.parent[find.key], patch.value))
                throw new Error(`test for ${JSON.stringify(find.parent[find.key])}\n is not equal to \n${JSON.stringify(patch.value)}`);
        } else {
            throw new Error(`operation '${patch.op}' is not supported`);
        }

        return result;
    }
}