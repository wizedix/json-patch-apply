import {expect} from "chai";
import {PatchDiff} from "../src/diff";

describe("diff", () => {
    let diff: PatchDiff = new PatchDiff();

    it("diffs primitive with undefined", () => {
        let source = "abc";
        let target = undefined;
        let found = diff.diff(source, target);
        expect(JSON.stringify(found)).eql("[{\"op\":\"remove\",\"path\":\"\"}]");
    });
});