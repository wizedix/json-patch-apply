import {expect} from "chai";
import {Patch} from "../index";
import {PatchOperation} from "../src/types";
import * as _ from "lodash";

describe("index", () => {
    function verifyDiff(source: any, target: any, operations: PatchOperation[]) {
        let diff = Patch.diff(source, target);

        expect(diff.length).eq(operations.length);
        for(let i=0; i < operations.length; i++) {
            expect(diff[i]).eql(operations[i]);
        }
    }

    function verifyApply(source: any, target: any, operations: PatchOperation[]) {
        let result = Patch.apply(source, operations);
        expect(target).eql(result);
    }

    describe("diff and apply", () => {

        describe("can handle diffs of nested values", () => {
            let expected = [{
                    op: "replace",
                    path: "/location/country/name",
                    value: "USA"
                },{
                    op: "replace",
                    path: "/location/country/state/name",
                    value: "Washington"
                },{
                    op: "replace",
                    path: "/location/country/state/county/name",
                    value: "King"
                },{
                    op: "replace",
                    path: "/location/country/state/county/city/name",
                    value: "Seattle"
                }],
                source = {location: {country: {name: "Canada", state: {name: "British Columbia", county: {name: "Lower Midland", city: {name: "Vancouver"}}}}}},
                target = {location: {country: {name: "USA",    state: {name: "Washington",       county: {name: "King",          city: {name: "Seattle"  }}}}}};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("handles number to other type as replace", () => {
            let expected = [{
                    op: "replace",
                    path: "/num",
                    value: "abc"
                }],
                source = {num: 34},
                target = {num: "abc"};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("handles other type to number as replace", () => {
            let expected = [{
                    op: "replace",
                    path: "/num",
                    value: 26
                }],
                source = {num: "abc"},
                target = {num: 26};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can handle number updates", () => {
            let expected = [{
                    op: "replace",
                    path: "/num",
                    value: 26
                }],
                source = {num: 34},
                target = {num: 26};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        it("it can handle number updates", () => {
            let source = {num: 25};
            let value = Patch.apply(source, [{
                op: "replace",
                path: "/num",
                value: 26,
            },{
                op: "replace",
                path: "/num",
                value: 27
            }]);
            expect(value.num).eq(27);
        });
    });

    describe("add", () => {
        describe("add value of object with nexted fields", () => {
            let expected = [{"op":"add","path":"/attributes","value":{"child":{"name":"Bob"},"other":[1]}}],
                source = {},
                target = {
                    attributes: {
                        child: { name: "Bob" },
                        other: [ 1 ]
                    }};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("detects add node", () => {
            let expected = [{
                    op: "add",
                    path: "/name",
                    value: "Sophie"
                }],
                source = {},
                target = {name: "Sophie"};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can add an array", () => {
            let expected = [{
                    op: "add",
                    path: "/titles",
                    value: []
                }],
                source = {},
                target = {titles: []};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can add an item to a top level array", () => {
            let expected = [{
                    op: "add",
                    path: "/-",
                    value: 1
                }],
                source: any[] = [],
                target = [1];

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can add to beginning of array", () => {
            let expected = [{op:"add",path:"/titles/0",value:"King"}],
                source = {titles: ["Ruler"]},
                target = {titles: ["King", "Ruler"]};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        it("handles update of property of object in an array", () => {
            let expected = [{
                    op: "replace",
                    path: "/rows/0/id",
                    value: 3,
                    old: 1
                }],
                source = {rows: [{id: 1},{id: 2}]},
                target = {rows: [{id: 3},{id: 2}]};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("handles adding new object into an array", () => {
            let expected = [{"op":"add","path":"/rows/-","value":{"id":2,"n":{"a":"xyz"}}}],
                source = {rows: [{id: 1, n: {a: "abc"}}]},
                target = {rows: [{id: 1, n: {a: "abc"}},{id: 2, n: {a: "xyz"}}]};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can handle new fields on objects", () => {
            let expected = [{
                op: "add",
                path: "/name",
                value: "Captain Kirk"
            }];
            let source = {};
            let target = {name: "Captain Kirk"};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can handle new values at top level", () => {
            let expected = [{
                op: "add",
                path: "",
                value: "Captain Kirk"
            }];
            let source: any = undefined;
            let target = "Captain Kirk";

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });
    });

    describe("update", () => {
        describe("update simple property", () => {
            let expected = [{
                    op: "replace",
                    path: "/name",
                    value: "Veronica"
                }],
                source = {name: "Sophie"},
                target = {name: "Veronica"};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("update property with nested values", () => {
            let expected = [{"op":"replace","path":"/desc","value":{"level":{"type":"experience","value":34},"items":[{"name":"Bag of Holding"}]}}],
                source = {desc: "Sophie"},
                target = {desc: {
                        level: {
                            type: "experience",
                            value: 34
                        },
                        items: [{
                            name: "Bag of Holding"
                        }]
                    }};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });
    });

    describe("delete property", () => {
        describe("detects remove node", () => {
            let expected = [{
                    op: "remove",
                    path: "/name"
                }],
                source = {name: "Sophie"},
                target = {};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can remove an array", () => {
            let expected = [{
                    op: "remove",
                    path: "/titles"
                }],
                source = {titles: []},
                target = {};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can remove an item to a top level array", () => {
            let expected = [{
                    op: "remove",
                    path: "/0"
                }],
                source = [2],
                target: any[] = [];

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can remove from beginning of array", () => {
            let expected = [{"op":"remove","path":"/titles/0"}],
                source = {titles: ["King", "Ruler"]},
                target = {titles: ["Ruler"]};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });

        describe("can delete with nexted values", () => {
            let expected = [{"op":"remove","path":"/titles"}],
                source = {titles: [{
                        name: "King"
                    },{
                        name: "Ruler of Austria"
                    }]},
                target = {};

            it("can diff", () => verifyDiff(source, target, expected));
            it("can apply", () => verifyApply(source, target, expected));
        });
    });
});