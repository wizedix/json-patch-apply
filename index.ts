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

import {PatchOperation} from "./src/common";
import {PatchDiff} from "./src/diff";
import {PatchApply} from "./src/apply";

export class Patch {

    private static generator: PatchDiff = new PatchDiff();
    private static patch: PatchApply = new PatchApply();

    static diff(source: any, target: any): PatchOperation[] {
        return this.generator.diff(source, target);
    }

    static apply(source: any, ...operations: PatchOperation[]): any {
        return this.patch.apply(source, ...operations);
    }
}