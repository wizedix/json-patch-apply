import * as pointer from "json-pointer";

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

export class PatchDiff {

    hasKey<T extends object>(obj: T, k: keyof any): k is keyof T {
        return k in obj;
    }

    getParentPath(path: string): string {
        let segments = pointer.parse(path);
        segments.splice(segments.length - 1, 1);
        return pointer.compile(segments);
    }

    getKey(path: string): PropertyKey {
        let idx = path.lastIndexOf("/");
        let key: any = path;
        if(idx >= 0) {
            key = path.substr(idx + 1);
        }
        return pointer.unescape(key);
    }
}