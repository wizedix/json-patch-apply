import * as fs from 'fs';
import {DiffFlags} from "../src/types";

const pre = "      ";
const testEnd = pre + "});\n";
const testFlags: any = {
    "tests.json": {
        "diff": {
            6:  [DiffFlags.FAVOR_ORDINAL],
            24: [DiffFlags.FAVOR_ORDINAL],
            27: [DiffFlags.FAVOR_ORDINAL],
            47: [DiffFlags.USE_REPLACE_FOR_NULL],
            61: [DiffFlags.FAVOR_ORDINAL],
            63: [DiffFlags.USE_ADD_FOR_REPLACE_OF_ROOT]
        }
    },
    "spec_tests.json": {
        "diff": {
            7: [DiffFlags.FAVOR_ORDINAL]
        }
    }
};
// a few tests need to be skipped because they have patches that cannot be produced by our
// diff method.  For example if the patch is a single operation of type test this can be
// applied and verified but cannot be produced from diff.  Such tests are listed here and are skipped.
const skipped: any = {
    "tests.json": {
        // these cannot be generated with diff, for example they may be testing "test" op alone
        // or other no op operations which would not be generated in a diff
        "diff": [29, 45, 46, 52, 53, 54, 57, 58, 59]
    },
    "spec_tests.json": {
        "diff": [8, 11, 14]
    }
};

function writeTest(name: string, test: any, index: number) {
    return writeApplyTest(name, test, index) + writeDiffTest(name, test, index);
}

function writeTestHead(test: any, comment: string): string {
    return pre + (test["disabled"] ? "x" : "") + "it(\"" + comment + "\", () => {\n";
}

function generateComment(name: string, desc: string, test: any, index: number): string {
    let comment = name + " #" + index + " - " + desc;
    if(test.comment)
        comment += " " + test.comment;
    comment += " for test " + JSON.stringify(test);
    return comment.replace(/"/g, '\\"').replace(/\\\\"/g, '\\\\\\"');
}

function writeApplyTest(name: string, test: any, index: number): string {
    let out = writeTestHead(test, generateComment(name, "apply", test, index));
    out += pre + "   runApplyTest(" +
        JSON.stringify(test.doc) + ", " +
        JSON.stringify(test.patch) + ", " +
        JSON.stringify(test.error) + ", " +
        JSON.stringify(test.expected) + ");\n";
    out += testEnd;
    return out;
}

function writeDiffTest(name: string, test: any, index: number): string {
    let skip = skipped[name] && skipped[name]["diff"] && skipped[name]["diff"].includes(index);
    if(! skip && ! test.error) {
        let out = writeTestHead(test, generateComment(name, "diff", test, index));
        let flags: any = testFlags[name] && testFlags[name]["diff"] && testFlags[name]["diff"][index] ? testFlags[name]["diff"][index] : undefined;
        out += pre + `   runDiffTest(${JSON.stringify(test.doc)}, ${JSON.stringify(test.expected)}, ${JSON.stringify(test.patch)}${!!flags?", "+JSON.stringify(flags):""});\n`;
        out += testEnd;
        return out;
    }
    return "";
}

let tests1 = JSON.parse(fs.readFileSync('../json-patch-tests/tests.json').toString());
let tests2 = JSON.parse(fs.readFileSync('../json-patch-tests/spec_tests.json').toString());
let out = "";
out += "import {expect} from \"chai\";\n";
out += "import {Patch} from \"../index\";\n";
out += "import {PatchFlags, DiffFlags} from \"../src/types\";\n";
out += "\n";
out += "/**\n";
out += " * DO NOT CHANGE - changes will be lost!\n";
out += " * dynamically generated using generate_conformance.ts script see README.md file\n";
out += " * for details on how to re-generate or change this file.\n";
out += " */\n";
out += "\n";
out += "describe(\"conformance\", () => {\n";
out += "   function runApplyTest(doc: any, patch: any[], error: any, expected: any, flags?:PatchFlags[]) {\n";
out += "      try {\n";
out += "         let result = Patch.apply(doc, patch, flags);\n";
out += "         if(error) {\n";
out += "            throw new Error(\"Missing error: \" + error);\n";
out += "         } else {\n";
out += "            expect(result).eql(expected);\n";
out += "         }\n";
out += "      } catch(e) {\n";
out += "         if(error) {\n";
out += "             expect(!!e.message, error).be.true;\n";
out += "         } else {\n";
out += "            expect(\"Unexpected error: \" + e.message + \", missing expected: \" + JSON.stringify(expected)).eql('to pass');\n";
out += "         }\n";
out += "      }\n";
out += "   }\n";
out += "   function runDiffTest(source: any, target: any, expected: any[], flags?:DiffFlags[]) {\n";
out += "      let patch = Patch.diff(source, target, flags);\n";
out += "      expect(patch).eql(expected);\n";
out += "   }\n";
out += "   describe(\"tests.json - main tests\", () => {\n";
tests1.forEach((test: any, index: number) => {
    out += writeTest("tests.json", test, index);
});
out += "   });\n";
out += "   \n";
out += "   describe(\"spec_tests.json - RFC6902 spec\", () => {\n";
tests2.forEach((test: any, index: number) => {
    out += writeTest("spec_tests.json", test, index);
});
out += "   });\n";
out += "});\n";

fs.writeFileSync("./tests/conformance.spec.ts", out);
