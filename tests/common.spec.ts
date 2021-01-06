import {expect} from "chai";
import {firstElement, getValue, getValueType, ValueType} from "../src/common";

describe("common", () => {
    describe("firstElement", () => {
        it("errors out with firstElement of empty", () => {
            try {
                firstElement([]);
                throw new Error("Missing error");
            } catch (e) {
                expect(e.message).eql("cannot get first of empty list");
            }
        });
    });

    describe("getValue", () => {
        it("returns value when present", () => {
            let a = {b: 123};
            expect(getValue(a, "b")).eql(123);
        });

        it("returns undefined when value not present", () => {
            let a = {};
            expect(getValue(a, "b")).be.undefined;
        });
    });

    describe("getValueType", () => {
        it("returns array for array", () => {
            expect(ValueType.array).eql(getValueType([]));
        });

        it("returns object for object", () => {
            expect(ValueType.object).eql(getValueType({}));
        });

        it("returns primitive for other types", () => {
            expect(ValueType.primitive).eql(getValueType(123));
            expect(ValueType.primitive).eql(getValueType("abc"));
            expect(ValueType.primitive).eql(getValueType(true));
            expect(ValueType.primitive).eql(getValueType(false));
            expect(ValueType.primitive).eql(getValueType(undefined));
        });
    });
});