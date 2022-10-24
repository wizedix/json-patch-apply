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

import {DiffBase} from "./common";
import {
    DiffFlags,
    PatchOperation,
    PatchResult
} from "./types";
import {
    ChangeProcessor,
    ChangeItemProcessor,
    CopyChangeItemProcessor,
    DefaultChangeItemProcessor,
    MoveChangeItemProcessor, JsonNodeCounter
} from "./change";
import {PatchProcessor} from "./apply";
import {
    ArrayDiff,
    DiffConfig,
    DiffProcessor,
    MissingAndSameDiff,
    NextDiffProcessor,
    ObjectDiff,
    FallbackDiff,
    TypeMismatchDiff,
    ProcessorArgs
} from "./processor";

export class DiffProducer extends DiffBase {

    readonly patchProcessor = new PatchProcessor()
    private readonly changeProcessors: ChangeItemProcessor[] = [new MoveChangeItemProcessor(), new CopyChangeItemProcessor(), new DefaultChangeItemProcessor()];
    private readonly diffProcessors: DiffProcessor[] = [new MissingAndSameDiff(), new TypeMismatchDiff(), new ArrayDiff(), new ObjectDiff(), new FallbackDiff()];

    diff(source: any, target: any, flags?: DiffFlags[]): PatchOperation[] {
        let fastDiff = false;
        let size = Math.max(JsonNodeCounter.getNodeCount(source), JsonNodeCounter.getNodeCount(target));
        if(size > 100) {
            fastDiff = true;
        }

        let changeProcessor = new ChangeProcessor();
        let config: DiffConfig = {
            flags: flags,
            processors: this.diffProcessors,
            arrayChanges: {},
            fastDiff: fastDiff
        };
        let args: ProcessorArgs = {
            index: 0,
            changes: [],
            ops: [],
            visited: [],
            source: source,
            target: target,
            key: "",
            path: ""
        }
        let next: NextDiffProcessor = DiffProcessor.createNextDiffProcessor(config.processors);
        args.changes = next.next().diff(config, args, next);
        let adj = 0;

        for(let i=0; (i + adj) < args.changes.length; i++) {
            let idx = i + adj;
            if(args.visited.includes(idx))
                continue;
            let change = args.changes[idx];
            let result: PatchResult = {};

            args.index = idx;

            adj += changeProcessor.processAll(config, args, change, result, this.changeProcessors);

            if(result.test) {
                args.ops.push(result.test)
            }

            if(result.op) {
                args.ops.push(result.op);
            }
        }
        return args.ops;
    }
}
