import {expect} from "chai";
import {DiffProducer} from "../src/diff";
import {DiffFlags, ValueType} from "../src/types";

describe("diff", () => {
    let diff: DiffProducer = new DiffProducer();

    describe("getValueType", () => {
        it("returns array for array", () => {
            expect(ValueType.array).eql(diff.getValueType([]));
        });

        it("returns object for object", () => {
            expect(ValueType.object).eql(diff.getValueType({}));
        });

        it("returns primitive for other types", () => {
            expect(ValueType.primitive).eql(diff.getValueType(123));
            expect(ValueType.primitive).eql(diff.getValueType("abc"));
            expect(ValueType.primitive).eql(diff.getValueType(true));
            expect(ValueType.primitive).eql(diff.getValueType(false));
            expect(ValueType.undefined).eql(diff.getValueType(undefined));
        });
    });

    describe("getParentPath", () => {
        it("returns empty for parent path of empty", () => expect(diff.getParentPath("")).eql(""));
        it("returns empty for parent path of top node for object", () => expect(diff.getParentPath("/foo")).eql(""));
        it("returns parent for parent path of child node for object", () => expect(diff.getParentPath("/foo/bar")).eql("/foo"));
        it("returns parent for parent path of child of child node for object", () => expect(diff.getParentPath("/foo/bar/baz")).eql("/foo/bar"));
        it("returns empty for parent path of top node for array", () => expect(diff.getParentPath("/0")).eql(""));
        it("returns parent for parent path of child node for array", () => expect(diff.getParentPath("/0/1")).eql("/0"));
        it("returns parent for parent path of child of child node for array", () => expect(diff.getParentPath("/0/1/2")).eql("/0/1"));
    })

    describe("without test", () => {
        describe("empty", () => {
            it("can diff null with null", () => expect(diff.diff(null, null).length).eql(0));
            it("can diff false with false", () => expect(diff.diff(false, false).length).eql(0));
            it("can diff \"\" with \"\"", () => expect(diff.diff("", "").length).eql(0));
            it("can diff 0 with 0", () => expect(diff.diff(0, 0).length).eql(0));
            it("can diff undefined with undefined", () => expect(diff.diff(undefined, undefined).length).eql(0));
            it("can diff [] with []", () => expect(diff.diff([], []).length).eql(0));
            it("can diff {} with {}", () => expect(diff.diff({}, {}).length).eql(0));
            it("can diff null with false", () => expect(diff.diff(null, false)).eql([{op:"add",path:"",value:false}]));
            it("can diff false with null", () => expect(diff.diff(false, null)).eql([{op:"replace",path:"",value:null}]));
            it("can diff null with \"\"", () => expect(diff.diff(null, "")).eql([{op:"add",path:"",value:""}]));
            it("can diff \"\" with null", () => expect(diff.diff("", null)).eql([{op:"replace",path:"",value:null}]));
            it("can diff null with 0", () => expect(diff.diff(null, 0)).eql([{op:"add",path:"",value:0}]));
            it("can diff 0 with null", () => expect(diff.diff(0, null)).eql([{op:"replace",path:"",value:null}]));
            it("can diff null with undefined", () => expect(diff.diff(null, undefined)).eql([{op:"remove",path:""}]));
            it("can diff undefined with null", () => expect(diff.diff(undefined, null)).eql([{op:"add",path:"",value:null}]));
            it("can diff null with []", () => expect(diff.diff(null, [])).eql([{op:"add",path:"",value:[]}]));
            it("can diff [] with null", () => expect(diff.diff([], null)).eql([{op:"add",path:"",value:null}]));
            it("can diff null with {}", () => expect(diff.diff(null, {})).eql([{op:"add",path:"",value: {}}]));
            it("can diff {} with null", () => expect(diff.diff({}, null)).eql([{op:"add",path:"",value:null}]));
        });

        describe("primitives", () => {
            it("can diff string int", () => expect(diff.diff("abc", 123)).eql([{op:"replace",path:"",value:123}]));
            it("can diff string bool", () => expect(diff.diff("abc", true)).eql([{op:"replace",path:"",value:true}]));
            it("can diff string float", () => expect(diff.diff("abc", 34.789)).eql([{op:"replace",path:"",value:34.789}]));
            it("can diff string string", () => expect(diff.diff("abc", "xyz")).eql([{op:"replace",path:"",value:"xyz"}]));
            it("can diff string double", () => expect(diff.diff("abc", 3.14159265359)).eql([{op:"replace",path:"",value:3.14159265359}]));
            it("can diff int int", () => expect(diff.diff(7, 123)).eql([{op:"replace",path:"",value:123}]));
            it("can diff int bool", () => expect(diff.diff(7, true)).eql([{op:"replace",path:"",value:true}]));
            it("can diff int float", () => expect(diff.diff(7, 34.789)).eql([{op:"replace",path:"",value:34.789}]));
            it("can diff int string", () => expect(diff.diff(7, "xyz")).eql([{op:"replace",path:"",value:"xyz"}]));
            it("can diff int double", () => expect(diff.diff(7, 3.14159265359)).eql([{op:"replace",path:"",value:3.14159265359}]));
            it("can bool int int", () => expect(diff.diff(true, 123)).eql([{op:"replace",path:"",value:123}]));
            it("can bool int bool", () => expect(diff.diff(false, true)).eql([{op:"replace",path:"",value:true}]));
            it("can bool int float", () => expect(diff.diff(true, 34.789)).eql([{op:"replace",path:"",value:34.789}]));
            it("can bool int string", () => expect(diff.diff(true, "xyz")).eql([{op:"replace",path:"",value:"xyz"}]));
            it("can bool int double", () => expect(diff.diff(true, 3.14159265359)).eql([{op:"replace",path:"",value:3.14159265359}]));
            it("can float int int", () => expect(diff.diff(876.34, 123)).eql([{op:"replace",path:"",value:123}]));
            it("can float int bool", () => expect(diff.diff(876.34, true)).eql([{op:"replace",path:"",value:true}]));
            it("can float int float", () => expect(diff.diff(876.34, 34.789)).eql([{op:"replace",path:"",value:34.789}]));
            it("can float int string", () => expect(diff.diff(876.34, "xyz")).eql([{op:"replace",path:"",value:"xyz"}]));
            it("can float int double", () => expect(diff.diff(876.34, 3.14159265359)).eql([{op:"replace",path:"",value:3.14159265359}]));
            it("can double int int", () => expect(diff.diff(9.8726728819191, 123)).eql([{op:"replace",path:"",value:123}]));
            it("can double int bool", () => expect(diff.diff(9.8726728819191, true)).eql([{op:"replace",path:"",value:true}]));
            it("can double int float", () => expect(diff.diff(9.8726728819191, 34.789)).eql([{op:"replace",path:"",value:34.789}]));
            it("can double int string", () => expect(diff.diff(9.8726728819191, "xyz")).eql([{op:"replace",path:"",value:"xyz"}]));
            it("can double int double", () => expect(diff.diff(9.8726728819191, 3.14159265359)).eql([{op:"replace",path:"",value:3.14159265359}]));
        });

        describe("flat object", () => {
            it("can diff replace of root", () => expect(diff.diff({a:1,b:2},{c:3})).eql([{op:"replace",path:"",value:{c:3}}]));
            it("can diff with add of values", () => expect(diff.diff({a:1,b:2},{a:1,b:2,c:3})).eql([{op:"add",path:"/c",value:3}]));
            it("can diff with remove of values", () => expect(diff.diff({a:1,b:2,c:3}, {a:1,b:2})).eql([{op:"remove",path:"/c"}]));
            it("can diff with replace of values", () => expect(diff.diff({a:1,b:2}, {a:1,b:999})).eql([{op:"replace",path:"/b",value:999}]));
        });

        describe("deep object", () => {
            it("can diff with add of values", () => expect(diff.diff({c:{a:1,b:2}},{c:{a:1,b:2,c:3}})).eql([{op:"add",path:"/c/c",value:3}]));
            it("can diff with remove of values", () => expect(diff.diff({c:{a:1,b:2,c:3}}, {c:{a:1,b:2}})).eql([{op:"remove",path:"/c/c"}]));
            it("can diff with replace of values", () => expect(diff.diff({c:{a:1,b:2}}, {c:{a:1,b:999}})).eql([{op:"replace",path:"/c/b",value:999}]));
            it("can diff replace of array property", () => expect(diff.diff({a:[1,2]},{a:[3]})).eql([{op:"replace",path:"/a",value:[3]}]));
            it("can diff with add of values for array property", () => expect(diff.diff({a:[1,2]},{a:[1,2,3]})).eql([{op:"add",path:"/a/-",value:3}]));
            it("can diff with remove of values for array property", () => expect(diff.diff({a:[1,2,3]},{a:[1,2]})).eql([{op:"remove",path:"/a/2"}]));
            it("can diff with replace of values for array property", () => expect(diff.diff({a:[1,2]}, {a:[1,999]})).eql([{op:"replace",path:"/a/1",value:999}]));
            it("can diff replace of object in array for array property", () => expect(diff.diff({a:[{a:1,b:2}]},{a:[{c:3}]})).eql([{op:"replace",path:"/a/0",value:{c:3}}]));
        });

        describe("flat array", () => {
            it("can diff replace of root", () => expect(diff.diff([1,2],[3])).eql([{op:"replace",path:"",value:[3]}]));
            it("can diff with add of values", () => expect(diff.diff([1,2],[1,2,3])).eql([{op:"add",path:"/-",value:3}]));
            it("can diff with remove of values", () => expect(diff.diff([1,2,3], [1,2])).eql([{op:"remove",path:"/2"}]));
            it("can diff with replace of values", () => expect(diff.diff([1,2], [1,999])).eql([{op:"replace",path:"/1",value:999}]));
            it("can diff replace of object in array", () => expect(diff.diff([{a:1,b:2}],[{c:3}])).eql([{op:"replace",path:"/0",value:{c:3}}]));
            it("can diff with add of values of object in array", () => expect(diff.diff([{a:1,b:2}],[{a:1,b:2,c:3}])).eql([{op:"add",path:"/0/c",value:3}]));
            it("can diff with remove of values of object in array", () => expect(diff.diff([{a:1,b:2,c:3}], [{a:1,b:2}])).eql([{op:"remove",path:"/0/c"}]));
            it("can diff with replace of values of object in array", () => expect(diff.diff([{a:1,b:2}], [{a:1,b:999}])).eql([{op:"replace",path:"/0/b",value:999}]));
        });

        describe("deep array", () => {
            it("can diff deep changes", () => expect(diff.diff([0,1,[2,3,[4,5,[6,7]]]],[0,1,[2,3,[4,5,[6,7,8],9]]])).eql([{op:"add",path: "/2/2/2/-",value: 8},{op: "add",path: "/2/2/-",value: 9}]));
            it("can diff deep chagnes for object fields", () => expect(diff.diff([1,[2,[3,{a:1,b:2}]]],[1,[2,[3,{a:1,b:999}]]])).eql([{op:"replace",path:"/1/1/1/b",value:999}]));
        });

        describe("copy", () => {
            describe("array", () => {
                it("can copy multiple after", () => expect(diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1])).eql([
                    {op:"copy",from:"/0",path:"/-"},{op:"copy",from:"/0",path:"/-"},{op:"copy",from:"/0",path:"/-"}]));
                it("can copy multiple after with literal", () => expect(diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1], [DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {op:"copy",from:"/0",path:"/6"},{op:"copy",from:"/0",path:"/7"},{op:"copy",from:"/0",path:"/8"}]));
                it("can copy multiple before", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4])).eql([
                    {op:"copy",from:"/0",path:"/1"},{op:"copy",from:"/0",path:"/2"},{op:"copy",from:"/0",path:"/3"}]));
                it("can copy multiple before with literal", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4], [DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {op:"copy",from:"/0",path:"/1"},{op:"copy",from:"/0",path:"/2"},{op:"copy",from:"/0",path:"/3"}]));
                it("can copy after", () => expect(diff.diff([1,2],[1,2,1])).eql([{op:"copy",from:"/0",path:"/-"}]));
                it("can copy before", () => expect(diff.diff([1,2],[1,1,2])).eql([{op:"copy",from:"/0",path:"/1"}]));
                it("can copy after multiple candidates", () => expect(diff.diff([1,1,2],[1,1,2,1])).eql([{op:"copy",from:"/0",path:"/-"}]));
                it("can copy before multiple candidates", () => expect(diff.diff([1,1,2],[1,1,1,2])).eql([{op:"copy",from:"/0",path:"/2"}]));
            });

            describe("object", () => {
                it("can move multiple", () => expect(diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {a:1,b:2,c:1,d:3,e:1,f:4,g:1,h:1,i:1})).eql([
                    {op:"copy",from:"/a",path:"/g"},{op:"copy",from:"/a",path:"/h"},{op:"copy",from:"/a",path:"/i"}]));
                it("can copy after", () => expect(diff.diff({a:1},{a:1,b:1})).eql([{op:"copy",from:"/a",path:"/b"}]));
                it("can copy before", () => expect(diff.diff({a:1},{b:1,a:1})).eql([{op:"copy",from:"/a",path:"/b"}]));
                it("can copy after multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{a:{b:1},b:1,c:1})).eql([{op:"copy",from:"/a/b",path:"/c"}]));
                it("can copy before multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{c:1,a:{b:1},b:1})).eql([{op:"copy",from:"/a/b",path:"/c"}]));
            });
        });

        describe("move", () => {
            describe("array", () => {
                it("can move multiple after", () => expect(diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1])).eql([
                    {op:"move",from:"/0",path:"/4"},{op:"move",from:"/2",path:"/1"},{op:"move",from:"/5",path:"/2"}]));
                it("can move multiple after with literal", () => expect(diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1], [DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {op:"move",from:"/0",path:"/4"},{op:"move",from:"/2",path:"/1"},{op:"move",from:"/5",path:"/2"}]));
                it("can move multiple before", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4])).eql([
                        {op:"move",from:"/4",path:"/1"},{op:"move",from:"/2",path:"/3"}]));
                it("can move multiple before with literal", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4], [DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {op:"move",from:"/4",path:"/1"},{op:"move",from:"/2",path:"/3"}]));
                it("can move after", () => expect(diff.diff([1,2],[2,1])).eql([{op:"move",from:"/1",path:"/0"}]));
                it("can move before", () => expect(diff.diff([2,1],[1,2])).eql([{op:"move",from:"/1",path:"/0"}]));
                it("can move after multiple candidates", () => expect(diff.diff([0,1,1,2],[0,1,2,1])).eql([{op:"move",from:"/3",path:"/2"}]));
                it("can move before multiple candidates", () => expect(diff.diff([0,1,1,2],[1,0,1,2])).eql([{op:"move",from:"/2",path:"/0"}]));
            });

            describe("object", () => {
                it("can move multiple", () => expect(diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {b:2,d:3,f:4,g:1,h:1,i:1})).eql([
                    {op:"move",from:"/a",path:"/g"},{op:"move",from:"/c",path:"/h"},{op:"move",from:"/e",path:"/i"}]));
                it("can move after", () => expect(diff.diff({a:1,b:2},{b:2,c:1})).eql([{op:"move",from:"/a",path:"/c"}]));
                it("can move before", () => expect(diff.diff({a:1,b:2},{c:1,b:2})).eql([{op:"move",from:"/a",path:"/c"}]));
                it("can move after multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{a:{},b:1,c:1})).eql([{op:"move",from:"/a/b",path:"/c"}]));
                it("can move before multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{c:1,a:{},b:1})).eql([{op:"move",from:"/a/b",path:"/c"}]));
            });
        });
    });

    describe("with test", () => {
        describe("empty", () => {
            it("can diff null with null", () => expect(diff.diff(null, null, [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff false with false", () => expect(diff.diff(false, false, [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff \"\" with \"\"", () => expect(diff.diff("", "", [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff 0 with 0", () => expect(diff.diff(0, 0, [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff undefined with undefined", () => expect(diff.diff(undefined, undefined, [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff [] with []", () => expect(diff.diff([], [], [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff {} with {}", () => expect(diff.diff({}, {}, [DiffFlags.GENERATE_TESTS]).length).eql(0));
            it("can diff null with false", () => expect(diff.diff(null, false, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:null},{op:"add",path:"",value:false}]));
            it("can diff false with null", () => expect(diff.diff(false, null, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:false},{op:"replace",path:"",value:null}]));
            it("can diff null with \"\"", () => expect(diff.diff(null, "", [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:null},{op:"add",path:"",value:""}]));
            it("can diff \"\" with null", () => expect(diff.diff("", null, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:""},{op:"replace",path:"",value:null}]));
            it("can diff null with 0", () => expect(diff.diff(null, 0, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:null},{op:"add",path:"",value:0}]));
            it("can diff 0 with null", () => expect(diff.diff(0, null, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:0},{op:"replace",path:"",value:null}]));
            it("can diff null with undefined", () => expect(diff.diff(null, undefined, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:null},{op:"remove",path:""}]));
            it("can diff undefined with null", () => expect(diff.diff(undefined, null, [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path:"",value:null}]));
            it("can diff null with []", () => expect(diff.diff(null, [], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:null},{op:"add",path:"",value:[]}]));
            it("can diff [] with null", () => expect(diff.diff([], null, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:[]},{op:"add",path:"",value:null}]));
            it("can diff null with {}", () => expect(diff.diff(null, {}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:null},{op:"add",path:"",value: {}}]));
            it("can diff {} with null", () => expect(diff.diff({}, null, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value: {}},{op:"add",path:"",value:null}]));
        });

        describe("primitives", () => {
            it("can diff string int", () => expect(diff.diff("abc", 123, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:"abc"},{op:"replace",path:"",value:123}]));
            it("can diff string bool", () => expect(diff.diff("abc", true, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:"abc"},{op:"replace",path:"",value:true}]));
            it("can diff string float", () => expect(diff.diff("abc", 34.789, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:"abc"},{op:"replace",path:"",value:34.789}]));
            it("can diff string string", () => expect(diff.diff("abc", "xyz", [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:"abc"},{op:"replace",path:"",value:"xyz"}]));
            it("can diff string double", () => expect(diff.diff("abc", 3.14159265359, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:"abc"},{op:"replace",path:"",value:3.14159265359}]));
            it("can diff int int", () => expect(diff.diff(7, 123, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:7},{op:"replace",path:"",value:123}]));
            it("can diff int bool", () => expect(diff.diff(7, true, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:7},{op:"replace",path:"",value:true}]));
            it("can diff int float", () => expect(diff.diff(7, 34.789, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:7},{op:"replace",path:"",value:34.789}]));
            it("can diff int string", () => expect(diff.diff(7, "xyz", [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:7},{op:"replace",path:"",value:"xyz"}]));
            it("can diff int double", () => expect(diff.diff(7, 3.14159265359, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:7},{op:"replace",path:"",value:3.14159265359}]));
            it("can bool int int", () => expect(diff.diff(true, 123, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:true},{op:"replace",path:"",value:123}]));
            it("can bool int bool", () => expect(diff.diff(false, true, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:false},{op:"replace",path:"",value:true}]));
            it("can bool int float", () => expect(diff.diff(true, 34.789, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:true},{op:"replace",path:"",value:34.789}]));
            it("can bool int string", () => expect(diff.diff(true, "xyz", [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:true},{op:"replace",path:"",value:"xyz"}]));
            it("can bool int double", () => expect(diff.diff(true, 3.14159265359, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:true},{op:"replace",path:"",value:3.14159265359}]));
            it("can float int int", () => expect(diff.diff(876.34, 123, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:876.34},{op:"replace",path:"",value:123}]));
            it("can float int bool", () => expect(diff.diff(876.34, true, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:876.34},{op:"replace",path:"",value:true}]));
            it("can float int float", () => expect(diff.diff(876.34, 34.789, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:876.34},{op:"replace",path:"",value:34.789}]));
            it("can float int string", () => expect(diff.diff(876.34, "xyz", [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:876.34},{op:"replace",path:"",value:"xyz"}]));
            it("can float int double", () => expect(diff.diff(876.34, 3.14159265359, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:876.34},{op:"replace",path:"",value:3.14159265359}]));
            it("can double int int", () => expect(diff.diff(9.8726728819191, 123, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:9.8726728819191},{op:"replace",path:"",value:123}]));
            it("can double int bool", () => expect(diff.diff(9.8726728819191, true, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:9.8726728819191},{op:"replace",path:"",value:true}]));
            it("can double int float", () => expect(diff.diff(9.8726728819191, 34.789, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:9.8726728819191},{op:"replace",path:"",value:34.789}]));
            it("can double int string", () => expect(diff.diff(9.8726728819191, "xyz", [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:9.8726728819191},{op:"replace",path:"",value:"xyz"}]));
            it("can double int double", () => expect(diff.diff(9.8726728819191, 3.14159265359, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:9.8726728819191},{op:"replace",path:"",value:3.14159265359}]));
        });

        describe("flat object", () => {
            it("can diff replace of root", () => expect(diff.diff({a:1,b:2},{c:3}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:{a:1,b:2}},{op:"replace",path:"",value:{c:3}}]));
            it("can diff with add of values", () => expect(diff.diff({a:1,b:2},{a:1,b:2,c:3}, [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path:"/c",value:3}]));
            it("can diff with remove of values", () => expect(diff.diff({a:1,b:2,c:3}, {a:1,b:2}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/c",value:3},{op:"remove",path:"/c"}]));
            it("can diff with replace of values", () => expect(diff.diff({a:1,b:2}, {a:1,b:999}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/b",value:2},{op:"replace",path:"/b",value:999}]));
        });

        describe("deep object", () => {
            it("can diff with add of values", () => expect(diff.diff({c:{a:1,b:2}},{c:{a:1,b:2,c:3}}, [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path:"/c/c",value:3}]));
            it("can diff with remove of values", () => expect(diff.diff({c:{a:1,b:2,c:3}}, {c:{a:1,b:2}}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/c/c",value:3},{op:"remove",path:"/c/c"}]));
            it("can diff with replace of values", () => expect(diff.diff({c:{a:1,b:2}}, {c:{a:1,b:999}}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/c/b",value:2},{op:"replace",path:"/c/b",value:999}]));
            it("can diff replace of array property", () => expect(diff.diff({a:[1,2]},{a:[3]}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/a",value:[1,2]},{op:"replace",path:"/a",value:[3]}]));
            it("can diff with add of values for array property", () => expect(diff.diff({a:[1,2]},{a:[1,2,3]}, [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path:"/a/-",value:3}]));
            it("can diff with remove of values for array property", () => expect(diff.diff({a:[1,2,3]},{a:[1,2]}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/a/2",value:3},{op:"remove",path:"/a/2"}]));
            it("can diff with replace of values for array property", () => expect(diff.diff({a:[1,2]}, {a:[1,999]}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/a/1",value:2},{op:"replace",path:"/a/1",value:999}]));
            it("can diff replace of object in array for array property", () => expect(diff.diff({a:[{a:1,b:2}]},{a:[{c:3}]}, [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/a/0",value:{a:1,b:2}},{op:"replace",path:"/a/0",value:{c:3}}]));
        });

        describe("flat array", () => {
            it("can diff replace of root", () => expect(diff.diff([1,2],[3], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"",value:[1,2]},{op:"replace",path:"",value:[3]}]));
            it("can diff with add of values", () => expect(diff.diff([1,2],[1,2,3], [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path:"/-",value:3}]));
            it("can diff with remove of values", () => expect(diff.diff([1,2,3], [1,2], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/2",value:3},{op:"remove",path:"/2"}]));
            it("can diff with replace of values", () => expect(diff.diff([1,2], [1,999], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/1",value:2},{op:"replace",path:"/1",value:999}]));
            it("can diff replace of object in array", () => expect(diff.diff([{a:1,b:2}],[{c:3}], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/0",value:{a:1,b:2}},{op:"replace",path:"/0",value:{c:3}}]));
            it("can diff with add of values of object in array", () => expect(diff.diff([{a:1,b:2}],[{a:1,b:2,c:3}], [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path:"/0/c",value:3}]));
            it("can diff with remove of values of object in array", () => expect(diff.diff([{a:1,b:2,c:3}], [{a:1,b:2}], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/0/c",value:3},{op:"remove",path:"/0/c"}]));
            it("can diff with replace of values of object in array", () => expect(diff.diff([{a:1,b:2}], [{a:1,b:999}], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/0/b",value:2},{op:"replace",path:"/0/b",value:999}]));
        });

        describe("deep array", () => {
            it("can diff deep changes", () => expect(diff.diff([0,1,[2,3,[4,5,[6,7]]]],[0,1,[2,3,[4,5,[6,7,8],9]]], [DiffFlags.GENERATE_TESTS])).eql([{op:"add",path: "/2/2/2/-",value: 8},{op: "add",path: "/2/2/-",value: 9}]));
            it("can diff deep changes for object fields", () => expect(diff.diff([1,[2,[3,{a:1,b:2}]]],[1,[2,[3,{a:1,b:999}]]], [DiffFlags.GENERATE_TESTS])).eql([{op:"test",path:"/1/1/1/b",value:2},{op:"replace",path:"/1/1/1/b",value:999}]));
        });

        describe("copy", () => {
            describe("array", () => {
                it("can copy multiple after", () => expect(diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/-"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/-"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/-"}]));
                it("can copy multiple after with literal", () => expect(diff.diff([1,2,1,3,1,4],[1,2,1,3,1,4,1,1,1], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/6"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/7"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/8"}]));
                it("can copy multiple before", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/1"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/2"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/3"}]));
                it("can copy multiple before with literal", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,1,2,1,3,1,4], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/1"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/2"},
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/3"}]));
                it("can copy after", () => expect(diff.diff([1,2],[1,2,1], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/-"}]));
                it("can copy before", () => expect(diff.diff([1,2],[1,1,2], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/1"}]));
                it("can copy after multiple candidates", () => expect(diff.diff([1,1,2],[1,1,2,1], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/-"}]));
                it("can copy before multiple candidates", () => expect(diff.diff([1,1,2],[1,1,1,2], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},
                    {op:"copy",from:"/0",path:"/2"}]));
            });

            describe("object", () => {
                it("can move multiple", () => expect(diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {a:1,b:2,c:1,d:3,e:1,f:4,g:1,h:1,i:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a","value":1},
                    {op:"copy",from:"/a",path:"/g"},
                    {"op":"test","path":"/a","value":1},
                    {op:"copy",from:"/a",path:"/h"},
                    {"op":"test","path":"/a","value":1},
                    {op:"copy",from:"/a",path:"/i"}]));
                it("can copy after", () => expect(diff.diff({a:1},{a:1,b:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a","value":1},
                    {op:"copy",from:"/a",path:"/b"}]));
                it("can copy before", () => expect(diff.diff({a:1},{b:1,a:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a","value":1},
                    {op:"copy",from:"/a",path:"/b"}]));
                it("can copy after multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{a:{b:1},b:1,c:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a/b","value":1},
                    {op:"copy",from:"/a/b",path:"/c"}]));
                it("can copy before multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{c:1,a:{b:1},b:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a/b","value":1},
                    {op:"copy",from:"/a/b",path:"/c"}]));
            });
        });

        describe("move", () => {
            describe("array", () => {
                it("can move multiple after", () => expect(diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/0","value":1},{"from":"/0","op":"move","path":"/4"},
                    {"op":"test","path":"/2","value":3},{"from":"/2","op":"move","path":"/1"},
                    {"op":"test","path":"/5","value":4},{"from":"/5","op":"move","path":"/2"}]));
                it("can move multiple after with literal", () => expect(diff.diff([1,2,1,3,1,4],[2,3,4,1,1,1], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {"op":"test","path":"/0","value":1},{"from":"/0","op":"move","path":"/4"},
                    {"op":"test","path":"/2","value":3},{"from":"/2","op":"move","path":"/1"},
                    {"op":"test","path":"/5","value":4},{"from":"/5","op":"move","path":"/2"}]));
                it("can move multiple before", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/4","value":1},{"from":"/4","op":"move","path":"/1"},
                    {"op":"test","path":"/2","value":2},{"from":"/2","op":"move","path":"/3"}]));
                it("can move multiple before with literal", () => expect(diff.diff([1,2,1,3,1,4],[1,1,1,2,3,4], [DiffFlags.GENERATE_TESTS, DiffFlags.ARRAY_INDEX_LITERAL])).eql([
                    {"op":"test","path":"/4","value":1},{"from":"/4","op":"move","path":"/1"},
                    {"op":"test","path":"/2","value":2},{"from":"/2","op":"move","path":"/3"}]));
                it("can move after", () => expect(diff.diff([1,2],[2,1], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/1","value":2},{"from":"/1","op":"move","path":"/0"}]));
                it("can move before", () => expect(diff.diff([2,1],[1,2], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/1","value":1},{"from":"/1","op":"move","path":"/0"}]));
                it("can move after multiple candidates", () => expect(diff.diff([0,1,1,2],[0,1,2,1], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/3","value":2},{"from":"/3","op":"move","path":"/2"}]));
                it("can move before multiple candidates", () => expect(diff.diff([0,1,1,2],[1,0,1,2], [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/2","value":1},{"from":"/2","op":"move","path":"/0"}]));
            });

            describe("object", () => {
                it("can move multiple", () => expect(diff.diff({a:1,b:2,c:1,d:3,e:1,f:4}, {b:2,d:3,f:4,g:1,h:1,i:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a","value":1},{op:"move",from:"/a",path:"/g"},
                    {"op":"test","path":"/c","value":1},{op:"move",from:"/c",path:"/h"},
                    {"op":"test","path":"/e","value":1},{op:"move",from:"/e",path:"/i"}]));
                it("can move after", () => expect(diff.diff({a:1,b:2},{b:2,c:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a","value":1},{op:"move",from:"/a",path:"/c"}]));
                it("can move before", () => expect(diff.diff({a:1,b:2},{c:1,b:2}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a","value":1},{op:"move",from:"/a",path:"/c"}]));
                it("can move after multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{a:{},b:1,c:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a/b","value":1},{op:"move",from:"/a/b",path:"/c"}]));
                it("can move before multiple candidates", () => expect(diff.diff({a:{b:1},b:1},{c:1,a:{},b:1}, [DiffFlags.GENERATE_TESTS])).eql([
                    {"op":"test","path":"/a/b","value":1},{op:"move",from:"/a/b",path:"/c"}]));
            });
        });
    });
});