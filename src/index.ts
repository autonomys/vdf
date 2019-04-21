// @ts-ignore
import vdf = require('./vdf');

/**
 * Emscripten's module instance, typed as `any`, so you should really now what you are doing if you want to use it
 */
type EmscriptenModule = any;

interface ILibrary {
    generate: (
        iterations: number,
        challenge: Uint8Array,
        intSizeBits: number,
        isPietrzak: boolean,
    ) => Uint8Array;
    verify: (
        iterations: number,
        challenge: Uint8Array,
        proof: Uint8Array,
        intSizeBits: number,
        isPietrzak: boolean,
    ) => boolean;
    _lib_internal: EmscriptenModule;
}

async function CreateLib(lib: EmscriptenModule, options?: object): Promise<ILibrary> {
    const libInstance = lib(options);

    /**
     * Generate VDF proof
     *
     * @param iterations
     * @param challenge
     * @param intSizeBits
     * @param isPietrzak
     */
    function generate(
        iterations: number,
        challenge: Uint8Array,
        intSizeBits: number,
        isPietrzak: boolean,
    ): Uint8Array {
        if (isPietrzak && (iterations % 2 !== 0 || iterations < 66)) {
            throw new Error('Number of iterations must be even and at least 66');
        }
        const proofPtr = libInstance.allocatePointer();
        const proofSize = libInstance.allocateBytes(4);
        const challengeBuffer = libInstance.allocateBytes(0, challenge);
        const result = libInstance._generate(
            iterations,
            challengeBuffer,
            challengeBuffer.length,
            intSizeBits,
            isPietrzak,
            proofPtr,
            proofSize,
        );
        if (result === 0) {
            const proof = proofPtr.dereference(proofSize.get(Uint32Array)[0]);
            const proofValue = proof.get();
            proofPtr.free();
            proofSize.free();
            challengeBuffer.free();
            proof.free();
            return proofValue;
        } else {
            proofPtr.free();
            proofSize.free();
            challengeBuffer.free();
            throw new Error('Failed to generate proof');
        }
    }

    /**
     * Verify that VDF proof is correct
     *
     * @param iterations
     * @param challenge
     * @param proof
     * @param intSizeBits
     * @param isPietrzak
     */
    function verify(
        iterations: number,
        challenge: Uint8Array,
        proof: Uint8Array,
        intSizeBits: number,
        isPietrzak: boolean,
    ): boolean {
        if (isPietrzak && (iterations % 2 !== 0 || iterations < 66)) {
            throw new Error('Number of iterations must be even and at least 66');
        }
        const challengeBuffer = libInstance.allocateBytes(0, challenge);
        const proofBuffer = libInstance.allocateBytes(0, proof);
        const result = libInstance._verify(
            iterations,
            challengeBuffer,
            challengeBuffer.length,
            proofBuffer,
            proofBuffer.length,
            intSizeBits,
            isPietrzak,
        );
        challengeBuffer.free();
        proofBuffer.free();
        return Boolean(result);
    }

    await new Promise((resolve) => {
        libInstance.then(() => {
            resolve();
        });
    });

    return {
        _lib_internal: lib,
        generate: generate,
        verify: verify,
    };
}

function wrapper(lib: EmscriptenModule): (options?: object) => Promise<ILibrary> {
    return CreateLib.bind(null, lib);
}

export default wrapper(vdf);
