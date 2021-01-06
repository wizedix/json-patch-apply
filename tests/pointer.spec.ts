import {expect} from 'chai';
import {JsonPointer} from "../src/pointer";

describe("pointer", () => {

    describe("encode/decode", () => {
        it("handles key without ~ or /", () => {
            expect(JsonPointer.encode("abc")).eql("abc");
            expect(JsonPointer.encode("123")).eql("123");

            expect(JsonPointer.decode("abc")).eql("abc");
            expect(JsonPointer.decode("123")).eql("123");
        });

        it("handles ~", () => {
            expect(JsonPointer.encode("~ab")).eql("~0ab");
            expect(JsonPointer.encode("a~b")).eql("a~0b");
            expect(JsonPointer.encode("ab~")).eql("ab~0");

            expect(JsonPointer.decode("~0ab")).eql("~ab");
            expect(JsonPointer.decode("a~0b")).eql("a~b");
            expect(JsonPointer.decode("ab~0")).eql("ab~");
        });

        it("handles /", () => {
            expect(JsonPointer.encode("/ab")).eql("~1ab");
            expect(JsonPointer.encode("a/b")).eql("a~1b");
            expect(JsonPointer.encode("ab/")).eql("ab~1");

            expect(JsonPointer.decode("~1ab")).eql("/ab");
            expect(JsonPointer.decode("a~1b")).eql("a/b");
            expect(JsonPointer.decode("ab~1")).eql("ab/");
        });

        it("can decode encoded to same thing", () => {
            let chars = ["~", "/", "a", "b"];
            let s: string[] = [""];
            for(let i=0; i < chars.length; i++) {
                let c = chars[i];
                let len = s.length;
                for(let x=0; x < len; x++) {
                    let sv = s.shift();
                    if(sv && sv.length == 0) {
                        s.push(c);
                    } else {
                        s.push(c + sv);
                        s.push(sv + c);
                    }
                }
            }
            s.forEach((sv) => {
                let encoded = JsonPointer.encode(sv);
                let decoded = JsonPointer.decode(encoded);
                expect(sv, "expected encode/decode of '" + sv + "' to work").eql(decoded);
            });
        });
    });

    describe("find", () => {
        it("returns undefined when pointing at root", () => {
            expect(JsonPointer.findParent("abc", "")).not.be.undefined;
            expect(JsonPointer.findParent("abc", "/")).not.be.undefined;
        });

        it("fails with invalid path", () => {
            try {
                JsonPointer.findParent("abc", "a/");
                throw new Error("missing error");
            } catch (e) {
                expect(e.message).eql("Invalid JSON Pointer syntax.  Path should always begin with a /");
            }
        });

        it("returns index for top level array", () => {
            let source = [0];
            let find = JsonPointer.findParent(source, "/0");
            expect(find).not.undefined;
            if(find) {
                expect(find.key).eq("0");
                expect(find.parent).eq(source);
            }
        });

        it("returns index for nested array", () => {
            let source = {test: [0]};
            let find = JsonPointer.findParent(source, "/test/0");
            expect(find).not.undefined;
            if(find) {
                expect(find.key).eq("0");
                expect(find.parent).eq(source.test);
            }
        });

        it("returns key for top level object", () => {
            let source = {name:"Peter"};
            let find = JsonPointer.findParent(source, "/name");
            expect(find).not.undefined;
            if(find) {
                expect(find.key).eq("name");
                expect(find.parent).eq(source);
            }
        });

        it("returns key for nested object", () => {
            let source = {test: {name:"Peter"}};
            let find = JsonPointer.findParent(source, "/test/name");
            expect(find).not.undefined;
            if(find) {
                expect(find.key).eq("name");
                expect(find.parent).eq(source.test);
            }
        });

        it("returns undefined when path does not exist", () => {
            let source = {test: {name:"Peter"}};
            let top = JsonPointer.findParent(source, "/missing");
            let nested = JsonPointer.findParent(source, "/test/missing");
            let missing = JsonPointer.findParent(source, "/missing/missing");
            if(top && nested && !missing) {
                expect(top.parent).eq(source);
                expect(top.key).eq("missing");
                expect(nested.parent).eq(source.test);
                expect(nested.key).eq("missing");
            } else {
                expect(top).not.be.undefined;
                expect(nested).not.be.undefined;
            }
            expect(missing).be.undefined;
        });
    });
});