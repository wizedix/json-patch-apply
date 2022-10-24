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

import {PatchFlags, PatchOperation} from "./types";
import * as pointer from "json-pointer"
import * as _ from "lodash";
import {PatchDiff} from "./common";

/**
 * This class is capable of patching any object.
 */
export class PatchProcessor extends PatchDiff {

    /**
     * Applies a set of patch operations to a given object.
     *
     * @param source - The object to apply the operations to
     * @param operations - The operations to apply
     * @param flags - (optional) patch flags
     */
    apply(source: any, operations: PatchOperation[], flags?: PatchFlags[]): any {
        let src = JSON.stringify(source);
        let result: any = src===undefined ? undefined : JSON.parse(src);
        operations.forEach(patch =>
            result = this.applyPatch(result, patch, flags));
        return result;
    }

    private applyPatch(result: any, patch: PatchOperation, flags?: PatchFlags[]): any {
        try {
            let parentPath = this.getParentPath(patch.path);
            let parent = pointer.get(result, parentPath);
            let key = this.getKey(patch.path);

            if (patch.path !== "" && !parent)
                throw this.error(patch);

            if (key === "-")
                key = parent.length;

            if (patch.op == "add") {
                if ("" === patch.path) {
                    return patch.value;
                } else if (parent instanceof Array) {
                    let to_idx = parseInt(String(key));
                    parent.splice(to_idx, 0, patch.value);
                } else {
                    if (parent.hasOwnProperty(key)) {
                        let existing = parent[key];
                        if (existing !== null)
                            throw this.error(patch);
                    }
                    parent[key] = patch.value;
                }
            } else if (patch.op == "replace") {
                if ("" === patch.path) {
                    return patch.value;
                } else if (parent instanceof Array) {
                    let to_idx = parseInt(String(key));
                    if (to_idx >= parent.length)
                        throw this.error(patch);
                    parent[to_idx] = patch.value;
                } else {
                    if (!parent.hasOwnProperty(key))
                        throw this.error(patch);
                    parent[key] = patch.value;
                }
            } else if (patch.op == "remove") {
                if ("" === patch.path) {
                    return patch.value;
                } else if (parent instanceof Array) {
                    parent.splice(parseInt(String(key)), 1);
                } else {
                    delete parent[key];
                }
            } else if (patch.op == "move" || patch.op == "copy") {
                if (!patch.from)
                    throw new Error(`Cannot ${patch.op} without a from path`);
                if (patch.from == patch.path)
                    return result; // has no effect

                let moveParentPath = this.getParentPath(patch.from);
                let moveKey = this.getKey(patch.from);
                let moveParent;

                try {
                    moveParent = pointer.get(result, moveParentPath);
                } catch (e) {
                    throw new Error("from path '" + patch.from + "' does not exist");
                }

                if (!moveParent.hasOwnProperty(moveKey))
                    throw new Error("from path '" + patch.from + "' does not exist");

                if (parent instanceof Array && parent == moveParent) {
                    let from_idx = parseInt(String(moveKey));
                    let to_idx = parseInt(String(key));
                    let value = moveParent[from_idx];
                    if ("move" == patch.op) {
                        parent.splice(from_idx, 1);
                    }
                    parent.splice(to_idx, 0, value);
                } else {
                    parent[key] = moveParent[moveKey];
                    if ("move" == patch.op) {
                        delete moveParent[moveKey];
                    }
                }
            } else if (patch.op == "test") {
                if ("" === patch.path) {
                    if (!_.isEqual(parent, patch.value))
                        throw new Error(`test for ${JSON.stringify(parent)}\n is not equal to \n${JSON.stringify(patch.value)}`);
                } else if (!_.isEqual(parent[key], patch.value)) {
                    throw new Error(`test for ${JSON.stringify(parent[key])}\n is not equal to \n${JSON.stringify(patch.value)}`);
                }
            } else {
                throw new Error(`operation '${patch.op}' is not supported`);
            }
        } catch (e) {
            if(this.hasFlag(PatchFlags.IGNORE_ERRORS, flags)) {
                console.warn("got error, ignoring since IGNORE_ERRORS is present")
            } else {
                throw e;
            }
        }

        return result;
    }

    private error(patch: PatchOperation): Error {
        return new Error(`Cannot "${patch.op}" with path \"${patch.path}\", does not exist`);
    }

    /**
     * Returns true of the given optional set of flags has the given flag.
     *
     * @param flag
     * @param flags
     * @private
     */
    protected hasFlag(flag: PatchFlags, flags?: PatchFlags[]): boolean {
        return flags instanceof Array && flags.includes(flag);
    }
}