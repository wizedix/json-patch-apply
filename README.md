# json-patch-apply
an implementation of JSON patch RFC 6902

# Usage
Currently this is only set up for use with Typescript projects.  I will fix this in the future.
```
npm i @wizard9/json-patch-apply -S
```
In your project include it:
```
import {Patch} from "@wizard9/json-patch-apply";

let diff = Patch.diff(source, target);
let modified = Patch.apply(source, ...diff);

// after this modified will be the same as target and diff contains the changes needed to make them the same
```
For more information on the format of patch etc. see here: https://tools.ietf.org/html/rfc6902

# Build Locally
```
npm install
npm test
```
Then to use in another project while working on this one you can use npm link etc.

To clean all generated directories/files and the node_modules directory run this:
```
npm run clean
```

# Set up tests in WebStorm
1. Edit Configurations
2. (+) Add Configuration
3. Select 'Mocha'
4. Under "Extra Mocha Options" enter this: --require ts-node/register/transpile-only
5. Select "File Patterns" as an option and enter this as "Test File Patterns": tests/**/*.spec.ts
6. Run test

# Run Tests With Coverage
To run all tests with coverage run this command.
```
npm run coverage
```
Prints output like this:
```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------|---------|----------|---------|---------|-------------------
All files             |     100 |      100 |     100 |     100 |                   
 json-patch-apply     |     100 |      100 |     100 |     100 |                   
  index.ts            |     100 |      100 |     100 |     100 |                   
 json-patch-apply/src |     100 |      100 |     100 |     100 |                   
  apply.ts            |     100 |      100 |     100 |     100 |                   
  common.ts           |     100 |      100 |     100 |     100 |                   
  diff.ts             |     100 |      100 |     100 |     100 |                   
  pointer.ts          |     100 |      100 |     100 |     100 |                   
----------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 185/185 )
Branches     : 100% ( 114/114 )
Functions    : 100% ( 37/37 )
Lines        : 100% ( 181/181 )
================================================================================
```
# Re-generate json-patch conformance tests
In the event that the json-patch-tests chnage in the future, conformance tests can be regenerated as follows:
In directory above patch (peer to patch dir)
```
git clone https://github.com/json-patch/json-patch-tests.git
```
in patch dir
```
rm tests/conformance.spec.ts
npm run generate-conformance
```
This will produce a file in tests called conformance.spec.ts.  Add changed file to git. After this you can run the 
tests as per usual and they will be ran when you run the other tests.

