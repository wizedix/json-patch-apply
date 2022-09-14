import {expect} from "chai";
import {Patch} from "../index";
import {PatchFlags, DiffFlags} from "../src/common";

/**
 * DO NOT CHANGE - changes will be lost!
 * dynamically generated using generate_conformance.ts script see README.md file
 * for details on how to re-generate or change this file.
 */

describe("conformance", () => {
   function runApplyTest(doc: any, patch: any[], error: any, expected: any, flags?:PatchFlags[]) {
      try {
         let result = Patch.apply(doc, patch, flags);
         if(error) {
            throw new Error("Missing error: " + error);
         } else {
            expect(result).eql(expected);
         }
      } catch(e) {
         if(error) {
             expect(!!e.message, error).be.true;
         } else {
            expect("Unexpected error: " + e.message + ", missing expected: " + JSON.stringify(expected)).eql('to pass');
         }
      }
   }
   function runDiffTest(source: any, target: any, expected: any[], flags?:DiffFlags[]) {
      let patch = Patch.diff(source, target, flags);
      expect(patch).eql(expected);
   }
   describe("tests.json - main tests", () => {
      it("tests.json #0 - apply empty list, empty docs for test {\"comment\":\"empty list, empty docs\",\"doc\":{},\"patch\":[],\"expected\":{}}", () => {
         runApplyTest({}, [], undefined, {});
      });
      it("tests.json #0 - diff empty list, empty docs for test {\"comment\":\"empty list, empty docs\",\"doc\":{},\"patch\":[],\"expected\":{}}", () => {
         runDiffTest({}, {}, []);
      });
      it("tests.json #1 - apply empty patch list for test {\"comment\":\"empty patch list\",\"doc\":{\"foo\":1},\"patch\":[],\"expected\":{\"foo\":1}}", () => {
         runApplyTest({"foo":1}, [], undefined, {"foo":1});
      });
      it("tests.json #1 - diff empty patch list for test {\"comment\":\"empty patch list\",\"doc\":{\"foo\":1},\"patch\":[],\"expected\":{\"foo\":1}}", () => {
         runDiffTest({"foo":1}, {"foo":1}, []);
      });
      it("tests.json #2 - apply rearrangements OK? for test {\"comment\":\"rearrangements OK?\",\"doc\":{\"foo\":1,\"bar\":2},\"patch\":[],\"expected\":{\"bar\":2,\"foo\":1}}", () => {
         runApplyTest({"foo":1,"bar":2}, [], undefined, {"bar":2,"foo":1});
      });
      it("tests.json #2 - diff rearrangements OK? for test {\"comment\":\"rearrangements OK?\",\"doc\":{\"foo\":1,\"bar\":2},\"patch\":[],\"expected\":{\"bar\":2,\"foo\":1}}", () => {
         runDiffTest({"foo":1,"bar":2}, {"bar":2,"foo":1}, []);
      });
      it("tests.json #3 - apply rearrangements OK?  How about one level down ... array for test {\"comment\":\"rearrangements OK?  How about one level down ... array\",\"doc\":[{\"foo\":1,\"bar\":2}],\"patch\":[],\"expected\":[{\"bar\":2,\"foo\":1}]}", () => {
         runApplyTest([{"foo":1,"bar":2}], [], undefined, [{"bar":2,"foo":1}]);
      });
      it("tests.json #3 - diff rearrangements OK?  How about one level down ... array for test {\"comment\":\"rearrangements OK?  How about one level down ... array\",\"doc\":[{\"foo\":1,\"bar\":2}],\"patch\":[],\"expected\":[{\"bar\":2,\"foo\":1}]}", () => {
         runDiffTest([{"foo":1,"bar":2}], [{"bar":2,"foo":1}], []);
      });
      it("tests.json #4 - apply rearrangements OK?  How about one level down... for test {\"comment\":\"rearrangements OK?  How about one level down...\",\"doc\":{\"foo\":{\"foo\":1,\"bar\":2}},\"patch\":[],\"expected\":{\"foo\":{\"bar\":2,\"foo\":1}}}", () => {
         runApplyTest({"foo":{"foo":1,"bar":2}}, [], undefined, {"foo":{"bar":2,"foo":1}});
      });
      it("tests.json #4 - diff rearrangements OK?  How about one level down... for test {\"comment\":\"rearrangements OK?  How about one level down...\",\"doc\":{\"foo\":{\"foo\":1,\"bar\":2}},\"patch\":[],\"expected\":{\"foo\":{\"bar\":2,\"foo\":1}}}", () => {
         runDiffTest({"foo":{"foo":1,"bar":2}}, {"foo":{"bar":2,"foo":1}}, []);
      });
      it("tests.json #5 - apply add replaces any existing field for test {\"comment\":\"add replaces any existing field\",\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"add\",\"path\":\"/foo\",\"value\":1}],\"expected\":{\"foo\":1}}", () => {
         runApplyTest({"foo":null}, [{"op":"add","path":"/foo","value":1}], undefined, {"foo":1});
      });
      it("tests.json #5 - diff add replaces any existing field for test {\"comment\":\"add replaces any existing field\",\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"add\",\"path\":\"/foo\",\"value\":1}],\"expected\":{\"foo\":1}}", () => {
         runDiffTest({"foo":null}, {"foo":1}, [{"op":"add","path":"/foo","value":1}]);
      });
      it("tests.json #6 - apply toplevel array for test {\"comment\":\"toplevel array\",\"doc\":[],\"patch\":[{\"op\":\"add\",\"path\":\"/0\",\"value\":\"foo\"}],\"expected\":[\"foo\"]}", () => {
         runApplyTest([], [{"op":"add","path":"/0","value":"foo"}], undefined, ["foo"]);
      });
      it("tests.json #6 - diff toplevel array for test {\"comment\":\"toplevel array\",\"doc\":[],\"patch\":[{\"op\":\"add\",\"path\":\"/0\",\"value\":\"foo\"}],\"expected\":[\"foo\"]}", () => {
         runDiffTest([], ["foo"], [{"op":"add","path":"/0","value":"foo"}], [0]);
      });
      it("tests.json #7 - apply toplevel array, no change for test {\"comment\":\"toplevel array, no change\",\"doc\":[\"foo\"],\"patch\":[],\"expected\":[\"foo\"]}", () => {
         runApplyTest(["foo"], [], undefined, ["foo"]);
      });
      it("tests.json #7 - diff toplevel array, no change for test {\"comment\":\"toplevel array, no change\",\"doc\":[\"foo\"],\"patch\":[],\"expected\":[\"foo\"]}", () => {
         runDiffTest(["foo"], ["foo"], []);
      });
      it("tests.json #8 - apply toplevel object, numeric string for test {\"comment\":\"toplevel object, numeric string\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"/foo\",\"value\":\"1\"}],\"expected\":{\"foo\":\"1\"}}", () => {
         runApplyTest({}, [{"op":"add","path":"/foo","value":"1"}], undefined, {"foo":"1"});
      });
      it("tests.json #8 - diff toplevel object, numeric string for test {\"comment\":\"toplevel object, numeric string\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"/foo\",\"value\":\"1\"}],\"expected\":{\"foo\":\"1\"}}", () => {
         runDiffTest({}, {"foo":"1"}, [{"op":"add","path":"/foo","value":"1"}]);
      });
      it("tests.json #9 - apply toplevel object, integer for test {\"comment\":\"toplevel object, integer\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"/foo\",\"value\":1}],\"expected\":{\"foo\":1}}", () => {
         runApplyTest({}, [{"op":"add","path":"/foo","value":1}], undefined, {"foo":1});
      });
      it("tests.json #9 - diff toplevel object, integer for test {\"comment\":\"toplevel object, integer\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"/foo\",\"value\":1}],\"expected\":{\"foo\":1}}", () => {
         runDiffTest({}, {"foo":1}, [{"op":"add","path":"/foo","value":1}]);
      });
      xit("tests.json #10 - apply Toplevel scalar values OK? for test {\"comment\":\"Toplevel scalar values OK?\",\"doc\":\"foo\",\"patch\":[{\"op\":\"replace\",\"path\":\"\",\"value\":\"bar\"}],\"expected\":\"bar\",\"disabled\":true}", () => {
         runApplyTest("foo", [{"op":"replace","path":"","value":"bar"}], undefined, "bar");
      });
      xit("tests.json #10 - diff Toplevel scalar values OK? for test {\"comment\":\"Toplevel scalar values OK?\",\"doc\":\"foo\",\"patch\":[{\"op\":\"replace\",\"path\":\"\",\"value\":\"bar\"}],\"expected\":\"bar\",\"disabled\":true}", () => {
         runDiffTest("foo", "bar", [{"op":"replace","path":"","value":"bar"}]);
      });
      it("tests.json #11 - apply replace object document with array document? for test {\"comment\":\"replace object document with array document?\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"\",\"value\":[]}],\"expected\":[]}", () => {
         runApplyTest({}, [{"op":"add","path":"","value":[]}], undefined, []);
      });
      it("tests.json #11 - diff replace object document with array document? for test {\"comment\":\"replace object document with array document?\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"\",\"value\":[]}],\"expected\":[]}", () => {
         runDiffTest({}, [], [{"op":"add","path":"","value":[]}]);
      });
      it("tests.json #12 - apply replace array document with object document? for test {\"comment\":\"replace array document with object document?\",\"doc\":[],\"patch\":[{\"op\":\"add\",\"path\":\"\",\"value\":{}}],\"expected\":{}}", () => {
         runApplyTest([], [{"op":"add","path":"","value":{}}], undefined, {});
      });
      it("tests.json #12 - diff replace array document with object document? for test {\"comment\":\"replace array document with object document?\",\"doc\":[],\"patch\":[{\"op\":\"add\",\"path\":\"\",\"value\":{}}],\"expected\":{}}", () => {
         runDiffTest([], {}, [{"op":"add","path":"","value":{}}]);
      });
      it("tests.json #13 - apply append to root array document? for test {\"comment\":\"append to root array document?\",\"doc\":[],\"patch\":[{\"op\":\"add\",\"path\":\"/-\",\"value\":\"hi\"}],\"expected\":[\"hi\"]}", () => {
         runApplyTest([], [{"op":"add","path":"/-","value":"hi"}], undefined, ["hi"]);
      });
      it("tests.json #13 - diff append to root array document? for test {\"comment\":\"append to root array document?\",\"doc\":[],\"patch\":[{\"op\":\"add\",\"path\":\"/-\",\"value\":\"hi\"}],\"expected\":[\"hi\"]}", () => {
         runDiffTest([], ["hi"], [{"op":"add","path":"/-","value":"hi"}]);
      });
      it("tests.json #14 - apply Add, / target for test {\"comment\":\"Add, / target\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"/\",\"value\":1}],\"expected\":{\"\":1}}", () => {
         runApplyTest({}, [{"op":"add","path":"/","value":1}], undefined, {"":1});
      });
      it("tests.json #14 - diff Add, / target for test {\"comment\":\"Add, / target\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"/\",\"value\":1}],\"expected\":{\"\":1}}", () => {
         runDiffTest({}, {"":1}, [{"op":"add","path":"/","value":1}]);
      });
      it("tests.json #15 - apply Add, /foo/ deep target (trailing slash) for test {\"comment\":\"Add, /foo/ deep target (trailing slash)\",\"doc\":{\"foo\":{}},\"patch\":[{\"op\":\"add\",\"path\":\"/foo/\",\"value\":1}],\"expected\":{\"foo\":{\"\":1}}}", () => {
         runApplyTest({"foo":{}}, [{"op":"add","path":"/foo/","value":1}], undefined, {"foo":{"":1}});
      });
      it("tests.json #15 - diff Add, /foo/ deep target (trailing slash) for test {\"comment\":\"Add, /foo/ deep target (trailing slash)\",\"doc\":{\"foo\":{}},\"patch\":[{\"op\":\"add\",\"path\":\"/foo/\",\"value\":1}],\"expected\":{\"foo\":{\"\":1}}}", () => {
         runDiffTest({"foo":{}}, {"foo":{"":1}}, [{"op":"add","path":"/foo/","value":1}]);
      });
      it("tests.json #16 - apply Add composite value at top level for test {\"comment\":\"Add composite value at top level\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":[1,2]}],\"expected\":{\"foo\":1,\"bar\":[1,2]}}", () => {
         runApplyTest({"foo":1}, [{"op":"add","path":"/bar","value":[1,2]}], undefined, {"foo":1,"bar":[1,2]});
      });
      it("tests.json #16 - diff Add composite value at top level for test {\"comment\":\"Add composite value at top level\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":[1,2]}],\"expected\":{\"foo\":1,\"bar\":[1,2]}}", () => {
         runDiffTest({"foo":1}, {"foo":1,"bar":[1,2]}, [{"op":"add","path":"/bar","value":[1,2]}]);
      });
      it("tests.json #17 - apply Add into composite value for test {\"comment\":\"Add into composite value\",\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"add\",\"path\":\"/baz/0/foo\",\"value\":\"world\"}],\"expected\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\",\"foo\":\"world\"}]}}", () => {
         runApplyTest({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"add","path":"/baz/0/foo","value":"world"}], undefined, {"foo":1,"baz":[{"qux":"hello","foo":"world"}]});
      });
      it("tests.json #17 - diff Add into composite value for test {\"comment\":\"Add into composite value\",\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"add\",\"path\":\"/baz/0/foo\",\"value\":\"world\"}],\"expected\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\",\"foo\":\"world\"}]}}", () => {
         runDiffTest({"foo":1,"baz":[{"qux":"hello"}]}, {"foo":1,"baz":[{"qux":"hello","foo":"world"}]}, [{"op":"add","path":"/baz/0/foo","value":"world"}]);
      });
      it("tests.json #18 - apply for test {\"doc\":{\"bar\":[1,2]},\"patch\":[{\"op\":\"add\",\"path\":\"/bar/8\",\"value\":\"5\"}],\"error\":\"Out of bounds (upper)\"}", () => {
         runApplyTest({"bar":[1,2]}, [{"op":"add","path":"/bar/8","value":"5"}], "Out of bounds (upper)", undefined);
      });
      it("tests.json #19 - apply for test {\"doc\":{\"bar\":[1,2]},\"patch\":[{\"op\":\"add\",\"path\":\"/bar/-1\",\"value\":\"5\"}],\"error\":\"Out of bounds (lower)\"}", () => {
         runApplyTest({"bar":[1,2]}, [{"op":"add","path":"/bar/-1","value":"5"}], "Out of bounds (lower)", undefined);
      });
      it("tests.json #20 - apply for test {\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":true}],\"expected\":{\"foo\":1,\"bar\":true}}", () => {
         runApplyTest({"foo":1}, [{"op":"add","path":"/bar","value":true}], undefined, {"foo":1,"bar":true});
      });
      it("tests.json #20 - diff for test {\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":true}],\"expected\":{\"foo\":1,\"bar\":true}}", () => {
         runDiffTest({"foo":1}, {"foo":1,"bar":true}, [{"op":"add","path":"/bar","value":true}]);
      });
      it("tests.json #21 - apply for test {\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":false}],\"expected\":{\"foo\":1,\"bar\":false}}", () => {
         runApplyTest({"foo":1}, [{"op":"add","path":"/bar","value":false}], undefined, {"foo":1,"bar":false});
      });
      it("tests.json #21 - diff for test {\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":false}],\"expected\":{\"foo\":1,\"bar\":false}}", () => {
         runDiffTest({"foo":1}, {"foo":1,"bar":false}, [{"op":"add","path":"/bar","value":false}]);
      });
      it("tests.json #22 - apply for test {\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":null}],\"expected\":{\"foo\":1,\"bar\":null}}", () => {
         runApplyTest({"foo":1}, [{"op":"add","path":"/bar","value":null}], undefined, {"foo":1,"bar":null});
      });
      it("tests.json #22 - diff for test {\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":null}],\"expected\":{\"foo\":1,\"bar\":null}}", () => {
         runDiffTest({"foo":1}, {"foo":1,"bar":null}, [{"op":"add","path":"/bar","value":null}]);
      });
      it("tests.json #23 - apply 0 can be an array index or object element name for test {\"comment\":\"0 can be an array index or object element name\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/0\",\"value\":\"bar\"}],\"expected\":{\"0\":\"bar\",\"foo\":1}}", () => {
         runApplyTest({"foo":1}, [{"op":"add","path":"/0","value":"bar"}], undefined, {"0":"bar","foo":1});
      });
      it("tests.json #23 - diff 0 can be an array index or object element name for test {\"comment\":\"0 can be an array index or object element name\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"add\",\"path\":\"/0\",\"value\":\"bar\"}],\"expected\":{\"0\":\"bar\",\"foo\":1}}", () => {
         runDiffTest({"foo":1}, {"0":"bar","foo":1}, [{"op":"add","path":"/0","value":"bar"}]);
      });
      it("tests.json #24 - apply for test {\"doc\":[\"foo\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1\",\"value\":\"bar\"}],\"expected\":[\"foo\",\"bar\"]}", () => {
         runApplyTest(["foo"], [{"op":"add","path":"/1","value":"bar"}], undefined, ["foo","bar"]);
      });
      it("tests.json #24 - diff for test {\"doc\":[\"foo\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1\",\"value\":\"bar\"}],\"expected\":[\"foo\",\"bar\"]}", () => {
         runDiffTest(["foo"], ["foo","bar"], [{"op":"add","path":"/1","value":"bar"}], [0]);
      });
      it("tests.json #25 - apply for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1\",\"value\":\"bar\"}],\"expected\":[\"foo\",\"bar\",\"sil\"]}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/1","value":"bar"}], undefined, ["foo","bar","sil"]);
      });
      it("tests.json #25 - diff for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1\",\"value\":\"bar\"}],\"expected\":[\"foo\",\"bar\",\"sil\"]}", () => {
         runDiffTest(["foo","sil"], ["foo","bar","sil"], [{"op":"add","path":"/1","value":"bar"}]);
      });
      it("tests.json #26 - apply for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/0\",\"value\":\"bar\"}],\"expected\":[\"bar\",\"foo\",\"sil\"]}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/0","value":"bar"}], undefined, ["bar","foo","sil"]);
      });
      it("tests.json #26 - diff for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/0\",\"value\":\"bar\"}],\"expected\":[\"bar\",\"foo\",\"sil\"]}", () => {
         runDiffTest(["foo","sil"], ["bar","foo","sil"], [{"op":"add","path":"/0","value":"bar"}]);
      });
      it("tests.json #27 - apply push item to array via last index + 1 for test {\"comment\":\"push item to array via last index + 1\",\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/2\",\"value\":\"bar\"}],\"expected\":[\"foo\",\"sil\",\"bar\"]}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/2","value":"bar"}], undefined, ["foo","sil","bar"]);
      });
      it("tests.json #27 - diff push item to array via last index + 1 for test {\"comment\":\"push item to array via last index + 1\",\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/2\",\"value\":\"bar\"}],\"expected\":[\"foo\",\"sil\",\"bar\"]}", () => {
         runDiffTest(["foo","sil"], ["foo","sil","bar"], [{"op":"add","path":"/2","value":"bar"}], [0]);
      });
      it("tests.json #28 - apply add item to array at index > length should fail for test {\"comment\":\"add item to array at index > length should fail\",\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/3\",\"value\":\"bar\"}],\"error\":\"index is greater than number of items in array\"}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/3","value":"bar"}], "index is greater than number of items in array", undefined);
      });
      it("tests.json #29 - apply test against implementation-specific numeric parsing for test {\"comment\":\"test against implementation-specific numeric parsing\",\"doc\":{\"1e0\":\"foo\"},\"patch\":[{\"op\":\"test\",\"path\":\"/1e0\",\"value\":\"foo\"}],\"expected\":{\"1e0\":\"foo\"}}", () => {
         runApplyTest({"1e0":"foo"}, [{"op":"test","path":"/1e0","value":"foo"}], undefined, {"1e0":"foo"});
      });
      it("tests.json #30 - apply test with bad number should fail for test {\"comment\":\"test with bad number should fail\",\"doc\":[\"foo\",\"bar\"],\"patch\":[{\"op\":\"test\",\"path\":\"/1e0\",\"value\":\"bar\"}],\"error\":\"test op shouldn't get array element 1\"}", () => {
         runApplyTest(["foo","bar"], [{"op":"test","path":"/1e0","value":"bar"}], "test op shouldn't get array element 1", undefined);
      });
      it("tests.json #31 - apply for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/bar\",\"value\":42}],\"error\":\"Object operation on array target\"}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/bar","value":42}], "Object operation on array target", undefined);
      });
      it("tests.json #32 - apply value in array add not flattened for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1\",\"value\":[\"bar\",\"baz\"]}],\"expected\":[\"foo\",[\"bar\",\"baz\"],\"sil\"],\"comment\":\"value in array add not flattened\"}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/1","value":["bar","baz"]}], undefined, ["foo",["bar","baz"],"sil"]);
      });
      it("tests.json #32 - diff value in array add not flattened for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1\",\"value\":[\"bar\",\"baz\"]}],\"expected\":[\"foo\",[\"bar\",\"baz\"],\"sil\"],\"comment\":\"value in array add not flattened\"}", () => {
         runDiffTest(["foo","sil"], ["foo",["bar","baz"],"sil"], [{"op":"add","path":"/1","value":["bar","baz"]}]);
      });
      it("tests.json #33 - apply for test {\"doc\":{\"foo\":1,\"bar\":[1,2,3,4]},\"patch\":[{\"op\":\"remove\",\"path\":\"/bar\"}],\"expected\":{\"foo\":1}}", () => {
         runApplyTest({"foo":1,"bar":[1,2,3,4]}, [{"op":"remove","path":"/bar"}], undefined, {"foo":1});
      });
      it("tests.json #33 - diff for test {\"doc\":{\"foo\":1,\"bar\":[1,2,3,4]},\"patch\":[{\"op\":\"remove\",\"path\":\"/bar\"}],\"expected\":{\"foo\":1}}", () => {
         runDiffTest({"foo":1,"bar":[1,2,3,4]}, {"foo":1}, [{"op":"remove","path":"/bar"}]);
      });
      it("tests.json #34 - apply for test {\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz/0/qux\"}],\"expected\":{\"foo\":1,\"baz\":[{}]}}", () => {
         runApplyTest({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"remove","path":"/baz/0/qux"}], undefined, {"foo":1,"baz":[{}]});
      });
      it("tests.json #34 - diff for test {\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz/0/qux\"}],\"expected\":{\"foo\":1,\"baz\":[{}]}}", () => {
         runDiffTest({"foo":1,"baz":[{"qux":"hello"}]}, {"foo":1,"baz":[{}]}, [{"op":"remove","path":"/baz/0/qux"}]);
      });
      it("tests.json #35 - apply for test {\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo\",\"value\":[1,2,3,4]}],\"expected\":{\"foo\":[1,2,3,4],\"baz\":[{\"qux\":\"hello\"}]}}", () => {
         runApplyTest({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"replace","path":"/foo","value":[1,2,3,4]}], undefined, {"foo":[1,2,3,4],"baz":[{"qux":"hello"}]});
      });
      it("tests.json #35 - diff for test {\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo\",\"value\":[1,2,3,4]}],\"expected\":{\"foo\":[1,2,3,4],\"baz\":[{\"qux\":\"hello\"}]}}", () => {
         runDiffTest({"foo":1,"baz":[{"qux":"hello"}]}, {"foo":[1,2,3,4],"baz":[{"qux":"hello"}]}, [{"op":"replace","path":"/foo","value":[1,2,3,4]}]);
      });
      it("tests.json #36 - apply for test {\"doc\":{\"foo\":[1,2,3,4],\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"replace\",\"path\":\"/baz/0/qux\",\"value\":\"world\"}],\"expected\":{\"foo\":[1,2,3,4],\"baz\":[{\"qux\":\"world\"}]}}", () => {
         runApplyTest({"foo":[1,2,3,4],"baz":[{"qux":"hello"}]}, [{"op":"replace","path":"/baz/0/qux","value":"world"}], undefined, {"foo":[1,2,3,4],"baz":[{"qux":"world"}]});
      });
      it("tests.json #36 - diff for test {\"doc\":{\"foo\":[1,2,3,4],\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"replace\",\"path\":\"/baz/0/qux\",\"value\":\"world\"}],\"expected\":{\"foo\":[1,2,3,4],\"baz\":[{\"qux\":\"world\"}]}}", () => {
         runDiffTest({"foo":[1,2,3,4],"baz":[{"qux":"hello"}]}, {"foo":[1,2,3,4],"baz":[{"qux":"world"}]}, [{"op":"replace","path":"/baz/0/qux","value":"world"}]);
      });
      it("tests.json #37 - apply for test {\"doc\":[\"foo\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":\"bar\"}],\"expected\":[\"bar\"]}", () => {
         runApplyTest(["foo"], [{"op":"replace","path":"/0","value":"bar"}], undefined, ["bar"]);
      });
      it("tests.json #37 - diff for test {\"doc\":[\"foo\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":\"bar\"}],\"expected\":[\"bar\"]}", () => {
         runDiffTest(["foo"], ["bar"], [{"op":"replace","path":"/0","value":"bar"}]);
      });
      it("tests.json #38 - apply for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":0}],\"expected\":[0]}", () => {
         runApplyTest([""], [{"op":"replace","path":"/0","value":0}], undefined, [0]);
      });
      it("tests.json #38 - diff for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":0}],\"expected\":[0]}", () => {
         runDiffTest([""], [0], [{"op":"replace","path":"/0","value":0}]);
      });
      it("tests.json #39 - apply for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":true}],\"expected\":[true]}", () => {
         runApplyTest([""], [{"op":"replace","path":"/0","value":true}], undefined, [true]);
      });
      it("tests.json #39 - diff for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":true}],\"expected\":[true]}", () => {
         runDiffTest([""], [true], [{"op":"replace","path":"/0","value":true}]);
      });
      it("tests.json #40 - apply for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":false}],\"expected\":[false]}", () => {
         runApplyTest([""], [{"op":"replace","path":"/0","value":false}], undefined, [false]);
      });
      it("tests.json #40 - diff for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":false}],\"expected\":[false]}", () => {
         runDiffTest([""], [false], [{"op":"replace","path":"/0","value":false}]);
      });
      it("tests.json #41 - apply for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":null}],\"expected\":[null]}", () => {
         runApplyTest([""], [{"op":"replace","path":"/0","value":null}], undefined, [null]);
      });
      it("tests.json #41 - diff for test {\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\",\"value\":null}],\"expected\":[null]}", () => {
         runDiffTest([""], [null], [{"op":"replace","path":"/0","value":null}]);
      });
      it("tests.json #42 - apply value in array replace not flattened for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/1\",\"value\":[\"bar\",\"baz\"]}],\"expected\":[\"foo\",[\"bar\",\"baz\"]],\"comment\":\"value in array replace not flattened\"}", () => {
         runApplyTest(["foo","sil"], [{"op":"replace","path":"/1","value":["bar","baz"]}], undefined, ["foo",["bar","baz"]]);
      });
      it("tests.json #42 - diff value in array replace not flattened for test {\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/1\",\"value\":[\"bar\",\"baz\"]}],\"expected\":[\"foo\",[\"bar\",\"baz\"]],\"comment\":\"value in array replace not flattened\"}", () => {
         runDiffTest(["foo","sil"], ["foo",["bar","baz"]], [{"op":"replace","path":"/1","value":["bar","baz"]}]);
      });
      it("tests.json #43 - apply replace whole document for test {\"comment\":\"replace whole document\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"replace\",\"path\":\"\",\"value\":{\"baz\":\"qux\"}}],\"expected\":{\"baz\":\"qux\"}}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"replace","path":"","value":{"baz":"qux"}}], undefined, {"baz":"qux"});
      });
      it("tests.json #43 - diff replace whole document for test {\"comment\":\"replace whole document\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"replace\",\"path\":\"\",\"value\":{\"baz\":\"qux\"}}],\"expected\":{\"baz\":\"qux\"}}", () => {
         runDiffTest({"foo":"bar"}, {"baz":"qux"}, [{"op":"replace","path":"","value":{"baz":"qux"}}]);
      });
      it("tests.json #44 - apply test replace with missing parent key should fail for test {\"comment\":\"test replace with missing parent key should fail\",\"doc\":{\"bar\":\"baz\"},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo/bar\",\"value\":false}],\"error\":\"replace op should fail with missing parent key\"}", () => {
         runApplyTest({"bar":"baz"}, [{"op":"replace","path":"/foo/bar","value":false}], "replace op should fail with missing parent key", undefined);
      });
      it("tests.json #45 - apply spurious patch properties for test {\"comment\":\"spurious patch properties\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":1,\"spurious\":1}],\"expected\":{\"foo\":1}}", () => {
         runApplyTest({"foo":1}, [{"op":"test","path":"/foo","value":1,"spurious":1}], undefined, {"foo":1});
      });
      it("tests.json #46 - apply null value should be valid obj property for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":null}],\"expected\":{\"foo\":null},\"comment\":\"null value should be valid obj property\"}", () => {
         runApplyTest({"foo":null}, [{"op":"test","path":"/foo","value":null}], undefined, {"foo":null});
      });
      it("tests.json #47 - apply null value should be valid obj property to be replaced with something truthy for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo\",\"value\":\"truthy\"}],\"expected\":{\"foo\":\"truthy\"},\"comment\":\"null value should be valid obj property to be replaced with something truthy\"}", () => {
         runApplyTest({"foo":null}, [{"op":"replace","path":"/foo","value":"truthy"}], undefined, {"foo":"truthy"});
      });
      it("tests.json #47 - diff null value should be valid obj property to be replaced with something truthy for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo\",\"value\":\"truthy\"}],\"expected\":{\"foo\":\"truthy\"},\"comment\":\"null value should be valid obj property to be replaced with something truthy\"}", () => {
         runDiffTest({"foo":null}, {"foo":"truthy"}, [{"op":"replace","path":"/foo","value":"truthy"}], [1]);
      });
      it("tests.json #48 - apply null value should be valid obj property to be moved for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"move\",\"from\":\"/foo\",\"path\":\"/bar\"}],\"expected\":{\"bar\":null},\"comment\":\"null value should be valid obj property to be moved\"}", () => {
         runApplyTest({"foo":null}, [{"op":"move","from":"/foo","path":"/bar"}], undefined, {"bar":null});
      });
      it("tests.json #48 - diff null value should be valid obj property to be moved for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"move\",\"from\":\"/foo\",\"path\":\"/bar\"}],\"expected\":{\"bar\":null},\"comment\":\"null value should be valid obj property to be moved\"}", () => {
         runDiffTest({"foo":null}, {"bar":null}, [{"op":"move","from":"/foo","path":"/bar"}]);
      });
      it("tests.json #49 - apply null value should be valid obj property to be copied for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"copy\",\"from\":\"/foo\",\"path\":\"/bar\"}],\"expected\":{\"foo\":null,\"bar\":null},\"comment\":\"null value should be valid obj property to be copied\"}", () => {
         runApplyTest({"foo":null}, [{"op":"copy","from":"/foo","path":"/bar"}], undefined, {"foo":null,"bar":null});
      });
      it("tests.json #49 - diff null value should be valid obj property to be copied for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"copy\",\"from\":\"/foo\",\"path\":\"/bar\"}],\"expected\":{\"foo\":null,\"bar\":null},\"comment\":\"null value should be valid obj property to be copied\"}", () => {
         runDiffTest({"foo":null}, {"foo":null,"bar":null}, [{"op":"copy","from":"/foo","path":"/bar"}]);
      });
      it("tests.json #50 - apply null value should be valid obj property to be removed for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"remove\",\"path\":\"/foo\"}],\"expected\":{},\"comment\":\"null value should be valid obj property to be removed\"}", () => {
         runApplyTest({"foo":null}, [{"op":"remove","path":"/foo"}], undefined, {});
      });
      it("tests.json #50 - diff null value should be valid obj property to be removed for test {\"doc\":{\"foo\":null},\"patch\":[{\"op\":\"remove\",\"path\":\"/foo\"}],\"expected\":{},\"comment\":\"null value should be valid obj property to be removed\"}", () => {
         runDiffTest({"foo":null}, {}, [{"op":"remove","path":"/foo"}]);
      });
      it("tests.json #51 - apply null value should still be valid obj property replace other value for test {\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo\",\"value\":null}],\"expected\":{\"foo\":null},\"comment\":\"null value should still be valid obj property replace other value\"}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"replace","path":"/foo","value":null}], undefined, {"foo":null});
      });
      it("tests.json #51 - diff null value should still be valid obj property replace other value for test {\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"replace\",\"path\":\"/foo\",\"value\":null}],\"expected\":{\"foo\":null},\"comment\":\"null value should still be valid obj property replace other value\"}", () => {
         runDiffTest({"foo":"bar"}, {"foo":null}, [{"op":"replace","path":"/foo","value":null}]);
      });
      it("tests.json #52 - apply test should pass despite rearrangement for test {\"doc\":{\"foo\":{\"foo\":1,\"bar\":2}},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":{\"bar\":2,\"foo\":1}}],\"expected\":{\"foo\":{\"foo\":1,\"bar\":2}},\"comment\":\"test should pass despite rearrangement\"}", () => {
         runApplyTest({"foo":{"foo":1,"bar":2}}, [{"op":"test","path":"/foo","value":{"bar":2,"foo":1}}], undefined, {"foo":{"foo":1,"bar":2}});
      });
      it("tests.json #53 - apply test should pass despite (nested) rearrangement for test {\"doc\":{\"foo\":[{\"foo\":1,\"bar\":2}]},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":[{\"bar\":2,\"foo\":1}]}],\"expected\":{\"foo\":[{\"foo\":1,\"bar\":2}]},\"comment\":\"test should pass despite (nested) rearrangement\"}", () => {
         runApplyTest({"foo":[{"foo":1,"bar":2}]}, [{"op":"test","path":"/foo","value":[{"bar":2,"foo":1}]}], undefined, {"foo":[{"foo":1,"bar":2}]});
      });
      it("tests.json #54 - apply test should pass - no error for test {\"doc\":{\"foo\":{\"bar\":[1,2,5,4]}},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":{\"bar\":[1,2,5,4]}}],\"expected\":{\"foo\":{\"bar\":[1,2,5,4]}},\"comment\":\"test should pass - no error\"}", () => {
         runApplyTest({"foo":{"bar":[1,2,5,4]}}, [{"op":"test","path":"/foo","value":{"bar":[1,2,5,4]}}], undefined, {"foo":{"bar":[1,2,5,4]}});
      });
      it("tests.json #55 - apply for test {\"doc\":{\"foo\":{\"bar\":[1,2,5,4]}},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":[1,2]}],\"error\":\"test op should fail\"}", () => {
         runApplyTest({"foo":{"bar":[1,2,5,4]}}, [{"op":"test","path":"/foo","value":[1,2]}], "test op should fail", undefined);
      });
      xit("tests.json #56 - apply Whole document for test {\"comment\":\"Whole document\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"test\",\"path\":\"\",\"value\":{\"foo\":1}}],\"disabled\":true}", () => {
         runApplyTest({"foo":1}, [{"op":"test","path":"","value":{"foo":1}}], undefined, undefined);
      });
      xit("tests.json #56 - diff Whole document for test {\"comment\":\"Whole document\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"test\",\"path\":\"\",\"value\":{\"foo\":1}}],\"disabled\":true}", () => {
         runDiffTest({"foo":1}, undefined, [{"op":"test","path":"","value":{"foo":1}}]);
      });
      it("tests.json #57 - apply Empty-string element for test {\"comment\":\"Empty-string element\",\"doc\":{\"\":1},\"patch\":[{\"op\":\"test\",\"path\":\"/\",\"value\":1}],\"expected\":{\"\":1}}", () => {
         runApplyTest({"":1}, [{"op":"test","path":"/","value":1}], undefined, {"":1});
      });
      it("tests.json #58 - apply for test {\"doc\":{\"foo\":[\"bar\",\"baz\"],\"\":0,\"a/b\":1,\"c%d\":2,\"e^f\":3,\"g|h\":4,\"i\\j\":5,\"k\\\"l\":6,\" \":7,\"m~n\":8},\"patch\":[{\"op\":\"test\",\"path\":\"/foo\",\"value\":[\"bar\",\"baz\"]},{\"op\":\"test\",\"path\":\"/foo/0\",\"value\":\"bar\"},{\"op\":\"test\",\"path\":\"/\",\"value\":0},{\"op\":\"test\",\"path\":\"/a~1b\",\"value\":1},{\"op\":\"test\",\"path\":\"/c%d\",\"value\":2},{\"op\":\"test\",\"path\":\"/e^f\",\"value\":3},{\"op\":\"test\",\"path\":\"/g|h\",\"value\":4},{\"op\":\"test\",\"path\":\"/i\\j\",\"value\":5},{\"op\":\"test\",\"path\":\"/k\\\"l\",\"value\":6},{\"op\":\"test\",\"path\":\"/ \",\"value\":7},{\"op\":\"test\",\"path\":\"/m~0n\",\"value\":8}],\"expected\":{\"\":0,\" \":7,\"a/b\":1,\"c%d\":2,\"e^f\":3,\"foo\":[\"bar\",\"baz\"],\"g|h\":4,\"i\\j\":5,\"k\\\"l\":6,\"m~n\":8}}", () => {
         runApplyTest({"foo":["bar","baz"],"":0,"a/b":1,"c%d":2,"e^f":3,"g|h":4,"i\\j":5,"k\"l":6," ":7,"m~n":8}, [{"op":"test","path":"/foo","value":["bar","baz"]},{"op":"test","path":"/foo/0","value":"bar"},{"op":"test","path":"/","value":0},{"op":"test","path":"/a~1b","value":1},{"op":"test","path":"/c%d","value":2},{"op":"test","path":"/e^f","value":3},{"op":"test","path":"/g|h","value":4},{"op":"test","path":"/i\\j","value":5},{"op":"test","path":"/k\"l","value":6},{"op":"test","path":"/ ","value":7},{"op":"test","path":"/m~0n","value":8}], undefined, {"":0," ":7,"a/b":1,"c%d":2,"e^f":3,"foo":["bar","baz"],"g|h":4,"i\\j":5,"k\"l":6,"m~n":8});
      });
      it("tests.json #59 - apply Move to same location has no effect for test {\"comment\":\"Move to same location has no effect\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"move\",\"from\":\"/foo\",\"path\":\"/foo\"}],\"expected\":{\"foo\":1}}", () => {
         runApplyTest({"foo":1}, [{"op":"move","from":"/foo","path":"/foo"}], undefined, {"foo":1});
      });
      it("tests.json #60 - apply for test {\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"move\",\"from\":\"/foo\",\"path\":\"/bar\"}],\"expected\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1}}", () => {
         runApplyTest({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"move","from":"/foo","path":"/bar"}], undefined, {"baz":[{"qux":"hello"}],"bar":1});
      });
      it("tests.json #60 - diff for test {\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"move\",\"from\":\"/foo\",\"path\":\"/bar\"}],\"expected\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1}}", () => {
         runDiffTest({"foo":1,"baz":[{"qux":"hello"}]}, {"baz":[{"qux":"hello"}],"bar":1}, [{"op":"move","from":"/foo","path":"/bar"}]);
      });
      it("tests.json #61 - apply for test {\"doc\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1},\"patch\":[{\"op\":\"move\",\"from\":\"/baz/0/qux\",\"path\":\"/baz/1\"}],\"expected\":{\"baz\":[{},\"hello\"],\"bar\":1}}", () => {
         runApplyTest({"baz":[{"qux":"hello"}],"bar":1}, [{"op":"move","from":"/baz/0/qux","path":"/baz/1"}], undefined, {"baz":[{},"hello"],"bar":1});
      });
      it("tests.json #61 - diff for test {\"doc\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1},\"patch\":[{\"op\":\"move\",\"from\":\"/baz/0/qux\",\"path\":\"/baz/1\"}],\"expected\":{\"baz\":[{},\"hello\"],\"bar\":1}}", () => {
         runDiffTest({"baz":[{"qux":"hello"}],"bar":1}, {"baz":[{},"hello"],"bar":1}, [{"op":"move","from":"/baz/0/qux","path":"/baz/1"}], [0]);
      });
      it("tests.json #62 - apply for test {\"doc\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1},\"patch\":[{\"op\":\"copy\",\"from\":\"/baz/0\",\"path\":\"/boo\"}],\"expected\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1,\"boo\":{\"qux\":\"hello\"}}}", () => {
         runApplyTest({"baz":[{"qux":"hello"}],"bar":1}, [{"op":"copy","from":"/baz/0","path":"/boo"}], undefined, {"baz":[{"qux":"hello"}],"bar":1,"boo":{"qux":"hello"}});
      });
      it("tests.json #62 - diff for test {\"doc\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1},\"patch\":[{\"op\":\"copy\",\"from\":\"/baz/0\",\"path\":\"/boo\"}],\"expected\":{\"baz\":[{\"qux\":\"hello\"}],\"bar\":1,\"boo\":{\"qux\":\"hello\"}}}", () => {
         runDiffTest({"baz":[{"qux":"hello"}],"bar":1}, {"baz":[{"qux":"hello"}],"bar":1,"boo":{"qux":"hello"}}, [{"op":"copy","from":"/baz/0","path":"/boo"}]);
      });
      it("tests.json #63 - apply replacing the root of the document is possible with add for test {\"comment\":\"replacing the root of the document is possible with add\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"\",\"value\":{\"baz\":\"qux\"}}],\"expected\":{\"baz\":\"qux\"}}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"add","path":"","value":{"baz":"qux"}}], undefined, {"baz":"qux"});
      });
      it("tests.json #63 - diff replacing the root of the document is possible with add for test {\"comment\":\"replacing the root of the document is possible with add\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"\",\"value\":{\"baz\":\"qux\"}}],\"expected\":{\"baz\":\"qux\"}}", () => {
         runDiffTest({"foo":"bar"}, {"baz":"qux"}, [{"op":"add","path":"","value":{"baz":"qux"}}], [2]);
      });
      it("tests.json #64 - apply Adding to \"/-\" adds to the end of the array for test {\"comment\":\"Adding to \\\"/-\\\" adds to the end of the array\",\"doc\":[1,2],\"patch\":[{\"op\":\"add\",\"path\":\"/-\",\"value\":{\"foo\":[\"bar\",\"baz\"]}}],\"expected\":[1,2,{\"foo\":[\"bar\",\"baz\"]}]}", () => {
         runApplyTest([1,2], [{"op":"add","path":"/-","value":{"foo":["bar","baz"]}}], undefined, [1,2,{"foo":["bar","baz"]}]);
      });
      it("tests.json #64 - diff Adding to \"/-\" adds to the end of the array for test {\"comment\":\"Adding to \\\"/-\\\" adds to the end of the array\",\"doc\":[1,2],\"patch\":[{\"op\":\"add\",\"path\":\"/-\",\"value\":{\"foo\":[\"bar\",\"baz\"]}}],\"expected\":[1,2,{\"foo\":[\"bar\",\"baz\"]}]}", () => {
         runDiffTest([1,2], [1,2,{"foo":["bar","baz"]}], [{"op":"add","path":"/-","value":{"foo":["bar","baz"]}}]);
      });
      it("tests.json #65 - apply Adding to \"/-\" adds to the end of the array, even n levels down for test {\"comment\":\"Adding to \\\"/-\\\" adds to the end of the array, even n levels down\",\"doc\":[1,2,[3,[4,5]]],\"patch\":[{\"op\":\"add\",\"path\":\"/2/1/-\",\"value\":{\"foo\":[\"bar\",\"baz\"]}}],\"expected\":[1,2,[3,[4,5,{\"foo\":[\"bar\",\"baz\"]}]]]}", () => {
         runApplyTest([1,2,[3,[4,5]]], [{"op":"add","path":"/2/1/-","value":{"foo":["bar","baz"]}}], undefined, [1,2,[3,[4,5,{"foo":["bar","baz"]}]]]);
      });
      it("tests.json #65 - diff Adding to \"/-\" adds to the end of the array, even n levels down for test {\"comment\":\"Adding to \\\"/-\\\" adds to the end of the array, even n levels down\",\"doc\":[1,2,[3,[4,5]]],\"patch\":[{\"op\":\"add\",\"path\":\"/2/1/-\",\"value\":{\"foo\":[\"bar\",\"baz\"]}}],\"expected\":[1,2,[3,[4,5,{\"foo\":[\"bar\",\"baz\"]}]]]}", () => {
         runDiffTest([1,2,[3,[4,5]]], [1,2,[3,[4,5,{"foo":["bar","baz"]}]]], [{"op":"add","path":"/2/1/-","value":{"foo":["bar","baz"]}}]);
      });
      it("tests.json #66 - apply test remove with bad number should fail for test {\"comment\":\"test remove with bad number should fail\",\"doc\":{\"foo\":1,\"baz\":[{\"qux\":\"hello\"}]},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz/1e0/qux\"}],\"error\":\"remove op shouldn't remove from array with bad number\"}", () => {
         runApplyTest({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"remove","path":"/baz/1e0/qux"}], "remove op shouldn't remove from array with bad number", undefined);
      });
      it("tests.json #67 - apply test remove on array for test {\"comment\":\"test remove on array\",\"doc\":[1,2,3,4],\"patch\":[{\"op\":\"remove\",\"path\":\"/0\"}],\"expected\":[2,3,4]}", () => {
         runApplyTest([1,2,3,4], [{"op":"remove","path":"/0"}], undefined, [2,3,4]);
      });
      it("tests.json #67 - diff test remove on array for test {\"comment\":\"test remove on array\",\"doc\":[1,2,3,4],\"patch\":[{\"op\":\"remove\",\"path\":\"/0\"}],\"expected\":[2,3,4]}", () => {
         runDiffTest([1,2,3,4], [2,3,4], [{"op":"remove","path":"/0"}]);
      });
      it("tests.json #68 - apply test repeated removes for test {\"comment\":\"test repeated removes\",\"doc\":[1,2,3,4],\"patch\":[{\"op\":\"remove\",\"path\":\"/1\"},{\"op\":\"remove\",\"path\":\"/2\"}],\"expected\":[1,3]}", () => {
         runApplyTest([1,2,3,4], [{"op":"remove","path":"/1"},{"op":"remove","path":"/2"}], undefined, [1,3]);
      });
      it("tests.json #68 - diff test repeated removes for test {\"comment\":\"test repeated removes\",\"doc\":[1,2,3,4],\"patch\":[{\"op\":\"remove\",\"path\":\"/1\"},{\"op\":\"remove\",\"path\":\"/2\"}],\"expected\":[1,3]}", () => {
         runDiffTest([1,2,3,4], [1,3], [{"op":"remove","path":"/1"},{"op":"remove","path":"/2"}]);
      });
      it("tests.json #69 - apply test remove with bad index should fail for test {\"comment\":\"test remove with bad index should fail\",\"doc\":[1,2,3,4],\"patch\":[{\"op\":\"remove\",\"path\":\"/1e0\"}],\"error\":\"remove op shouldn't remove from array with bad number\"}", () => {
         runApplyTest([1,2,3,4], [{"op":"remove","path":"/1e0"}], "remove op shouldn't remove from array with bad number", undefined);
      });
      it("tests.json #70 - apply test replace with bad number should fail for test {\"comment\":\"test replace with bad number should fail\",\"doc\":[\"\"],\"patch\":[{\"op\":\"replace\",\"path\":\"/1e0\",\"value\":false}],\"error\":\"replace op shouldn't replace in array with bad number\"}", () => {
         runApplyTest([""], [{"op":"replace","path":"/1e0","value":false}], "replace op shouldn't replace in array with bad number", undefined);
      });
      it("tests.json #71 - apply test copy with bad number should fail for test {\"comment\":\"test copy with bad number should fail\",\"doc\":{\"baz\":[1,2,3],\"bar\":1},\"patch\":[{\"op\":\"copy\",\"from\":\"/baz/1e0\",\"path\":\"/boo\"}],\"error\":\"copy op shouldn't work with bad number\"}", () => {
         runApplyTest({"baz":[1,2,3],"bar":1}, [{"op":"copy","from":"/baz/1e0","path":"/boo"}], "copy op shouldn't work with bad number", undefined);
      });
      it("tests.json #72 - apply test move with bad number should fail for test {\"comment\":\"test move with bad number should fail\",\"doc\":{\"foo\":1,\"baz\":[1,2,3,4]},\"patch\":[{\"op\":\"move\",\"from\":\"/baz/1e0\",\"path\":\"/foo\"}],\"error\":\"move op shouldn't work with bad number\"}", () => {
         runApplyTest({"foo":1,"baz":[1,2,3,4]}, [{"op":"move","from":"/baz/1e0","path":"/foo"}], "move op shouldn't work with bad number", undefined);
      });
      it("tests.json #73 - apply test add with bad number should fail for test {\"comment\":\"test add with bad number should fail\",\"doc\":[\"foo\",\"sil\"],\"patch\":[{\"op\":\"add\",\"path\":\"/1e0\",\"value\":\"bar\"}],\"error\":\"add op shouldn't add to array with bad number\"}", () => {
         runApplyTest(["foo","sil"], [{"op":"add","path":"/1e0","value":"bar"}], "add op shouldn't add to array with bad number", undefined);
      });
      it("tests.json #74 - apply missing 'path' parameter for test {\"comment\":\"missing 'path' parameter\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"value\":\"bar\"}],\"error\":\"missing 'path' parameter\"}", () => {
         runApplyTest({}, [{"op":"add","value":"bar"}], "missing 'path' parameter", undefined);
      });
      it("tests.json #75 - apply 'path' parameter with null value for test {\"comment\":\"'path' parameter with null value\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":null,\"value\":\"bar\"}],\"error\":\"null is not valid value for 'path'\"}", () => {
         runApplyTest({}, [{"op":"add","path":null,"value":"bar"}], "null is not valid value for 'path'", undefined);
      });
      it("tests.json #76 - apply invalid JSON Pointer token for test {\"comment\":\"invalid JSON Pointer token\",\"doc\":{},\"patch\":[{\"op\":\"add\",\"path\":\"foo\",\"value\":\"bar\"}],\"error\":\"JSON Pointer should start with a slash\"}", () => {
         runApplyTest({}, [{"op":"add","path":"foo","value":"bar"}], "JSON Pointer should start with a slash", undefined);
      });
      it("tests.json #77 - apply missing 'value' parameter to add for test {\"comment\":\"missing 'value' parameter to add\",\"doc\":[1],\"patch\":[{\"op\":\"add\",\"path\":\"/-\"}],\"error\":\"missing 'value' parameter\"}", () => {
         runApplyTest([1], [{"op":"add","path":"/-"}], "missing 'value' parameter", undefined);
      });
      it("tests.json #78 - apply missing 'value' parameter to replace for test {\"comment\":\"missing 'value' parameter to replace\",\"doc\":[1],\"patch\":[{\"op\":\"replace\",\"path\":\"/0\"}],\"error\":\"missing 'value' parameter\"}", () => {
         runApplyTest([1], [{"op":"replace","path":"/0"}], "missing 'value' parameter", undefined);
      });
      it("tests.json #79 - apply missing 'value' parameter to test for test {\"comment\":\"missing 'value' parameter to test\",\"doc\":[null],\"patch\":[{\"op\":\"test\",\"path\":\"/0\"}],\"error\":\"missing 'value' parameter\"}", () => {
         runApplyTest([null], [{"op":"test","path":"/0"}], "missing 'value' parameter", undefined);
      });
      it("tests.json #80 - apply missing value parameter to test - where undef is falsy for test {\"comment\":\"missing value parameter to test - where undef is falsy\",\"doc\":[false],\"patch\":[{\"op\":\"test\",\"path\":\"/0\"}],\"error\":\"missing 'value' parameter\"}", () => {
         runApplyTest([false], [{"op":"test","path":"/0"}], "missing 'value' parameter", undefined);
      });
      it("tests.json #81 - apply missing from parameter to copy for test {\"comment\":\"missing from parameter to copy\",\"doc\":[1],\"patch\":[{\"op\":\"copy\",\"path\":\"/-\"}],\"error\":\"missing 'from' parameter\"}", () => {
         runApplyTest([1], [{"op":"copy","path":"/-"}], "missing 'from' parameter", undefined);
      });
      it("tests.json #82 - apply missing from location to copy for test {\"comment\":\"missing from location to copy\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"copy\",\"from\":\"/bar\",\"path\":\"/foo\"}],\"error\":\"missing 'from' location\"}", () => {
         runApplyTest({"foo":1}, [{"op":"copy","from":"/bar","path":"/foo"}], "missing 'from' location", undefined);
      });
      it("tests.json #83 - apply missing from parameter to move for test {\"comment\":\"missing from parameter to move\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"move\",\"path\":\"\"}],\"error\":\"missing 'from' parameter\"}", () => {
         runApplyTest({"foo":1}, [{"op":"move","path":""}], "missing 'from' parameter", undefined);
      });
      it("tests.json #84 - apply missing from location to move for test {\"comment\":\"missing from location to move\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"move\",\"from\":\"/bar\",\"path\":\"/foo\"}],\"error\":\"missing 'from' location\"}", () => {
         runApplyTest({"foo":1}, [{"op":"move","from":"/bar","path":"/foo"}], "missing 'from' location", undefined);
      });
      xit("tests.json #85 - apply duplicate ops for test {\"comment\":\"duplicate ops\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"move\",\"path\":\"/baz\",\"value\":\"qux\",\"from\":\"/foo\"}],\"error\":\"patch has two 'op' members\",\"disabled\":true}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"move","path":"/baz","value":"qux","from":"/foo"}], "patch has two 'op' members", undefined);
      });
      it("tests.json #86 - apply unrecognized op should fail for test {\"comment\":\"unrecognized op should fail\",\"doc\":{\"foo\":1},\"patch\":[{\"op\":\"spam\",\"path\":\"/foo\",\"value\":1}],\"error\":\"Unrecognized op 'spam'\"}", () => {
         runApplyTest({"foo":1}, [{"op":"spam","path":"/foo","value":1}], "Unrecognized op 'spam'", undefined);
      });
      it("tests.json #87 - apply test with bad array number that has leading zeros for test {\"comment\":\"test with bad array number that has leading zeros\",\"doc\":[\"foo\",\"bar\"],\"patch\":[{\"op\":\"test\",\"path\":\"/00\",\"value\":\"foo\"}],\"error\":\"test op should reject the array value, it has leading zeros\"}", () => {
         runApplyTest(["foo","bar"], [{"op":"test","path":"/00","value":"foo"}], "test op should reject the array value, it has leading zeros", undefined);
      });
      it("tests.json #88 - apply test with bad array number that has leading zeros for test {\"comment\":\"test with bad array number that has leading zeros\",\"doc\":[\"foo\",\"bar\"],\"patch\":[{\"op\":\"test\",\"path\":\"/01\",\"value\":\"bar\"}],\"error\":\"test op should reject the array value, it has leading zeros\"}", () => {
         runApplyTest(["foo","bar"], [{"op":"test","path":"/01","value":"bar"}], "test op should reject the array value, it has leading zeros", undefined);
      });
      it("tests.json #89 - apply Removing nonexistent field for test {\"comment\":\"Removing nonexistent field\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz\"}],\"error\":\"removing a nonexistent field should fail\"}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"remove","path":"/baz"}], "removing a nonexistent field should fail", undefined);
      });
      it("tests.json #90 - apply Removing deep nonexistent path for test {\"comment\":\"Removing deep nonexistent path\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"remove\",\"path\":\"/missing1/missing2\"}],\"error\":\"removing a nonexistent field should fail\"}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"remove","path":"/missing1/missing2"}], "removing a nonexistent field should fail", undefined);
      });
      it("tests.json #91 - apply Removing nonexistent index for test {\"comment\":\"Removing nonexistent index\",\"doc\":[\"foo\",\"bar\"],\"patch\":[{\"op\":\"remove\",\"path\":\"/2\"}],\"error\":\"removing a nonexistent index should fail\"}", () => {
         runApplyTest(["foo","bar"], [{"op":"remove","path":"/2"}], "removing a nonexistent index should fail", undefined);
      });
      it("tests.json #92 - apply Patch with different capitalisation than doc for test {\"comment\":\"Patch with different capitalisation than doc\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/FOO\",\"value\":\"BAR\"}],\"expected\":{\"foo\":\"bar\",\"FOO\":\"BAR\"}}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"add","path":"/FOO","value":"BAR"}], undefined, {"foo":"bar","FOO":"BAR"});
      });
      it("tests.json #92 - diff Patch with different capitalisation than doc for test {\"comment\":\"Patch with different capitalisation than doc\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/FOO\",\"value\":\"BAR\"}],\"expected\":{\"foo\":\"bar\",\"FOO\":\"BAR\"}}", () => {
         runDiffTest({"foo":"bar"}, {"foo":"bar","FOO":"BAR"}, [{"op":"add","path":"/FOO","value":"BAR"}]);
      });
   });
   
   describe("spec_tests.json - RFC6902 spec", () => {
      it("spec_tests.json #0 - apply 4.1. add with missing object for test {\"comment\":\"4.1. add with missing object\",\"doc\":{\"q\":{\"bar\":2}},\"patch\":[{\"op\":\"add\",\"path\":\"/a/b\",\"value\":1}],\"error\":\"path /a does not exist -- missing objects are not created recursively\"}", () => {
         runApplyTest({"q":{"bar":2}}, [{"op":"add","path":"/a/b","value":1}], "path /a does not exist -- missing objects are not created recursively", undefined);
      });
      it("spec_tests.json #1 - apply A.1.  Adding an Object Member for test {\"comment\":\"A.1.  Adding an Object Member\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/baz\",\"value\":\"qux\"}],\"expected\":{\"baz\":\"qux\",\"foo\":\"bar\"}}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"add","path":"/baz","value":"qux"}], undefined, {"baz":"qux","foo":"bar"});
      });
      it("spec_tests.json #1 - diff A.1.  Adding an Object Member for test {\"comment\":\"A.1.  Adding an Object Member\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/baz\",\"value\":\"qux\"}],\"expected\":{\"baz\":\"qux\",\"foo\":\"bar\"}}", () => {
         runDiffTest({"foo":"bar"}, {"baz":"qux","foo":"bar"}, [{"op":"add","path":"/baz","value":"qux"}]);
      });
      it("spec_tests.json #2 - apply A.2.  Adding an Array Element for test {\"comment\":\"A.2.  Adding an Array Element\",\"doc\":{\"foo\":[\"bar\",\"baz\"]},\"patch\":[{\"op\":\"add\",\"path\":\"/foo/1\",\"value\":\"qux\"}],\"expected\":{\"foo\":[\"bar\",\"qux\",\"baz\"]}}", () => {
         runApplyTest({"foo":["bar","baz"]}, [{"op":"add","path":"/foo/1","value":"qux"}], undefined, {"foo":["bar","qux","baz"]});
      });
      it("spec_tests.json #2 - diff A.2.  Adding an Array Element for test {\"comment\":\"A.2.  Adding an Array Element\",\"doc\":{\"foo\":[\"bar\",\"baz\"]},\"patch\":[{\"op\":\"add\",\"path\":\"/foo/1\",\"value\":\"qux\"}],\"expected\":{\"foo\":[\"bar\",\"qux\",\"baz\"]}}", () => {
         runDiffTest({"foo":["bar","baz"]}, {"foo":["bar","qux","baz"]}, [{"op":"add","path":"/foo/1","value":"qux"}]);
      });
      it("spec_tests.json #3 - apply A.3.  Removing an Object Member for test {\"comment\":\"A.3.  Removing an Object Member\",\"doc\":{\"baz\":\"qux\",\"foo\":\"bar\"},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz\"}],\"expected\":{\"foo\":\"bar\"}}", () => {
         runApplyTest({"baz":"qux","foo":"bar"}, [{"op":"remove","path":"/baz"}], undefined, {"foo":"bar"});
      });
      it("spec_tests.json #3 - diff A.3.  Removing an Object Member for test {\"comment\":\"A.3.  Removing an Object Member\",\"doc\":{\"baz\":\"qux\",\"foo\":\"bar\"},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz\"}],\"expected\":{\"foo\":\"bar\"}}", () => {
         runDiffTest({"baz":"qux","foo":"bar"}, {"foo":"bar"}, [{"op":"remove","path":"/baz"}]);
      });
      it("spec_tests.json #4 - apply A.4.  Removing an Array Element for test {\"comment\":\"A.4.  Removing an Array Element\",\"doc\":{\"foo\":[\"bar\",\"qux\",\"baz\"]},\"patch\":[{\"op\":\"remove\",\"path\":\"/foo/1\"}],\"expected\":{\"foo\":[\"bar\",\"baz\"]}}", () => {
         runApplyTest({"foo":["bar","qux","baz"]}, [{"op":"remove","path":"/foo/1"}], undefined, {"foo":["bar","baz"]});
      });
      it("spec_tests.json #4 - diff A.4.  Removing an Array Element for test {\"comment\":\"A.4.  Removing an Array Element\",\"doc\":{\"foo\":[\"bar\",\"qux\",\"baz\"]},\"patch\":[{\"op\":\"remove\",\"path\":\"/foo/1\"}],\"expected\":{\"foo\":[\"bar\",\"baz\"]}}", () => {
         runDiffTest({"foo":["bar","qux","baz"]}, {"foo":["bar","baz"]}, [{"op":"remove","path":"/foo/1"}]);
      });
      it("spec_tests.json #5 - apply A.5.  Replacing a Value for test {\"comment\":\"A.5.  Replacing a Value\",\"doc\":{\"baz\":\"qux\",\"foo\":\"bar\"},\"patch\":[{\"op\":\"replace\",\"path\":\"/baz\",\"value\":\"boo\"}],\"expected\":{\"baz\":\"boo\",\"foo\":\"bar\"}}", () => {
         runApplyTest({"baz":"qux","foo":"bar"}, [{"op":"replace","path":"/baz","value":"boo"}], undefined, {"baz":"boo","foo":"bar"});
      });
      it("spec_tests.json #5 - diff A.5.  Replacing a Value for test {\"comment\":\"A.5.  Replacing a Value\",\"doc\":{\"baz\":\"qux\",\"foo\":\"bar\"},\"patch\":[{\"op\":\"replace\",\"path\":\"/baz\",\"value\":\"boo\"}],\"expected\":{\"baz\":\"boo\",\"foo\":\"bar\"}}", () => {
         runDiffTest({"baz":"qux","foo":"bar"}, {"baz":"boo","foo":"bar"}, [{"op":"replace","path":"/baz","value":"boo"}]);
      });
      it("spec_tests.json #6 - apply A.6.  Moving a Value for test {\"comment\":\"A.6.  Moving a Value\",\"doc\":{\"foo\":{\"bar\":\"baz\",\"waldo\":\"fred\"},\"qux\":{\"corge\":\"grault\"}},\"patch\":[{\"op\":\"move\",\"from\":\"/foo/waldo\",\"path\":\"/qux/thud\"}],\"expected\":{\"foo\":{\"bar\":\"baz\"},\"qux\":{\"corge\":\"grault\",\"thud\":\"fred\"}}}", () => {
         runApplyTest({"foo":{"bar":"baz","waldo":"fred"},"qux":{"corge":"grault"}}, [{"op":"move","from":"/foo/waldo","path":"/qux/thud"}], undefined, {"foo":{"bar":"baz"},"qux":{"corge":"grault","thud":"fred"}});
      });
      it("spec_tests.json #6 - diff A.6.  Moving a Value for test {\"comment\":\"A.6.  Moving a Value\",\"doc\":{\"foo\":{\"bar\":\"baz\",\"waldo\":\"fred\"},\"qux\":{\"corge\":\"grault\"}},\"patch\":[{\"op\":\"move\",\"from\":\"/foo/waldo\",\"path\":\"/qux/thud\"}],\"expected\":{\"foo\":{\"bar\":\"baz\"},\"qux\":{\"corge\":\"grault\",\"thud\":\"fred\"}}}", () => {
         runDiffTest({"foo":{"bar":"baz","waldo":"fred"},"qux":{"corge":"grault"}}, {"foo":{"bar":"baz"},"qux":{"corge":"grault","thud":"fred"}}, [{"op":"move","from":"/foo/waldo","path":"/qux/thud"}]);
      });
      it("spec_tests.json #7 - apply A.7.  Moving an Array Element for test {\"comment\":\"A.7.  Moving an Array Element\",\"doc\":{\"foo\":[\"all\",\"grass\",\"cows\",\"eat\"]},\"patch\":[{\"op\":\"move\",\"from\":\"/foo/1\",\"path\":\"/foo/3\"}],\"expected\":{\"foo\":[\"all\",\"cows\",\"eat\",\"grass\"]}}", () => {
         runApplyTest({"foo":["all","grass","cows","eat"]}, [{"op":"move","from":"/foo/1","path":"/foo/3"}], undefined, {"foo":["all","cows","eat","grass"]});
      });
      it("spec_tests.json #7 - diff A.7.  Moving an Array Element for test {\"comment\":\"A.7.  Moving an Array Element\",\"doc\":{\"foo\":[\"all\",\"grass\",\"cows\",\"eat\"]},\"patch\":[{\"op\":\"move\",\"from\":\"/foo/1\",\"path\":\"/foo/3\"}],\"expected\":{\"foo\":[\"all\",\"cows\",\"eat\",\"grass\"]}}", () => {
         runDiffTest({"foo":["all","grass","cows","eat"]}, {"foo":["all","cows","eat","grass"]}, [{"op":"move","from":"/foo/1","path":"/foo/3"}], [0]);
      });
      it("spec_tests.json #8 - apply A.8.  Testing a Value: Success for test {\"comment\":\"A.8.  Testing a Value: Success\",\"doc\":{\"baz\":\"qux\",\"foo\":[\"a\",2,\"c\"]},\"patch\":[{\"op\":\"test\",\"path\":\"/baz\",\"value\":\"qux\"},{\"op\":\"test\",\"path\":\"/foo/1\",\"value\":2}],\"expected\":{\"baz\":\"qux\",\"foo\":[\"a\",2,\"c\"]}}", () => {
         runApplyTest({"baz":"qux","foo":["a",2,"c"]}, [{"op":"test","path":"/baz","value":"qux"},{"op":"test","path":"/foo/1","value":2}], undefined, {"baz":"qux","foo":["a",2,"c"]});
      });
      it("spec_tests.json #9 - apply A.9.  Testing a Value: Error for test {\"comment\":\"A.9.  Testing a Value: Error\",\"doc\":{\"baz\":\"qux\"},\"patch\":[{\"op\":\"test\",\"path\":\"/baz\",\"value\":\"bar\"}],\"error\":\"string not equivalent\"}", () => {
         runApplyTest({"baz":"qux"}, [{"op":"test","path":"/baz","value":"bar"}], "string not equivalent", undefined);
      });
      it("spec_tests.json #10 - apply A.10.  Adding a nested Member Object for test {\"comment\":\"A.10.  Adding a nested Member Object\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/child\",\"value\":{\"grandchild\":{}}}],\"expected\":{\"foo\":\"bar\",\"child\":{\"grandchild\":{}}}}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"add","path":"/child","value":{"grandchild":{}}}], undefined, {"foo":"bar","child":{"grandchild":{}}});
      });
      it("spec_tests.json #10 - diff A.10.  Adding a nested Member Object for test {\"comment\":\"A.10.  Adding a nested Member Object\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/child\",\"value\":{\"grandchild\":{}}}],\"expected\":{\"foo\":\"bar\",\"child\":{\"grandchild\":{}}}}", () => {
         runDiffTest({"foo":"bar"}, {"foo":"bar","child":{"grandchild":{}}}, [{"op":"add","path":"/child","value":{"grandchild":{}}}]);
      });
      it("spec_tests.json #11 - apply A.11.  Ignoring Unrecognized Elements for test {\"comment\":\"A.11.  Ignoring Unrecognized Elements\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/baz\",\"value\":\"qux\",\"xyz\":123}],\"expected\":{\"foo\":\"bar\",\"baz\":\"qux\"}}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"add","path":"/baz","value":"qux","xyz":123}], undefined, {"foo":"bar","baz":"qux"});
      });
      it("spec_tests.json #12 - apply A.12.  Adding to a Non-existent Target for test {\"comment\":\"A.12.  Adding to a Non-existent Target\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"add\",\"path\":\"/baz/bat\",\"value\":\"qux\"}],\"error\":\"add to a non-existent target\"}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"add","path":"/baz/bat","value":"qux"}], "add to a non-existent target", undefined);
      });
      xit("spec_tests.json #13 - apply A.13 Invalid JSON Patch Document for test {\"comment\":\"A.13 Invalid JSON Patch Document\",\"doc\":{\"foo\":\"bar\"},\"patch\":[{\"op\":\"remove\",\"path\":\"/baz\",\"value\":\"qux\"}],\"error\":\"operation has two 'op' members\",\"disabled\":true}", () => {
         runApplyTest({"foo":"bar"}, [{"op":"remove","path":"/baz","value":"qux"}], "operation has two 'op' members", undefined);
      });
      it("spec_tests.json #14 - apply A.14. ~ Escape Ordering for test {\"comment\":\"A.14. ~ Escape Ordering\",\"doc\":{\"/\":9,\"~1\":10},\"patch\":[{\"op\":\"test\",\"path\":\"/~01\",\"value\":10}],\"expected\":{\"/\":9,\"~1\":10}}", () => {
         runApplyTest({"/":9,"~1":10}, [{"op":"test","path":"/~01","value":10}], undefined, {"/":9,"~1":10});
      });
      it("spec_tests.json #15 - apply A.15. Comparing Strings and Numbers for test {\"comment\":\"A.15. Comparing Strings and Numbers\",\"doc\":{\"/\":9,\"~1\":10},\"patch\":[{\"op\":\"test\",\"path\":\"/~01\",\"value\":\"10\"}],\"error\":\"number is not equal to string\"}", () => {
         runApplyTest({"/":9,"~1":10}, [{"op":"test","path":"/~01","value":"10"}], "number is not equal to string", undefined);
      });
      it("spec_tests.json #16 - apply A.16. Adding an Array Value for test {\"comment\":\"A.16. Adding an Array Value\",\"doc\":{\"foo\":[\"bar\"]},\"patch\":[{\"op\":\"add\",\"path\":\"/foo/-\",\"value\":[\"abc\",\"def\"]}],\"expected\":{\"foo\":[\"bar\",[\"abc\",\"def\"]]}}", () => {
         runApplyTest({"foo":["bar"]}, [{"op":"add","path":"/foo/-","value":["abc","def"]}], undefined, {"foo":["bar",["abc","def"]]});
      });
      it("spec_tests.json #16 - diff A.16. Adding an Array Value for test {\"comment\":\"A.16. Adding an Array Value\",\"doc\":{\"foo\":[\"bar\"]},\"patch\":[{\"op\":\"add\",\"path\":\"/foo/-\",\"value\":[\"abc\",\"def\"]}],\"expected\":{\"foo\":[\"bar\",[\"abc\",\"def\"]]}}", () => {
         runDiffTest({"foo":["bar"]}, {"foo":["bar",["abc","def"]]}, [{"op":"add","path":"/foo/-","value":["abc","def"]}]);
      });
   });
});
