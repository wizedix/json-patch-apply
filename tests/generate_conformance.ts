import * as fs from 'fs';

function write_test(test: any, index: number) {
    let pre = "      ";
    let out = pre;
    let comment = test.comment ? String(test.comment).replace(/"/g, '\\"') : "conformance #" + index;
    out += test["disabled"] ? "xit" : "it";
    out += "(\"" + comment + "\", () => {\n";
    out += pre + "   run_test(" +
        JSON.stringify(test.doc) + ", " +
        JSON.stringify(test.patch) + ", " +
        JSON.stringify(test.error) + ", " +
        JSON.stringify(test.expected) + ");\n";
    out += pre + "});\n";
    return out;
}

let tests1 = JSON.parse(fs.readFileSync('../json-patch-tests/tests.json').toString());
let tests2 = JSON.parse(fs.readFileSync('../json-patch-tests/spec_tests.json').toString());
let out = "";
out += "import {expect} from \"chai\";\n";
out += "import {Patch} from \"../index\";\n";
out += "\n";
out += "/**\n";
out += " * DO NOT CHANGE - changes will be lost!\n";
out += " * dynamically generated using generate_conformance.ts script see README.md file\n";
out += " * for details on how to re-generate or change this file.\n";
out += " */\n";
out += "\n";
out += "describe(\"conformance\", () => {\n";
out += "   function run_test(doc: any, patch: any[], error: any, expected: any) {\n";
out += "      try {\n";
out += "         let result = Patch.apply(doc, ...patch);\n";
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
out += "   describe(\"tests.json - main tests\", () => {\n";
tests1.forEach((test: any, index: number) => {
    out += write_test(test, index);
});
out += "   });\n";
out += "   \n";
out += "   describe(\"spec_tests.json - RFC6902 spec\", () => {\n";
tests2.forEach((test: any, index: number) => {
    out += write_test(test, index);
});
out += "   });\n";
out += "});\n";

fs.writeFileSync("./tests/conformance.spec.ts", out);
