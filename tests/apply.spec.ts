import {expect} from "chai";
import {DiffFlags, PatchOperation} from "../src/types";
import {PatchProcessor} from "../src/apply";
import {DiffProducer} from "../src/diff";
import * as _ from "lodash";

describe("apply", () => {
    let patch = new PatchProcessor();
    let diff: DiffProducer = new DiffProducer();

    function apply<T extends object>(o: T, op: string, path: string, value: any) {
        let operation: PatchOperation = {
            op: op,
            path: path
        };
        if(value !== undefined) {
            operation.value = value;
        }
        return  patch.apply(o, [operation]);
    }

    function verifyOp<T extends object>(o: T, op: string, path: string, value: any, expected: string) {
        let found = apply(o, op, path, value);
        let exp = JSON.parse(expected);
        expect(!_.isEqual(exp, o));
        expect(_.isEqual(exp, found));
    }

    describe("exceptions", () => {
        describe("replace", () => {

            it("fails when path does not exist in object", () => {
                try {
                    patch.apply({}, [{op:"replace",path:"/a",value:"foo"}]);
                    throw new Error("expected error");
                } catch (e) {
                    expect("Cannot \"replace\" with path \"/a\", does not exist").eql(e.message);
                }
            });

            it("fails when path does not exist in array", () => {
                try {
                    patch.apply([], [{op:"replace",path:"/1",value:1}]);
                    throw new Error("expected error");
                } catch (e) {
                    expect("Cannot \"replace\" with path \"/1\", does not exist").eql(e.message);
                }
            });

            it("fails when path does not exist for primitive", () => {
                try {
                    patch.apply(2, [{op:"replace",path:"/a",value:"foo"}]);
                    throw new Error("expected error");
                } catch (e) {
                    expect("Cannot \"replace\" with path \"/a\", does not exist").eql(e.message);
                }
            });
        });

        describe("add", () => {
            it("does not allow replacement with add in object", () => {
                try {
                    patch.apply({a:1}, [{op:"add",path:"/a",value:2}]);
                    throw new Error("expected error");
                } catch (e) {
                    expect("Cannot \"add\" with path \"/a\", does not exist").eql(e.message);
                }
            });

            it("does not allow replacement with add in primitive", () => {
                try {
                    patch.apply(1, [{op:"add",path:"/foo",value:2}]);
                    throw new Error("expected error");
                } catch (e) {
                    expect("Cannot create property 'foo' on number '1'").eql(e.message);
                }
            });
        });
    });

    describe("apply to array", () => {
        describe("add", () => {

            it("can add array", () => {
                let o: Array<number> = [];
                verifyOp(o, "add", "/0", [1,2], "[[1,2]]");
            });

            it("can add an object", () => {
                let o: Array<number> = [];
                verifyOp(o, "add", "/0",{a:"abc"}, "[{\"a\":\"abc\"}]");
            });

            it("can add a primitive", () => {
                let o: Array<number> = [];
                verifyOp(o, "add", "/0",  "abc", "[\"abc\"]");
                o = [];
                verifyOp(o, "add", "/0",2, "[2]");
                o = [];
                verifyOp(o, "add", "/0", null, "[null]");
                o = [];
                verifyOp(o, "add", "/0", undefined, "[null]");
                expect(typeof o[0] === "undefined"); // stringify converts element of array as null, verify the value is actually undefined
            });
        });

        describe("remove", () => {
            it("can remove array", () => {
                let o: Array<any> = [[1,2]];
                verifyOp(o, "remove", "/0", undefined, "[]");
            });

            it("can remove object", () => {
                let o: Array<any> = [{a:"abc"}];
                verifyOp(o, "remove", "/0", undefined, "[]");
            });

            it("can remove a primitive", () => {
                let o: Array<any> = ["abc"];
                verifyOp(o, "remove", "/0", undefined, "[]");
                o = [2];
                verifyOp(o, "remove", "/0", undefined, "[]");
                o = [null];
                verifyOp(o, "remove", "/0", undefined, "[]");
                o = [undefined];
                verifyOp(o, "remove", "/0", undefined, "[]");
            });
        });

        describe("replace", () => {
            it("can replace array", () => {
                let o: Array<any> = [{a:"abc"}];
                verifyOp(o, "replace", "/0", [1,2], "[[1,2]]");
            });

            it("can replace object", () => {
                let o: Array<any> = [[1,2]];
                verifyOp(o, "replace", "/0", {"a":"abc"}, "[{\"a\":\"abc\"}]");
            });

            it("can replace a primitive", () => {
                let o: Array<any> = [3];
                verifyOp(o, "replace", "/0", "abc", "[\"abc\"]");
                o = ["abc"];
                verifyOp(o, "replace", "/0", 2, "[2]");
                o = [undefined];
                verifyOp(o, "replace", "/0", null, "[null]");
                o = [4];
                verifyOp(o, "replace", "/0", undefined, "[null]");
            });
        });

        describe("move", () => {
            it("works", () => {
                let found = patch.apply([1,2], [{op: "move", path: "/1", from: "/0"}]);
                expect(_.isEqual([2,1], found));
            });
            it("requires from", () => {
                try {
                    patch.apply([1], [{op: "move", path: "/0"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot move without a from path");
                }
            });
            it("requires from path to exist", () => {
                try {
                    patch.apply([1], [{op: "move", path: "/0", from: "/1"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/1' does not exist");
                }
            });
        });

        describe("copy", () => {
            it("works", () => {
                let found = patch.apply([1,2], [{op: "copy", path: "/2", from: "/0"}]);
                expect(_.isEqual([1,2,1], found));
            });
            it("requires from", () => {
                try {
                    patch.apply([1], [{op: "copy", path: "/0", value: 9}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot copy without a from path");
                }
            });
            it("requires from path to exist", () => {
                try {
                    patch.apply([1], [{op: "copy", path: "/0", from: "/1"}]);
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
                verifyOp(o, "add", "/a",  [1,2], "{\"a\":[1,2]}");
            });

            it("can add an object", () => {
                let o = {};
                verifyOp(o, "add", "/a", {b:"abc"}, "{\"a\":{\"b\":\"abc\"}}");
            });

            it("can add a primitive", () => {
                let o = {};
                verifyOp(o, "add", "/a", "abc", "{\"a\":\"abc\"}");
                o = {};
                verifyOp(o, "add", "/a", 2, "{\"a\":2}");
                o = {};
                verifyOp(o, "add", "/a", null, "{\"a\":null}");
                o = {};
                verifyOp(o, "add", "/a", undefined, "{}");
            });
        });

        describe("remove", () => {
            it("can remove array", () => {
                let o = {a:[1,2]};
                verifyOp(o, "remove", "/a", undefined, "{}");
            });

            it("can remove object", () => {
                let o = {a:{b:"abc"}};
                verifyOp(o, "remove", "/a", undefined, "{}");
            });

            it("can remove a primitive", () => {
                let o: any = {a:"abc"};
                verifyOp(o, "remove", "/a", undefined, "{}");
                o = {a:2};
                verifyOp(o, "remove", "/a", undefined, "{}");
                o = {a:null};
                verifyOp(o, "remove", "/a", undefined, "{}");
                o = {a:undefined};
                verifyOp(o, "remove", "/a", undefined, "{}");
            });
        });

        describe("replace", () => {
            it("can replace array", () => {
                let o = {a:"abc"};
                verifyOp(o, "replace", "/a",[1,2], "{\"a\":[1,2]}");
            });

            it("can replace object", () => {
                let o = {a:[1,2]};
                verifyOp(o, "replace", "/a", {"b":"abc"}, "{\"a\":{\"b\":\"abc\"}}");
            });

            it("can replace a primitive", () => {
                let o: any = {a:3};
                verifyOp(o, "replace", "/a", "abc", "{\"a\":\"abc\"}");
                o = {a:"abc"};
                verifyOp(o, "replace", "/a", 2, "{\"a\":2}");
                o = {a:true};
                verifyOp(o, "replace", "/a", null, "{\"a\":null}");
                o = {a:4};
                verifyOp(o, "replace", "/a", undefined, "{}");
            });
        });

        describe("move", () => {
            it("works", () => {
                let found = patch.apply({abc: 9}, [{op: "move", path: "/xyz", from: "/abc"}]);
                expect(_.isEqual({xyz: 9}, found));
            });

            it("requires from", () => {
                try {
                    patch.apply({abc: 9}, [{op: "move", path: "/abc"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot move without a from path");
                }
            });

            it("requires from path to exist", () => {
                try {
                    patch.apply({abc: 9}, [{op: "move", path: "/abc", from: "/xyz"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/xyz' does not exist");
                }
            });

            it("requires from path to deeply exist", () => {
                try {
                    patch.apply({abc: 9}, [{op: "move", path: "/abc", from: "/x/y"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/x/y' does not exist");
                }
            });
        });

        describe("copy", () => {
            it("works", () => {
                let found = patch.apply({abc: 9}, [{op: "copy", path: "/xyz", from: "/abc"}]);
                expect(_.isEqual({abc: 9, xyz: 9}, found));
            });

            it("requires from", () => {
                try {
                    patch.apply({abc: 9}, [{op: "copy", path: "/abc"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("Cannot copy without a from path");
                }
            });

            it("requires from path to exist", () => {
                try {
                    patch.apply({abc: 9}, [{op: "copy", path: "/abc", from: "/xyz"}]);
                    throw new Error("missing error");
                } catch (e) {
                    expect(e.message).eql("from path '/xyz' does not exist");
                }
            });

            it("requires from path to deeply exist", () => {
                try {
                    patch.apply({abc: 9}, [{op: "copy", path: "/abc", from: "/x/y"}]);
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
            let found = patch.apply(source, [{op: "remove", path: ""}]);
            expect(found).be.undefined;
        });

        it("can add", () => {
            let source: any = undefined;
            let found = patch.apply(source, [{op: "add", path: "", value: "abc"}]);
            expect(found).eql("abc");
        });

        it("can replace", () => {
            let source: any = "abc";
            let found = patch.apply(source, [{op: "replace", path: "", value: "xyz"}]);
            expect(found).eql("xyz");
        });

        it("cannot use missing op", () => {
            let source: any = "abc";
            try {
                patch.apply(source, [{op: "missing", path: "", value: "xyz"}]);
                throw new Error("Missing exception");
            } catch (e) {
                expect(e.message).eql("operation 'missing' is not supported");
            }
        });
    });

    describe("diffs applied equal expected", () => {
        describe("without test", () => {
            describe("empty", () => {
                it("can diff null with null", () => expect(patch.apply(null, diff.diff(null, null))).eql(null));
                it("can diff false with false", () => expect(patch.apply(false, diff.diff(false, false))).eql(false));
                it("can diff \"\" with \"\"", () => expect(patch.apply("", diff.diff("", ""))).eql(""));
                it("can diff 0 with 0", () => expect(patch.apply(0, diff.diff(0, 0))).eql(0));
                it("can diff undefined with undefined", () => expect(patch.apply(undefined, diff.diff(undefined, undefined))).eql(undefined));
                it("can diff [] with []", () => expect(patch.apply([], diff.diff([], []))).eql([]));
                it("can diff {} with {}", () => expect(patch.apply({}, diff.diff({}, {}))).eql({}));
                it("can diff null with false", () => expect(patch.apply(null, diff.diff(null, false))).eql(false));
                it("can diff false with null", () => expect(patch.apply(false, diff.diff(false, null))).eql(null));
                it("can diff null with \"\"", () => expect(patch.apply(null, diff.diff(null, ""))).eql(""));
                it("can diff \"\" with null", () => expect(patch.apply("", diff.diff("", null))).eql(null));
                it("can diff null with 0", () => expect(patch.apply(null, diff.diff(null, 0))).eql(0));
                it("can diff 0 with null", () => expect(patch.apply(0, diff.diff(0, null))).eql(null));
                it("can diff null with undefined", () => expect(patch.apply(null, diff.diff(null, undefined))).eql(undefined));
                it("can diff undefined with null", () => expect(patch.apply(undefined, diff.diff(undefined, null))).eql(null));
                it("can diff null with []", () => expect(patch.apply(null, diff.diff(null, []))).eql([]));
                it("can diff [] with null", () => expect(patch.apply([], diff.diff([], null))).eql(null));
                it("can diff null with {}", () => expect(patch.apply(null, diff.diff(null, {}))).eql({}));
                it("can diff {} with null", () => expect(patch.apply({}, diff.diff({}, null))).eql(null));
            });

            describe("primitives", () => {
                it("can diff string int", () => expect(patch.apply("abc",diff.diff("abc", 123))).eql(123));
                it("can diff string bool", () => expect(patch.apply("abc",diff.diff("abc", true))).eql(true));
                it("can diff string float", () => expect(patch.apply("abc",diff.diff("abc", 34.789))).eql(34.789));
                it("can diff string string", () => expect(patch.apply("abc",diff.diff("abc", "xyz"))).eql("xyz"));
                it("can diff string double", () => expect(patch.apply("abc",diff.diff("abc", 3.14159265359))).eql(3.14159265359));
                it("can diff int int", () => expect(patch.apply(7, diff.diff(7, 123))).eql(123));
                it("can diff int bool", () => expect(patch.apply(7, diff.diff(7, true))).eql(true));
                it("can diff int float", () => expect(patch.apply(7, diff.diff(7, 34.789))).eql(34.789));
                it("can diff int string", () => expect(patch.apply(7, diff.diff(7, "xyz"))).eql("xyz"));
                it("can diff int double", () => expect(patch.apply(7, diff.diff(7, 3.14159265359))).eql(3.14159265359));
                it("can bool int int", () => expect(patch.apply(true,diff.diff(true, 123))).eql(123));
                it("can bool int bool", () => expect(patch.apply(false, diff.diff(false, true))).eql(true));
                it("can bool int float", () => expect(patch.apply(true,diff.diff(true, 34.789))).eql(34.789));
                it("can bool int string", () => expect(patch.apply(true,diff.diff(true, "xyz"))).eql("xyz"));
                it("can bool int double", () => expect(patch.apply(true,diff.diff(true, 3.14159265359))).eql(3.14159265359));
                it("can float int int", () => expect(patch.apply(876.34, diff.diff(876.34, 123))).eql(123));
                it("can float int bool", () => expect(patch.apply(876.34, diff.diff(876.34, true))).eql(true));
                it("can float int float", () => expect(patch.apply(876.34, diff.diff(876.34, 34.789))).eql(34.789));
                it("can float int string", () => expect(patch.apply(876.34, diff.diff(876.34, "xyz"))).eql("xyz"));
                it("can float int double", () => expect(patch.apply(876.34, diff.diff(876.34, 3.14159265359))).eql(3.14159265359));
                it("can double int int", () => expect(patch.apply(9.8726728819191,diff.diff(9.8726728819191, 123))).eql(123));
                it("can double int bool", () => expect(patch.apply(9.8726728819191,diff.diff(9.8726728819191, true))).eql(true));
                it("can double int float", () => expect(patch.apply(9.8726728819191,diff.diff(9.8726728819191, 34.789))).eql(34.789));
                it("can double int string", () => expect(patch.apply(9.8726728819191,diff.diff(9.8726728819191, "xyz"))).eql("xyz"));
                it("can double int double", () => expect(patch.apply(9.8726728819191,diff.diff(9.8726728819191, 3.14159265359))).eql(3.14159265359));
            });

            describe("flat object", () => {
                it("can diff replace of root", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{c:3}))).eql({c:3}));
                it("can diff with add of values", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{a:1,b:2,c:3}))).eql({a:1,b:2,c:3}));
                it("can diff with remove of values", () => expect(patch.apply({a:1,b:2,c:3}, diff.diff({a:1,b:2,c:3}, {a:1,b:2}))).eql({a:1,b:2}));
                it("can diff with replace of values", () => expect(patch.apply({a:1,b:2}, diff.diff({a:1,b:2}, {a:1,b:999}))).eql({a:1,b:999}));
            });

            describe("deep object", () => {
                it("can diff with add of values", () => expect(patch.apply({c:{a:1,b:2}},diff.diff({c:{a:1,b:2}},{c:{a:1,b:2,c:3}}))).eql({c:{a:1,b:2,c:3}}));
                it("can diff with remove of values", () => expect(patch.apply({c:{a:1,b:2,c:3}}, diff.diff({c:{a:1,b:2,c:3}}, {c:{a:1,b:2}}))).eql({c:{a:1,b:2}}));
                it("can diff with replace of values", () => expect(patch.apply({c:{a:1,b:2}}, diff.diff({c:{a:1,b:2}}, {c:{a:1,b:999}}))).eql({c:{a:1,b:999}}));
                it("can diff replace of array property", () => expect(patch.apply({a:[1,2]},diff.diff({a:[1,2]},{a:[3]}))).eql({a:[3]}));
                it("can diff with add of values for array property", () => expect(patch.apply({a:[1,2]},diff.diff({a:[1,2]},{a:[1,2,3]}))).eql({a:[1,2,3]}));
                it("can diff with remove of values for array property", () => expect(patch.apply({a:[1,2,3]},diff.diff({a:[1,2,3]},{a:[1,2]}))).eql({a:[1,2]}));
                it("can diff with replace of values for array property", () => expect(patch.apply({a:[1,2]},diff.diff({a:[1,2]}, {a:[1,999]}))).eql({a:[1,999]}));
                it("can diff replace of object in array for array property", () => expect(patch.apply({a:[{a:1,b:2}]},diff.diff({a:[{a:1,b:2}]},{a:[{c:3}]}))).eql({a:[{c:3}]}));
            });

            describe("flat array", () => {
                it("can diff replace of root", () => expect(patch.apply([1,2],diff.diff([1,2],[3]))).eql([3]));
                it("can diff with add of values", () => expect(patch.apply([1,2],diff.diff([1,2],[1,2,3]))).eql([1,2,3]));
                it("can diff with remove of values", () => expect(patch.apply([1,2,3], diff.diff([1,2,3], [1,2]))).eql([1,2]));
                it("can diff with replace of values", () => expect(patch.apply([1,2],diff.diff([1,2], [1,999]))).eql([1,999]));
                it("can diff replace of object in array", () => expect(patch.apply([{a:1,b:2}],diff.diff([{a:1,b:2}],[{c:3}]))).eql([{c:3}]));
                it("can diff with add of values of object in array", () => expect(patch.apply([{a:1,b:2}],diff.diff([{a:1,b:2}],[{a:1,b:2,c:3}]))).eql([{a:1,b:2,c:3}]));
                it("can diff with remove of values of object in array", () => expect(patch.apply([{a:1,b:2,c:3}], diff.diff([{a:1,b:2,c:3}], [{a:1,b:2}]))).eql([{a:1,b:2}]));
                it("can diff with replace of values of object in array", () => expect(patch.apply([{a:1,b:2}], diff.diff([{a:1,b:2}], [{a:1,b:999}]))).eql([{a:1,b:999}]));
            });

            describe("deep array", () => {
                it("can diff deep changes", () => expect(patch.apply([0,1,[2,3,[4,5,[6,7]]]],diff.diff([0,1,[2,3,[4,5,[6,7]]]],[0,1,[2,3,[4,5,[6,7,8],9]]]))).eql([0,1,[2,3,[4,5,[6,7,8],9]]]));
                it("can diff deep chagnes for object fields", () => expect(patch.apply([1,[2,[3,{a:1,b:2}]]],diff.diff([1,[2,[3,{a:1,b:2}]]],[1,[2,[3,{a:1,b:999}]]]))).eql([1,[2,[3,{a:1,b:999}]]]));
            });

            describe("copy", () => {
                describe("array", () => {
                    it("can copy multiple after", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1]))).eql([1,2,1,3,1,4,1,1,1]));
                    it("can copy multiple after with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1], [DiffFlags.ARRAY_INDEX_LITERAL]))).eql([1,2,1,3,1,4,1,1,1]));
                    it("can copy multiple before", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4]))).eql([1,1,1,1,2,1,3,1,4]));
                    it("can copy multiple before with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4], [DiffFlags.ARRAY_INDEX_LITERAL]))).eql([1,1,1,1,2,1,3,1,4]));
                    it("can copy after", () => expect(patch.apply([1,2],diff.diff([1,2],[1,2,1]))).eql([1,2,1]));
                    it("can copy before", () => expect(patch.apply([1,2],diff.diff([1,2],[1,1,2]))).eql([1,1,2]));
                    it("can copy after multiple candidates", () => expect(patch.apply([1,1,2],diff.diff([1,1,2],[1,1,2,1]))).eql([1,1,2,1]));
                    it("can copy before multiple candidates", () => expect(patch.apply([1,1,2],diff.diff([1,1,2],[1,1,1,2]))).eql([1,1,1,2]));
                });

                describe("object", () => {
                    it("can move multiple", () => expect(patch.apply({a:1,b:2,c:1,d:3,e:1,f:4}, diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {a:1,b:2,c:1,d:3,e:1,f:4,g:1,h:1,i:1}))).eql({a:1,b:2,c:1,d:3,e:1,f:4,g:1,h:1,i:1}));
                    it("can copy after", () => expect(patch.apply({a:1},diff.diff({a:1},{a:1,b:1}))).eql({a:1,b:1}));
                    it("can copy before", () => expect(patch.apply({a:1},diff.diff({a:1},{b:1,a:1}))).eql({b:1,a:1}));
                    it("can copy after multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{a:{b:1},b:1,c:1}))).eql({a:{b:1},b:1,c:1}));
                    it("can copy before multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{c:1,a:{b:1},b:1}))).eql({c:1,a:{b:1},b:1}));
                });
            });

            describe("move", () => {
                describe("array", () => {
                    let x = diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1])
                    it("can move multiple after", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1]))).eql([2,3,4,1,1,1]));
                    it("can move multiple after with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1], [DiffFlags.ARRAY_INDEX_LITERAL]))).eql([2,3,4,1,1,1]));
                    it("can move multiple before", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4]))).eql([1,1,1,2,3,4]));
                    it("can move multiple before with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4], [DiffFlags.ARRAY_INDEX_LITERAL]))).eql([1,1,1,2,3,4]));
                    it("can move after", () => expect(patch.apply([1,2],diff.diff([1,2],[2,1]))).eql([2,1]));
                    it("can move before", () => expect(patch.apply([2,1],diff.diff([2,1],[1,2]))).eql([1,2]));
                    it("can move after multiple candidates", () => expect(patch.apply([0,1,1,2],diff.diff([0,1,1,2],[0,1,2,1]))).eql([0,1,2,1]));
                    it("can move before multiple candidates", () => expect(patch.apply([0,1,1,2],diff.diff([0,1,1,2],[1,0,1,2]))).eql([1,0,1,2]));
                });

                describe("object", () => {
                    it("can move multiple", () => expect(patch.apply({a:1,b:2,c:1,d:3,e:1,f:4}, diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {b:2,d:3,f:4,g:1,h:1,i:1}))).eql({b:2,d:3,f:4,g:1,h:1,i:1}));
                    it("can move after", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{b:2,c:1}))).eql({b:2,c:1}));
                    it("can move before", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{c:1,b:2}))).eql({c:1,b:2}));
                    it("can move after multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{a:{},b:1,c:1}))).eql({a:{},b:1,c:1}));
                    it("can move before multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{c:1,a:{},b:1}))).eql({c:1,a:{},b:1}));
                });
            });
        });

        describe("with test", () => {
            describe("empty", () => {
                it("can diff null with null", () => expect(patch.apply(null, diff.diff(null, null, [DiffFlags.GENERATE_TESTS]))).eql(null));
                it("can diff false with false", () => expect(patch.apply(false, diff.diff(false, false, [DiffFlags.GENERATE_TESTS]))).eql(false));
                it("can diff \"\" with \"\"", () => expect(patch.apply("", diff.diff("", "", [DiffFlags.GENERATE_TESTS]))).eql(""));
                it("can diff 0 with 0", () => expect(patch.apply(0, diff.diff(0, 0, [DiffFlags.GENERATE_TESTS]))).eql(0));
                it("can diff undefined with undefined", () => expect(patch.apply(undefined, diff.diff(undefined, undefined, [DiffFlags.GENERATE_TESTS]))).eql(undefined));
                it("can diff [] with []", () => expect(patch.apply([], diff.diff([], [], [DiffFlags.GENERATE_TESTS]))).eql([]));
                it("can diff {} with {}", () => expect(patch.apply({}, diff.diff({}, {}, [DiffFlags.GENERATE_TESTS]))).eql({}));
                it("can diff null with false", () => expect(patch.apply(null, diff.diff(null, false, [DiffFlags.GENERATE_TESTS]))).eql(false));
                it("can diff false with null", () => expect(patch.apply(false, diff.diff(false, null, [DiffFlags.GENERATE_TESTS]))).eql(null));
                it("can diff null with \"\"", () => expect(patch.apply(null, diff.diff(null, "", [DiffFlags.GENERATE_TESTS]))).eql(""));
                it("can diff \"\" with null", () => expect(patch.apply("", diff.diff("", null, [DiffFlags.GENERATE_TESTS]))).eql(null));
                it("can diff null with 0", () => expect(patch.apply(null, diff.diff(null, 0, [DiffFlags.GENERATE_TESTS]))).eql(0));
                it("can diff 0 with null", () => expect(patch.apply(0, diff.diff(0, null, [DiffFlags.GENERATE_TESTS]))).eql(null));
                it("can diff null with undefined", () => expect(patch.apply(null, diff.diff(null, undefined, [DiffFlags.GENERATE_TESTS]))).eql(undefined));
                it("can diff undefined with null", () => expect(patch.apply(undefined, diff.diff(undefined, null, [DiffFlags.GENERATE_TESTS]))).eql(null));
                it("can diff null with []", () => expect(patch.apply(null, diff.diff(null, [], [DiffFlags.GENERATE_TESTS]))).eql([]));
                it("can diff [] with null", () => expect(patch.apply([], diff.diff([], null, [DiffFlags.GENERATE_TESTS]))).eql(null));
                it("can diff null with {}", () => expect(patch.apply(null, diff.diff(null, {}, [DiffFlags.GENERATE_TESTS]))).eql({}));
                it("can diff {} with null", () => expect(patch.apply({}, diff.diff({}, null, [DiffFlags.GENERATE_TESTS]))).eql(null));
            });

            describe("primitives", () => {
                it("can diff string int", () => expect(patch.apply("abc",diff.diff("abc", 123, [DiffFlags.GENERATE_TESTS]))).eql(123));
                it("can diff string bool", () => expect(patch.apply("abc",diff.diff("abc", true, [DiffFlags.GENERATE_TESTS]))).eql(true));
                it("can diff string float", () => expect(patch.apply("abc",diff.diff("abc", 34.789, [DiffFlags.GENERATE_TESTS]))).eql(34.789));
                it("can diff string string", () => expect(patch.apply("abc",diff.diff("abc", "xyz", [DiffFlags.GENERATE_TESTS]))).eql("xyz"));
                it("can diff string double", () => expect(patch.apply("abc",diff.diff("abc", 3.14159265359, [DiffFlags.GENERATE_TESTS]))).eql(3.14159265359));
                it("can diff int int", () => expect(patch.apply(7,diff.diff(7, 123, [DiffFlags.GENERATE_TESTS]))).eql(123));
                it("can diff int bool", () => expect(patch.apply(7,diff.diff(7, true, [DiffFlags.GENERATE_TESTS]))).eql(true));
                it("can diff int float", () => expect(patch.apply(7,diff.diff(7, 34.789, [DiffFlags.GENERATE_TESTS]))).eql(34.789));
                it("can diff int string", () => expect(patch.apply(7,diff.diff(7, "xyz", [DiffFlags.GENERATE_TESTS]))).eql("xyz"));
                it("can diff int double", () => expect(patch.apply(7,diff.diff(7, 3.14159265359, [DiffFlags.GENERATE_TESTS]))).eql(3.14159265359));
                it("can bool int int", () => expect(patch.apply(true, diff.diff(true, 123, [DiffFlags.GENERATE_TESTS]))).eql(123));
                it("can bool int bool", () => expect(patch.apply(false, diff.diff(false, true, [DiffFlags.GENERATE_TESTS]))).eql(true));
                it("can bool int float", () => expect(patch.apply(true, diff.diff(true, 34.789, [DiffFlags.GENERATE_TESTS]))).eql(34.789));
                it("can bool int string", () => expect(patch.apply(true, diff.diff(true, "xyz", [DiffFlags.GENERATE_TESTS]))).eql("xyz"));
                it("can bool int double", () => expect(patch.apply(true, diff.diff(true, 3.14159265359, [DiffFlags.GENERATE_TESTS]))).eql(3.14159265359));
                it("can float int int", () => expect(patch.apply(876.34, diff.diff(876.34, 123, [DiffFlags.GENERATE_TESTS]))).eql(123));
                it("can float int bool", () => expect(patch.apply(876.34, diff.diff(876.34, true, [DiffFlags.GENERATE_TESTS]))).eql(true));
                it("can float int float", () => expect(patch.apply(876.34, diff.diff(876.34, 34.789, [DiffFlags.GENERATE_TESTS]))).eql(34.789));
                it("can float int string", () => expect(patch.apply(876.34, diff.diff(876.34, "xyz", [DiffFlags.GENERATE_TESTS]))).eql("xyz"));
                it("can float int double", () => expect(patch.apply(876.34, diff.diff(876.34, 3.14159265359, [DiffFlags.GENERATE_TESTS]))).eql(3.14159265359));
                it("can double int int", () => expect(patch.apply(9.8726728819191, diff.diff(9.8726728819191, 123, [DiffFlags.GENERATE_TESTS]))).eql(123));
                it("can double int bool", () => expect(patch.apply(9.8726728819191, diff.diff(9.8726728819191, true, [DiffFlags.GENERATE_TESTS]))).eql(true));
                it("can double int float", () => expect(patch.apply(9.8726728819191, diff.diff(9.8726728819191, 34.789, [DiffFlags.GENERATE_TESTS]))).eql(34.789));
                it("can double int string", () => expect(patch.apply(9.8726728819191, diff.diff(9.8726728819191, "xyz", [DiffFlags.GENERATE_TESTS]))).eql("xyz"));
                it("can double int double", () => expect(patch.apply(9.8726728819191, diff.diff(9.8726728819191, 3.14159265359, [DiffFlags.GENERATE_TESTS]))).eql(3.14159265359));
            });

            describe("flat object", () => {
                it("can diff replace of root", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{c:3}, [DiffFlags.GENERATE_TESTS]))).eql({c:3}));
                it("can diff with add of values", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{a:1,b:2,c:3}, [DiffFlags.GENERATE_TESTS]))).eql({a:1,b:2,c:3}));
                it("can diff with remove of values", () => expect(patch.apply({a:1,b:2,c:3},diff.diff({a:1,b:2,c:3}, {a:1,b:2}, [DiffFlags.GENERATE_TESTS]))).eql({a:1,b:2}));
                it("can diff with replace of values", () => expect(patch.apply({a:1,b:2}, diff.diff({a:1,b:2}, {a:1,b:999}, [DiffFlags.GENERATE_TESTS]))).eql({a:1,b:999}));
            });

            describe("deep object", () => {
                it("can diff with add of values", () => expect(patch.apply({c:{a:1,b:2}},diff.diff({c:{a:1,b:2}},{c:{a:1,b:2,c:3}}, [DiffFlags.GENERATE_TESTS]))).eql({c:{a:1,b:2,c:3}}));
                it("can diff with remove of values", () => expect(patch.apply({c:{a:1,b:2,c:3}},diff.diff({c:{a:1,b:2,c:3}}, {c:{a:1,b:2}}, [DiffFlags.GENERATE_TESTS]))).eql({c:{a:1,b:2}}));
                it("can diff with replace of values", () => expect(patch.apply({c:{a:1,b:2}},diff.diff({c:{a:1,b:2}}, {c:{a:1,b:999}}, [DiffFlags.GENERATE_TESTS]))).eql({c:{a:1,b:999}}));
                it("can diff replace of array property", () => expect(patch.apply({a:[1,2]},diff.diff({a:[1,2]},{a:[3]}, [DiffFlags.GENERATE_TESTS]))).eql({a:[3]}));
                it("can diff with add of values for array property", () => expect(patch.apply({a:[1,2]},diff.diff({a:[1,2]},{a:[1,2,3]}, [DiffFlags.GENERATE_TESTS]))).eql({a:[1,2,3]}));
                it("can diff with remove of values for array property", () => expect(patch.apply({a:[1,2,3]},diff.diff({a:[1,2,3]},{a:[1,2]}, [DiffFlags.GENERATE_TESTS]))).eql({a:[1,2]}));
                it("can diff with replace of values for array property", () => expect(patch.apply({a:[1,2]}, diff.diff({a:[1,2]}, {a:[1,999]}, [DiffFlags.GENERATE_TESTS]))).eql({a:[1,999]}));
                it("can diff replace of object in array for array property", () => expect(patch.apply({a:[{a:1,b:2}]},diff.diff({a:[{a:1,b:2}]},{a:[{c:3}]}, [DiffFlags.GENERATE_TESTS]))).eql({a:[{c:3}]}));
            });

            describe("flat array", () => {
                it("can diff replace of root", () => expect(patch.apply([1,2],diff.diff([1,2],[3], [DiffFlags.GENERATE_TESTS]))).eql([3]));
                it("can diff with add of values", () => expect(patch.apply([1,2],diff.diff([1,2],[1,2,3], [DiffFlags.GENERATE_TESTS]))).eql([1,2,3]));
                it("can diff with remove of values", () => expect(patch.apply([1,2,3],diff.diff([1,2,3], [1,2], [DiffFlags.GENERATE_TESTS]))).eql([1,2]));
                it("can diff with replace of values", () => expect(patch.apply([1,2],diff.diff([1,2], [1,999], [DiffFlags.GENERATE_TESTS]))).eql([1,999]));
                it("can diff replace of object in array", () => expect(patch.apply([{a:1,b:2}],diff.diff([{a:1,b:2}],[{c:3}], [DiffFlags.GENERATE_TESTS]))).eql([{c:3}]));
                it("can diff with add of values of object in array", () => expect(patch.apply([{a:1,b:2}],diff.diff([{a:1,b:2}],[{a:1,b:2,c:3}], [DiffFlags.GENERATE_TESTS]))).eql([{a:1,b:2,c:3}]));
                it("can diff with remove of values of object in array", () => expect(patch.apply([{a:1,b:2,c:3}], diff.diff([{a:1,b:2,c:3}], [{a:1,b:2}], [DiffFlags.GENERATE_TESTS]))).eql([{a:1,b:2}]));
                it("can diff with replace of values of object in array", () => expect(patch.apply([{a:1,b:2}],diff.diff([{a:1,b:2}], [{a:1,b:999}], [DiffFlags.GENERATE_TESTS]))).eql([{a:1,b:999}]));
            });

            describe("deep array", () => {
                it("can diff deep changes", () => expect(patch.apply([0,1,[2,3,[4,5,[6,7]]]],diff.diff([0,1,[2,3,[4,5,[6,7]]]],[0,1,[2,3,[4,5,[6,7,8],9]]], [DiffFlags.GENERATE_TESTS]))).eql([0,1,[2,3,[4,5,[6,7,8],9]]]));
                it("can diff deep changes for object fields", () => expect(patch.apply([1,[2,[3,{a:1,b:2}]]],diff.diff([1,[2,[3,{a:1,b:2}]]],[1,[2,[3,{a:1,b:999}]]], [DiffFlags.GENERATE_TESTS]))).eql([1,[2,[3,{a:1,b:999}]]]));
            });

            describe("copy", () => {
                describe("array", () => {
                    it("can copy multiple after", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1], [DiffFlags.GENERATE_TESTS]))).eql([1,2,1,3,1,4,1,1,1]));
                    it("can copy multiple after with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL]))).eql([1,2,1,3,1,4,1,1,1]));
                    it("can copy multiple before", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4], [DiffFlags.GENERATE_TESTS]))).eql([1,1,1,1,2,1,3,1,4]));
                    it("can copy multiple before with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL]))).eql([1,1,1,1,2,1,3,1,4]));
                    it("can copy after", () => expect(patch.apply([1,2],diff.diff([1,2],[1,2,1], [DiffFlags.GENERATE_TESTS]))).eql([1,2,1]));
                    it("can copy before", () => expect(patch.apply([1,2],diff.diff([1,2],[1,1,2], [DiffFlags.GENERATE_TESTS]))).eql([1,1,2]));
                    it("can copy after multiple candidates", () => expect(patch.apply([1,1,2],diff.diff([1,1,2],[1,1,2,1], [DiffFlags.GENERATE_TESTS]))).eql([1,1,2,1]));
                    it("can copy before multiple candidates", () => expect(patch.apply([1,1,2],diff.diff([1,1,2],[1,1,1,2], [DiffFlags.GENERATE_TESTS]))).eql([1,1,1,2]));
                });

                describe("object", () => {
                    it("can move multiple", () => expect(patch.apply({a:1,b:2,c:1,d:3,e:1,f:4},diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {a:1,b:2,c:1,d:3,e:1,f:4,g:1,h:1,i:1}, [DiffFlags.GENERATE_TESTS]))).eql({a:1,b:2,c:1,d:3,e:1,f:4,g:1,h:1,i:1}));
                    it("can copy after", () => expect(patch.apply({a:1},diff.diff({a:1},{a:1,b:1}, [DiffFlags.GENERATE_TESTS]))).eql({a:1,b:1}));
                    it("can copy before", () => expect(patch.apply({a:1},diff.diff({a:1},{b:1,a:1}, [DiffFlags.GENERATE_TESTS]))).eql({b:1,a:1}));
                    it("can copy after multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{a:{b:1},b:1,c:1}, [DiffFlags.GENERATE_TESTS]))).eql({a:{b:1},b:1,c:1}));
                    it("can copy before multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{c:1,a:{b:1},b:1}, [DiffFlags.GENERATE_TESTS]))).eql({c:1,a:{b:1},b:1}));
                });
            });

            describe("move", () => {
                describe("array", () => {
                    it("can move multiple after", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1], [DiffFlags.GENERATE_TESTS]))).eql([2,3,4,1,1,1]));
                    it("can move multiple after with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL]))).eql([2,3,4,1,1,1]));
                    it("can move multiple before", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4], [DiffFlags.GENERATE_TESTS]))).eql([1,1,1,2,3,4]));
                    it("can move multiple before with literal", () => expect(patch.apply([1,2,1,3,1,4],diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL]))).eql([1,1,1,2,3,4]));
                    it("can move after", () => expect(patch.apply([1,2],diff.diff([1,2],[2,1], [DiffFlags.GENERATE_TESTS]))).eql([2,1]));
                    it("can move before", () => expect(patch.apply([2,1],diff.diff([2,1],[1,2], [DiffFlags.GENERATE_TESTS]))).eql([1,2]));
                    it("can move after multiple candidates", () => expect(patch.apply([0,1,1,2],diff.diff([0,1,1,2],[0,1,2,1], [DiffFlags.GENERATE_TESTS]))).eql([0,1,2,1]));
                    it("can move before multiple candidates", () => expect(patch.apply([0,1,1,2],diff.diff([0,1,1,2],[1,0,1,2], [DiffFlags.GENERATE_TESTS]))).eql([1,0,1,2]));
                });

                describe("object", () => {
                    it("can move multiple", () => expect(patch.apply({a:1,b:2,c:1,d:3,e:1,f:4}, diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {b:2,d:3,f:4,g:1,h:1,i:1}, [DiffFlags.GENERATE_TESTS]))).eql({b:2,d:3,f:4,g:1,h:1,i:1}));
                    it("can move after", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{b:2,c:1}, [DiffFlags.GENERATE_TESTS]))).eql({b:2,c:1}));
                    it("can move before", () => expect(patch.apply({a:1,b:2},diff.diff({a:1,b:2},{c:1,b:2}, [DiffFlags.GENERATE_TESTS]))).eql({c:1,b:2}));
                    it("can move after multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{a:{},b:1,c:1}, [DiffFlags.GENERATE_TESTS]))).eql({a:{},b:1,c:1}));
                    it("can move before multiple candidates", () => expect(patch.apply({a:{b:1},b:1},diff.diff({a:{b:1},b:1},{c:1,a:{},b:1}, [DiffFlags.GENERATE_TESTS]))).eql({c:1,a:{},b:1}));
                });
            });
        });
    });
});