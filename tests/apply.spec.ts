import {expect} from "chai";
import {PatchOperation, ValueType} from "../src/common";
import {PatchApply} from "../src/apply";
import * as _ from "lodash";

describe("apply", () => {
    let patch = new PatchApply();

    function apply<T extends object>(o: T, op: string, path: string, type: ValueType, value: any) {
        let operation: PatchOperation = {
            op: op,
            path: path,
            type: type
        };
        if(value !== undefined) {
            operation.value = value;
        }
        return  patch.apply(o, operation);
    }

    function verifyOp<T extends object>(o: T, op: string, path: string, type: ValueType, value: any, expected: string) {
        let found = apply(o, op, path, type, value);
        expect(expected).eql(JSON.stringify(o));
        expect(expected).eql(JSON.stringify(found));
    }

    describe("apply to array", () => {
        describe("add", () => {

            it("can add array", () => {
                let o: Array<number> = [];
                verifyOp(o, "add", "/0", ValueType.array, [1,2], "[[1,2]]");
            });

            it("can add an object", () => {
                let o: Array<number> = [];
                verifyOp(o, "add", "/0", ValueType.object, {a:"abc"}, "[{\"a\":\"abc\"}]");
            });

            it("can add a primitive", () => {
                let o: Array<number> = [];
                verifyOp(o, "add", "/0", ValueType.primitive, "abc", "[\"abc\"]");
                o = [];
                verifyOp(o, "add", "/0", ValueType.primitive, 2, "[2]");
                o = [];
                verifyOp(o, "add", "/0", ValueType.primitive, null, "[null]");
                o = [];
                verifyOp(o, "add", "/0", ValueType.primitive, undefined, "[null]");
                expect(typeof o[0] === "undefined"); // stringify converts element of array as null, verify the value is actually undefined
            });
        });

        describe("remove", () => {
            it("can remove array", () => {
                let o: Array<any> = [[1,2]];
                verifyOp(o, "remove", "/0", ValueType.array, undefined, "[]");
            });

            it("can remove object", () => {
                let o: Array<any> = [{a:"abc"}];
                verifyOp(o, "remove", "/0", ValueType.object, undefined, "[]");
            });

            it("can remove a primitive", () => {
                let o: Array<any> = ["abc"];
                verifyOp(o, "remove", "/0", ValueType.primitive, undefined, "[]");
                o = [2];
                verifyOp(o, "remove", "/0", ValueType.primitive, undefined, "[]");
                o = [null];
                verifyOp(o, "remove", "/0", ValueType.primitive, undefined, "[]");
                o = [undefined];
                verifyOp(o, "remove", "/0", ValueType.primitive, undefined, "[]");
            });
        });

        describe("replace", () => {
            it("can replace array", () => {
                let o: Array<any> = [{a:"abc"}];
                verifyOp(o, "replace", "/0", ValueType.array, [1,2], "[[1,2]]");
            });

            it("can replace object", () => {
                let o: Array<any> = [[1,2]];
                verifyOp(o, "replace", "/0", ValueType.object, {"a":"abc"}, "[{\"a\":\"abc\"}]");
            });

            it("can replace a primitive", () => {
                let o: Array<any> = [3];
                verifyOp(o, "replace", "/0", ValueType.primitive, "abc", "[\"abc\"]");
                o = ["abc"];
                verifyOp(o, "replace", "/0", ValueType.primitive, 2, "[2]");
                o = [undefined];
                verifyOp(o, "replace", "/0", ValueType.primitive, null, "[null]");
                o = [4];
                verifyOp(o, "replace", "/0", ValueType.primitive, undefined, "[null]");
            });
        });

        describe("move", () => {
            it("works", () => {
                let found = patch.apply([1,2], {op: "move", path: "/1", from: "/0"});
                expect(_.isEqual([2,1], found));
            });
            it("requires from", () => {
                try {
                    patch.apply([1], {op: "move", path: "/0"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot move without a from path");
                }
            });
            it("requires from path to exist", () => {
                try {
                    patch.apply([1], {op: "move", path: "/0", from: "/1"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/1' does not exist");
                }
            });
        });

        describe("copy", () => {
            it("works", () => {
                let found = patch.apply([1,2], {op: "copy", path: "/2", from: "/0"});
                expect(_.isEqual([1,2,1], found));
            });
            it("requires from", () => {
                try {
                    patch.apply([1], {op: "copy", path: "/0", value: 9});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot move without a from path");
                }
            });
            it("requires from path to exist", () => {
                try {
                    patch.apply([1], {op: "copy", path: "/0", from: "/1"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/1' does not exist");
                }
            });
        });
    });

    describe("apply to object", () => {
        describe("add", () => {
            it("can add array", () => {
                let o = {};
                verifyOp(o, "add", "/a", ValueType.array, [1,2], "{\"a\":[1,2]}");
            });

            it("can add an object", () => {
                let o = {};
                verifyOp(o, "add", "/a", ValueType.object, {b:"abc"}, "{\"a\":{\"b\":\"abc\"}}");
            });

            it("can add a primitive", () => {
                let o = {};
                verifyOp(o, "add", "/a", ValueType.primitive, "abc", "{\"a\":\"abc\"}");
                o = {};
                verifyOp(o, "add", "/a", ValueType.primitive, 2, "{\"a\":2}");
                o = {};
                verifyOp(o, "add", "/a", ValueType.primitive, null, "{\"a\":null}");
                o = {};
                verifyOp(o, "add", "/a", ValueType.primitive, undefined, "{}");
            });
        });

        describe("remove", () => {
            it("can remove array", () => {
                let o = {a:[1,2]};
                verifyOp(o, "remove", "/a", ValueType.array, undefined, "{}");
            });

            it("can remove object", () => {
                let o = {a:{b:"abc"}};
                verifyOp(o, "remove", "/a", ValueType.object, undefined, "{}");
            });

            it("can remove a primitive", () => {
                let o: any = {a:"abc"};
                verifyOp(o, "remove", "/a", ValueType.primitive, undefined, "{}");
                o = {a:2};
                verifyOp(o, "remove", "/a", ValueType.primitive, undefined, "{}");
                o = {a:null};
                verifyOp(o, "remove", "/a", ValueType.primitive, undefined, "{}");
                o = {a:undefined};
                verifyOp(o, "remove", "/a", ValueType.primitive, undefined, "{}");
            });
        });

        describe("replace", () => {
            it("can replace array", () => {
                let o = {a:"abc"};
                verifyOp(o, "replace", "/a", ValueType.array, [1,2], "{\"a\":[1,2]}");
            });

            it("can replace object", () => {
                let o = {a:[1,2]};
                verifyOp(o, "replace", "/a", ValueType.object, {"b":"abc"}, "{\"a\":{\"b\":\"abc\"}}");
            });

            it("can replace a primitive", () => {
                let o: any = {a:3};
                verifyOp(o, "replace", "/a", ValueType.primitive, "abc", "{\"a\":\"abc\"}");
                o = {a:"abc"};
                verifyOp(o, "replace", "/a", ValueType.primitive, 2, "{\"a\":2}");
                o = {a:undefined};
                verifyOp(o, "replace", "/a", ValueType.primitive, null, "{\"a\":null}");
                o = {a:4};
                verifyOp(o, "replace", "/a", ValueType.primitive, undefined, "{}");
            });
        });

        describe("move", () => {
            it("works", () => {
                let found = patch.apply({abc: 9}, {op: "move", path: "/xyz", from: "/abc"});
                expect(_.isEqual({xyz: 9}, found));
            });

            it("requires from", () => {
                try {
                    patch.apply({abc: 9}, {op: "move", path: "/abc"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot move without a from path");
                }
            });

            it("requires from path to exist", () => {
                try {
                    patch.apply({abc: 9}, {op: "move", path: "/abc", from: "/xyz"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/xyz' does not exist");
                }
            });

            it("requires from path to deeply exist", () => {
                try {
                    patch.apply({abc: 9}, {op: "move", path: "/abc", from: "/x/y"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/x/y' does not exist");
                }
            });
        });

        describe("copy", () => {
            it("works", () => {
                let found = patch.apply({abc: 9}, {op: "copy", path: "/xyz", from: "/abc"});
                expect(_.isEqual({abc: 9, xyz: 9}, found));
            });

            it("requires from", () => {
                try {
                    patch.apply({abc: 9}, {op: "copy", path: "/abc"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot move without a from path");
                }
            });

            it("requires from path to exist", () => {
                try {
                    patch.apply({abc: 9}, {op: "copy", path: "/abc", from: "/xyz"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/xyz' does not exist");
                }
            });

            it("requires from path to deeply exist", () => {
                try {
                    patch.apply({abc: 9}, {op: "copy", path: "/abc", from: "/x/y"});
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/x/y' does not exist");
                }
            });
        });
    });

    describe("apply to self", () => {
        it("can remove", () => {
            let source: any = "abc";
            let found = patch.apply(source, {op: "remove", path: ""});
            expect(found).be.undefined;
        });

        it("can add", () => {
            let source: any = undefined;
            let found = patch.apply(source, {op: "add", path: "", value: "abc"});
            expect(found).eql("abc");
        });

        it("can replace", () => {
            let source: any = "abc";
            let found = patch.apply(source, {op: "replace", path: "", value: "xyz"});
            expect(found).eql("xyz");
        });

        it("cannot use missing op", () => {
            let source: any = "abc";
            try {
                patch.apply(source, {op: "missing", path: "", value: "xyz"});
                throw new Error("Missing exception");
            } catch (e) {
                expect(e.message).eql("Unhandled condition: Patch {\"op\":\"missing\",\"path\":\"\",\"value\":\"xyz\"} cannot be applied to \"abc\"");
            }
        });
    });
});