import {expect} from "chai";
import {PatchDiff} from "../src/common";

describe("common", () => {
    describe("PatchDiff", () => {
        let t = new PatchDiff();

        describe("can determine if object has key", () => {
            let o: any = {"a":1,"b":2, 3:3}
            it("when key is present", () => {
                expect(t.hasKey(o, "a")).eql(true)
                expect(t.hasKey(o, "b")).eql(true)
                expect(t.hasKey(o, 3)).eql(true)
            })
            it("when key is present", () => {
                expect(t.hasKey(o, "c")).eql(false)
                expect(t.hasKey(o, 0)).eql(false)
                expect(t.hasKey(o, "c")).eql(false)
            })
        })
        describe("can determine if array has key", () => {
            let a: any = [1,2]
            it("when key is present", () => {
                expect(t.hasKey(a, 0)).eql(true)
                expect(t.hasKey(a, 1)).eql(true)
            });
            it("when key is not present", () => {
                expect(t.hasKey(a, -1)).eql(false)
                expect(t.hasKey(a, 2)).eql(false)
            });
        })

        it("can get parent path", () => {
            expect("").eql(t.getParentPath(""))
            expect("").eql(t.getParentPath("/a"))
            expect("/a").eql(t.getParentPath("/a/b"))
            expect("/a/0").eql(t.getParentPath("/a/0/b"))
            expect("/a/~0x").eql(t.getParentPath("/a/~0x/b"))
        })

        it("can get key", () => {
            expect("").eql(t.getKey(""))
            expect("a").eql(t.getKey("/a"))
            expect("b").eql(t.getKey("/a/b"))
            expect("0").eql(t.getKey("/0"))
            expect("1").eql(t.getKey("/0/1"))
            expect("X~Y").eql(t.getKey("X~0Y"))
            expect("X/Y").eql(t.getKey("X~1Y"))
        })
    })
});