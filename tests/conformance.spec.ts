import {expect} from "chai";
import {Patch} from "../index";

/**
 * DO NOT CHANGE - changes will be lost!
 * dynamically generated using generate_conformance.ts script see README.md file
 * for details on how to re-generate or change this file.
 */

describe("conformance", () => {
   function run_test(doc: any, patch: any[], error: any, expected: any) {
      try {
         let result = Patch.apply(doc, ...patch);
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
   describe("tests.json - main tests", () => {
      it("empty list, empty docs", () => {
         run_test({}, [], undefined, {});
      });
      it("empty patch list", () => {
         run_test({"foo":1}, [], undefined, {"foo":1});
      });
      it("rearrangements OK?", () => {
         run_test({"foo":1,"bar":2}, [], undefined, {"bar":2,"foo":1});
      });
      it("rearrangements OK?  How about one level down ... array", () => {
         run_test([{"foo":1,"bar":2}], [], undefined, [{"bar":2,"foo":1}]);
      });
      it("rearrangements OK?  How about one level down...", () => {
         run_test({"foo":{"foo":1,"bar":2}}, [], undefined, {"foo":{"bar":2,"foo":1}});
      });
      it("add replaces any existing field", () => {
         run_test({"foo":null}, [{"op":"add","path":"/foo","value":1}], undefined, {"foo":1});
      });
      it("toplevel array", () => {
         run_test([], [{"op":"add","path":"/0","value":"foo"}], undefined, ["foo"]);
      });
      it("toplevel array, no change", () => {
         run_test(["foo"], [], undefined, ["foo"]);
      });
      it("toplevel object, numeric string", () => {
         run_test({}, [{"op":"add","path":"/foo","value":"1"}], undefined, {"foo":"1"});
      });
      it("toplevel object, integer", () => {
         run_test({}, [{"op":"add","path":"/foo","value":1}], undefined, {"foo":1});
      });
      xit("Toplevel scalar values OK?", () => {
         run_test("foo", [{"op":"replace","path":"","value":"bar"}], undefined, "bar");
      });
      it("replace object document with array document?", () => {
         run_test({}, [{"op":"add","path":"","value":[]}], undefined, []);
      });
      it("replace array document with object document?", () => {
         run_test([], [{"op":"add","path":"","value":{}}], undefined, {});
      });
      it("append to root array document?", () => {
         run_test([], [{"op":"add","path":"/-","value":"hi"}], undefined, ["hi"]);
      });
      it("Add, / target", () => {
         run_test({}, [{"op":"add","path":"/","value":1}], undefined, {"":1});
      });
      it("Add, /foo/ deep target (trailing slash)", () => {
         run_test({"foo":{}}, [{"op":"add","path":"/foo/","value":1}], undefined, {"foo":{"":1}});
      });
      it("Add composite value at top level", () => {
         run_test({"foo":1}, [{"op":"add","path":"/bar","value":[1,2]}], undefined, {"foo":1,"bar":[1,2]});
      });
      it("Add into composite value", () => {
         run_test({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"add","path":"/baz/0/foo","value":"world"}], undefined, {"foo":1,"baz":[{"qux":"hello","foo":"world"}]});
      });
      it("conformance #18", () => {
         run_test({"bar":[1,2]}, [{"op":"add","path":"/bar/8","value":"5"}], "Out of bounds (upper)", undefined);
      });
      it("conformance #19", () => {
         run_test({"bar":[1,2]}, [{"op":"add","path":"/bar/-1","value":"5"}], "Out of bounds (lower)", undefined);
      });
      it("conformance #20", () => {
         run_test({"foo":1}, [{"op":"add","path":"/bar","value":true}], undefined, {"foo":1,"bar":true});
      });
      it("conformance #21", () => {
         run_test({"foo":1}, [{"op":"add","path":"/bar","value":false}], undefined, {"foo":1,"bar":false});
      });
      it("conformance #22", () => {
         run_test({"foo":1}, [{"op":"add","path":"/bar","value":null}], undefined, {"foo":1,"bar":null});
      });
      it("0 can be an array index or object element name", () => {
         run_test({"foo":1}, [{"op":"add","path":"/0","value":"bar"}], undefined, {"0":"bar","foo":1});
      });
      it("conformance #24", () => {
         run_test(["foo"], [{"op":"add","path":"/1","value":"bar"}], undefined, ["foo","bar"]);
      });
      it("conformance #25", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/1","value":"bar"}], undefined, ["foo","bar","sil"]);
      });
      it("conformance #26", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/0","value":"bar"}], undefined, ["bar","foo","sil"]);
      });
      it("push item to array via last index + 1", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/2","value":"bar"}], undefined, ["foo","sil","bar"]);
      });
      it("add item to array at index > length should fail", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/3","value":"bar"}], "index is greater than number of items in array", undefined);
      });
      it("test against implementation-specific numeric parsing", () => {
         run_test({"1e0":"foo"}, [{"op":"test","path":"/1e0","value":"foo"}], undefined, {"1e0":"foo"});
      });
      it("test with bad number should fail", () => {
         run_test(["foo","bar"], [{"op":"test","path":"/1e0","value":"bar"}], "test op shouldn't get array element 1", undefined);
      });
      it("conformance #31", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/bar","value":42}], "Object operation on array target", undefined);
      });
      it("value in array add not flattened", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/1","value":["bar","baz"]}], undefined, ["foo",["bar","baz"],"sil"]);
      });
      it("conformance #33", () => {
         run_test({"foo":1,"bar":[1,2,3,4]}, [{"op":"remove","path":"/bar"}], undefined, {"foo":1});
      });
      it("conformance #34", () => {
         run_test({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"remove","path":"/baz/0/qux"}], undefined, {"foo":1,"baz":[{}]});
      });
      it("conformance #35", () => {
         run_test({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"replace","path":"/foo","value":[1,2,3,4]}], undefined, {"foo":[1,2,3,4],"baz":[{"qux":"hello"}]});
      });
      it("conformance #36", () => {
         run_test({"foo":[1,2,3,4],"baz":[{"qux":"hello"}]}, [{"op":"replace","path":"/baz/0/qux","value":"world"}], undefined, {"foo":[1,2,3,4],"baz":[{"qux":"world"}]});
      });
      it("conformance #37", () => {
         run_test(["foo"], [{"op":"replace","path":"/0","value":"bar"}], undefined, ["bar"]);
      });
      it("conformance #38", () => {
         run_test([""], [{"op":"replace","path":"/0","value":0}], undefined, [0]);
      });
      it("conformance #39", () => {
         run_test([""], [{"op":"replace","path":"/0","value":true}], undefined, [true]);
      });
      it("conformance #40", () => {
         run_test([""], [{"op":"replace","path":"/0","value":false}], undefined, [false]);
      });
      it("conformance #41", () => {
         run_test([""], [{"op":"replace","path":"/0","value":null}], undefined, [null]);
      });
      it("value in array replace not flattened", () => {
         run_test(["foo","sil"], [{"op":"replace","path":"/1","value":["bar","baz"]}], undefined, ["foo",["bar","baz"]]);
      });
      it("replace whole document", () => {
         run_test({"foo":"bar"}, [{"op":"replace","path":"","value":{"baz":"qux"}}], undefined, {"baz":"qux"});
      });
      it("test replace with missing parent key should fail", () => {
         run_test({"bar":"baz"}, [{"op":"replace","path":"/foo/bar","value":false}], "replace op should fail with missing parent key", undefined);
      });
      it("spurious patch properties", () => {
         run_test({"foo":1}, [{"op":"test","path":"/foo","value":1,"spurious":1}], undefined, {"foo":1});
      });
      it("null value should be valid obj property", () => {
         run_test({"foo":null}, [{"op":"test","path":"/foo","value":null}], undefined, {"foo":null});
      });
      it("null value should be valid obj property to be replaced with something truthy", () => {
         run_test({"foo":null}, [{"op":"replace","path":"/foo","value":"truthy"}], undefined, {"foo":"truthy"});
      });
      it("null value should be valid obj property to be moved", () => {
         run_test({"foo":null}, [{"op":"move","from":"/foo","path":"/bar"}], undefined, {"bar":null});
      });
      it("null value should be valid obj property to be copied", () => {
         run_test({"foo":null}, [{"op":"copy","from":"/foo","path":"/bar"}], undefined, {"foo":null,"bar":null});
      });
      it("null value should be valid obj property to be removed", () => {
         run_test({"foo":null}, [{"op":"remove","path":"/foo"}], undefined, {});
      });
      it("null value should still be valid obj property replace other value", () => {
         run_test({"foo":"bar"}, [{"op":"replace","path":"/foo","value":null}], undefined, {"foo":null});
      });
      it("test should pass despite rearrangement", () => {
         run_test({"foo":{"foo":1,"bar":2}}, [{"op":"test","path":"/foo","value":{"bar":2,"foo":1}}], undefined, {"foo":{"foo":1,"bar":2}});
      });
      it("test should pass despite (nested) rearrangement", () => {
         run_test({"foo":[{"foo":1,"bar":2}]}, [{"op":"test","path":"/foo","value":[{"bar":2,"foo":1}]}], undefined, {"foo":[{"foo":1,"bar":2}]});
      });
      it("test should pass - no error", () => {
         run_test({"foo":{"bar":[1,2,5,4]}}, [{"op":"test","path":"/foo","value":{"bar":[1,2,5,4]}}], undefined, {"foo":{"bar":[1,2,5,4]}});
      });
      it("conformance #55", () => {
         run_test({"foo":{"bar":[1,2,5,4]}}, [{"op":"test","path":"/foo","value":[1,2]}], "test op should fail", undefined);
      });
      xit("Whole document", () => {
         run_test({"foo":1}, [{"op":"test","path":"","value":{"foo":1}}], undefined, undefined);
      });
      it("Empty-string element", () => {
         run_test({"":1}, [{"op":"test","path":"/","value":1}], undefined, {"":1});
      });
      it("conformance #58", () => {
         run_test({"foo":["bar","baz"],"":0,"a/b":1,"c%d":2,"e^f":3,"g|h":4,"i\\j":5,"k\"l":6," ":7,"m~n":8}, [{"op":"test","path":"/foo","value":["bar","baz"]},{"op":"test","path":"/foo/0","value":"bar"},{"op":"test","path":"/","value":0},{"op":"test","path":"/a~1b","value":1},{"op":"test","path":"/c%d","value":2},{"op":"test","path":"/e^f","value":3},{"op":"test","path":"/g|h","value":4},{"op":"test","path":"/i\\j","value":5},{"op":"test","path":"/k\"l","value":6},{"op":"test","path":"/ ","value":7},{"op":"test","path":"/m~0n","value":8}], undefined, {"":0," ":7,"a/b":1,"c%d":2,"e^f":3,"foo":["bar","baz"],"g|h":4,"i\\j":5,"k\"l":6,"m~n":8});
      });
      it("Move to same location has no effect", () => {
         run_test({"foo":1}, [{"op":"move","from":"/foo","path":"/foo"}], undefined, {"foo":1});
      });
      it("conformance #60", () => {
         run_test({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"move","from":"/foo","path":"/bar"}], undefined, {"baz":[{"qux":"hello"}],"bar":1});
      });
      it("conformance #61", () => {
         run_test({"baz":[{"qux":"hello"}],"bar":1}, [{"op":"move","from":"/baz/0/qux","path":"/baz/1"}], undefined, {"baz":[{},"hello"],"bar":1});
      });
      it("conformance #62", () => {
         run_test({"baz":[{"qux":"hello"}],"bar":1}, [{"op":"copy","from":"/baz/0","path":"/boo"}], undefined, {"baz":[{"qux":"hello"}],"bar":1,"boo":{"qux":"hello"}});
      });
      it("replacing the root of the document is possible with add", () => {
         run_test({"foo":"bar"}, [{"op":"add","path":"","value":{"baz":"qux"}}], undefined, {"baz":"qux"});
      });
      it("Adding to \"/-\" adds to the end of the array", () => {
         run_test([1,2], [{"op":"add","path":"/-","value":{"foo":["bar","baz"]}}], undefined, [1,2,{"foo":["bar","baz"]}]);
      });
      it("Adding to \"/-\" adds to the end of the array, even n levels down", () => {
         run_test([1,2,[3,[4,5]]], [{"op":"add","path":"/2/1/-","value":{"foo":["bar","baz"]}}], undefined, [1,2,[3,[4,5,{"foo":["bar","baz"]}]]]);
      });
      it("test remove with bad number should fail", () => {
         run_test({"foo":1,"baz":[{"qux":"hello"}]}, [{"op":"remove","path":"/baz/1e0/qux"}], "remove op shouldn't remove from array with bad number", undefined);
      });
      it("test remove on array", () => {
         run_test([1,2,3,4], [{"op":"remove","path":"/0"}], undefined, [2,3,4]);
      });
      it("test repeated removes", () => {
         run_test([1,2,3,4], [{"op":"remove","path":"/1"},{"op":"remove","path":"/2"}], undefined, [1,3]);
      });
      it("test remove with bad index should fail", () => {
         run_test([1,2,3,4], [{"op":"remove","path":"/1e0"}], "remove op shouldn't remove from array with bad number", undefined);
      });
      it("test replace with bad number should fail", () => {
         run_test([""], [{"op":"replace","path":"/1e0","value":false}], "replace op shouldn't replace in array with bad number", undefined);
      });
      it("test copy with bad number should fail", () => {
         run_test({"baz":[1,2,3],"bar":1}, [{"op":"copy","from":"/baz/1e0","path":"/boo"}], "copy op shouldn't work with bad number", undefined);
      });
      it("test move with bad number should fail", () => {
         run_test({"foo":1,"baz":[1,2,3,4]}, [{"op":"move","from":"/baz/1e0","path":"/foo"}], "move op shouldn't work with bad number", undefined);
      });
      it("test add with bad number should fail", () => {
         run_test(["foo","sil"], [{"op":"add","path":"/1e0","value":"bar"}], "add op shouldn't add to array with bad number", undefined);
      });
      it("missing 'path' parameter", () => {
         run_test({}, [{"op":"add","value":"bar"}], "missing 'path' parameter", undefined);
      });
      it("'path' parameter with null value", () => {
         run_test({}, [{"op":"add","path":null,"value":"bar"}], "null is not valid value for 'path'", undefined);
      });
      it("invalid JSON Pointer token", () => {
         run_test({}, [{"op":"add","path":"foo","value":"bar"}], "JSON Pointer should start with a slash", undefined);
      });
      it("missing 'value' parameter to add", () => {
         run_test([1], [{"op":"add","path":"/-"}], "missing 'value' parameter", undefined);
      });
      it("missing 'value' parameter to replace", () => {
         run_test([1], [{"op":"replace","path":"/0"}], "missing 'value' parameter", undefined);
      });
      it("missing 'value' parameter to test", () => {
         run_test([null], [{"op":"test","path":"/0"}], "missing 'value' parameter", undefined);
      });
      it("missing value parameter to test - where undef is falsy", () => {
         run_test([false], [{"op":"test","path":"/0"}], "missing 'value' parameter", undefined);
      });
      it("missing from parameter to copy", () => {
         run_test([1], [{"op":"copy","path":"/-"}], "missing 'from' parameter", undefined);
      });
      it("missing from location to copy", () => {
         run_test({"foo":1}, [{"op":"copy","from":"/bar","path":"/foo"}], "missing 'from' location", undefined);
      });
      it("missing from parameter to move", () => {
         run_test({"foo":1}, [{"op":"move","path":""}], "missing 'from' parameter", undefined);
      });
      it("missing from location to move", () => {
         run_test({"foo":1}, [{"op":"move","from":"/bar","path":"/foo"}], "missing 'from' location", undefined);
      });
      xit("duplicate ops", () => {
         run_test({"foo":"bar"}, [{"op":"move","path":"/baz","value":"qux","from":"/foo"}], "patch has two 'op' members", undefined);
      });
      it("unrecognized op should fail", () => {
         run_test({"foo":1}, [{"op":"spam","path":"/foo","value":1}], "Unrecognized op 'spam'", undefined);
      });
      it("test with bad array number that has leading zeros", () => {
         run_test(["foo","bar"], [{"op":"test","path":"/00","value":"foo"}], "test op should reject the array value, it has leading zeros", undefined);
      });
      it("test with bad array number that has leading zeros", () => {
         run_test(["foo","bar"], [{"op":"test","path":"/01","value":"bar"}], "test op should reject the array value, it has leading zeros", undefined);
      });
      it("Removing nonexistent field", () => {
         run_test({"foo":"bar"}, [{"op":"remove","path":"/baz"}], "removing a nonexistent field should fail", undefined);
      });
      it("Removing deep nonexistent path", () => {
         run_test({"foo":"bar"}, [{"op":"remove","path":"/missing1/missing2"}], "removing a nonexistent field should fail", undefined);
      });
      it("Removing nonexistent index", () => {
         run_test(["foo","bar"], [{"op":"remove","path":"/2"}], "removing a nonexistent index should fail", undefined);
      });
      it("Patch with different capitalisation than doc", () => {
         run_test({"foo":"bar"}, [{"op":"add","path":"/FOO","value":"BAR"}], undefined, {"foo":"bar","FOO":"BAR"});
      });
   });
   
   describe("spec_tests.json - RFC6902 spec", () => {
      it("4.1. add with missing object", () => {
         run_test({"q":{"bar":2}}, [{"op":"add","path":"/a/b","value":1}], "path /a does not exist -- missing objects are not created recursively", undefined);
      });
      it("A.1.  Adding an Object Member", () => {
         run_test({"foo":"bar"}, [{"op":"add","path":"/baz","value":"qux"}], undefined, {"baz":"qux","foo":"bar"});
      });
      it("A.2.  Adding an Array Element", () => {
         run_test({"foo":["bar","baz"]}, [{"op":"add","path":"/foo/1","value":"qux"}], undefined, {"foo":["bar","qux","baz"]});
      });
      it("A.3.  Removing an Object Member", () => {
         run_test({"baz":"qux","foo":"bar"}, [{"op":"remove","path":"/baz"}], undefined, {"foo":"bar"});
      });
      it("A.4.  Removing an Array Element", () => {
         run_test({"foo":["bar","qux","baz"]}, [{"op":"remove","path":"/foo/1"}], undefined, {"foo":["bar","baz"]});
      });
      it("A.5.  Replacing a Value", () => {
         run_test({"baz":"qux","foo":"bar"}, [{"op":"replace","path":"/baz","value":"boo"}], undefined, {"baz":"boo","foo":"bar"});
      });
      it("A.6.  Moving a Value", () => {
         run_test({"foo":{"bar":"baz","waldo":"fred"},"qux":{"corge":"grault"}}, [{"op":"move","from":"/foo/waldo","path":"/qux/thud"}], undefined, {"foo":{"bar":"baz"},"qux":{"corge":"grault","thud":"fred"}});
      });
      it("A.7.  Moving an Array Element", () => {
         run_test({"foo":["all","grass","cows","eat"]}, [{"op":"move","from":"/foo/1","path":"/foo/3"}], undefined, {"foo":["all","cows","eat","grass"]});
      });
      it("A.8.  Testing a Value: Success", () => {
         run_test({"baz":"qux","foo":["a",2,"c"]}, [{"op":"test","path":"/baz","value":"qux"},{"op":"test","path":"/foo/1","value":2}], undefined, {"baz":"qux","foo":["a",2,"c"]});
      });
      it("A.9.  Testing a Value: Error", () => {
         run_test({"baz":"qux"}, [{"op":"test","path":"/baz","value":"bar"}], "string not equivalent", undefined);
      });
      it("A.10.  Adding a nested Member Object", () => {
         run_test({"foo":"bar"}, [{"op":"add","path":"/child","value":{"grandchild":{}}}], undefined, {"foo":"bar","child":{"grandchild":{}}});
      });
      it("A.11.  Ignoring Unrecognized Elements", () => {
         run_test({"foo":"bar"}, [{"op":"add","path":"/baz","value":"qux","xyz":123}], undefined, {"foo":"bar","baz":"qux"});
      });
      it("A.12.  Adding to a Non-existent Target", () => {
         run_test({"foo":"bar"}, [{"op":"add","path":"/baz/bat","value":"qux"}], "add to a non-existent target", undefined);
      });
      xit("A.13 Invalid JSON Patch Document", () => {
         run_test({"foo":"bar"}, [{"op":"remove","path":"/baz","value":"qux"}], "operation has two 'op' members", undefined);
      });
      it("A.14. ~ Escape Ordering", () => {
         run_test({"/":9,"~1":10}, [{"op":"test","path":"/~01","value":10}], undefined, {"/":9,"~1":10});
      });
      it("A.15. Comparing Strings and Numbers", () => {
         run_test({"/":9,"~1":10}, [{"op":"test","path":"/~01","value":"10"}], "number is not equal to string", undefined);
      });
      it("A.16. Adding an Array Value", () => {
         run_test({"foo":["bar"]}, [{"op":"add","path":"/foo/-","value":["abc","def"]}], undefined, {"foo":["bar",["abc","def"]]});
      });
   });
});
