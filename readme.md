# Verifiable Delay Function (VDF) implementation compiled from Rust to WebAssembly
This repository is a port of [VDFs by POA Network](https://github.com/poanetwork/vdf) to WebAssemnbly, so that it runs in any modern browser or Node.js environment.

TypeScript support is also present.

NOTE: Performance is very bad right now, more than an order of magnitude slower than native code.

## How to install
```
npm install @subspace/vdf
```

## How to use
Node.js:
```javascript
import createVdf from '@subspace/vdf';

createVdf()
    .then((vdfInstance) => {
        const iterations = 3;
        const challenge = Buffer.from('aa', 'hex');
        const intSizeBits = 2048;
        const isPietrzak = false;
        const res = vdfInstance.generate(iterations, challenge, intSizeBits, isPietrzak);
        console.log(Buffer.from(res).toString('hex'));
        console.log(vdfInstance.verify(3, challenge, res, intSizeBits, isPietrzak));
    });
```
Browser:
```javascript
requirejs(['@subspace/vdf'], function (createVdf) {
    createVdf()
        .then((vdfInstance) => {
            const iterations = 3;
            const challenge = Uint8Array.of(170);
            const intSizeBits = 2048;
            const isPietrzak = false;
            const res = vdfInstance.generate(iterations, challenge, intSizeBits, isPietrzak);
            console.log(
                res.reduce(
                    (str, byte) => {
                        return str + byte.toString(16).padStart(2, '0');
                    },
                    ''
                )
            );
            console.log(vdfInstance.verify(3, challenge, res, intSizeBits, isPietrzak));
        });
});
```

## API

### createVdf(options): Promise<ILibrary>
Creates a new instance of Noise library
* `options` - [Options object](https://kripken.github.io/emscripten-site/docs/api_reference/module.html#affecting-execution) that will be passed to underlying Emscripten module (optional)

### ILibrary.generate(iterations: number, challenge: Uint8Array, intSizeBits: number, isPietrzak: boolean) => Uint8Array
Generates VDF proof for a given challenge and number of iterations

* `iterations` - number of VDF iterations
* `challenge` - VDF challenge
* `intSizeBits` - the length of the prime numbers generated
* `isPietrzak` - if Pietrzak VDF is used when `true` and Wesolowski VDF is used when `false`

Returns binary proof, may throw `Error` exception when failed to generate proof.

### ILibrary.verify(iterations: number, challenge: Uint8Array, proof: Uint8Array, intSizeBits: number, isPietrzak: boolean) => boolean
Generates VDF proof for a given challenge and number of iterations

* `iterations` - number of VDF iterations
* `challenge` - VDF challenge
* `proof` - previously generated proof that needs to be verified
* `intSizeBits` - the length of the prime numbers generated
* `isPietrzak` - if Pietrzak VDF is used when `true` and Wesolowski VDF is used when `false`

Returns `true` if `proof` is correct, may throw `Error` exception on incorrect input.

## Building source code
Even though this repo contains `vdf.js` and `vdf.wasm`, you may still want to build it from source yourself for testing purposes or for publishing updates to NPM.

Instructions below work on Linux (and maybe on macOS, but not tested).

### Dependencies
You'll need at least following:
* curl
* git
* gcc
* emmc, emconfigure (use https://emscripten.org/docs/getting_started/downloads.html)
* rustup (use https://rustup.rs/)

### Prepare
First, make sure you have Rust, Cargo and wasm32-unknown-emscripten target installed:
```bash
rustup target add wasm32-unknown-emscripten
```

### Build Rust to WebAssembly
This will compile GMP dependency and Rust code to `vdf.js` and `vdf.wasm` files under `src`.
```bash
./build.sh
```

### Build artifacts for NPM
Before publishing to NPM it is necessary to build TypeScript to JavaScript and create minified version of the JavaScript output:
```bash
npm run build
```

## Tests
To run tests use:
```bash
npm test
```

NOTE: We can't run tests against upstream repo's vectors yet because of performance issues, so instead we have a very basic test case to make sure it behaves as expected.

## Contribution
Feel free to create issues and send pull requests (for big changes create an issue first and link it from the PR), they are highly appreciated!

## License
MIT, see `license.txt`
