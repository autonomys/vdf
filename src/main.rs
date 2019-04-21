// TODO: Next line will hopefully replace `.cargo/config` in future
//#[link_args = "-L .cache/lib --closure 0 -s -Oz --llvm-lto 1 -s EXPORTED_RUNTIME_METHODS=[] -s DEFAULT_LIBRARY_FUNCS_TO_INCLUDE=[] -s EXPORTED_FUNCTIONS=['_malloc','_free','_generate','_verify'] -s MODULARIZE=1 -s WASM=1 --post-js src/bytes_allocation.js"]

extern crate vdf;

use vdf::{PietrzakVDFParams, VDFParams, WesolowskiVDFParams, VDF, InvalidIterations};
use std::{mem, slice};

fn main() {
    // Just to make Rust compiler happy
}


fn generate_impl(iterations: u64, challenge: Vec<u8>, int_size_bits: u16, is_pietrzak: bool) -> Result<Vec<u8>, InvalidIterations> {
    let vdf: Box<dyn VDF> =
        if is_pietrzak {
            Box::new(PietrzakVDFParams(int_size_bits).new()) as _
        } else {
            Box::new(WesolowskiVDFParams(int_size_bits).new()) as _
        };

    return vdf.solve(&challenge, iterations);
}

pub extern fn verify_impl(iterations: u64, challenge: Vec<u8>, proof: Vec<u8>, int_size_bits: u16, is_pietrzak: bool) -> bool {
    let vdf: Box<dyn VDF> =
        if is_pietrzak {
            Box::new(PietrzakVDFParams(int_size_bits).new()) as _
        } else {
            Box::new(WesolowskiVDFParams(int_size_bits).new()) as _
        };

    return match vdf.verify(&challenge, iterations, &proof) {
        Ok(()) => true,
        Err(_) => false
    };
}

#[no_mangle]
pub extern fn generate(iterations: u32, challenge: *const u8, challenge_size: usize, int_size_bits: u16, is_pietrzak: bool, proof: *mut *const u8, proof_size: *mut usize) -> u8 {
    unsafe {
        let result = generate_impl(
            iterations as u64,
            slice::from_raw_parts(challenge, challenge_size).to_vec(),
            int_size_bits,
            is_pietrzak,
        );
        return match result {
            Ok(proof_generated) => {
                *proof = proof_generated.as_slice().as_ptr();
                *proof_size = proof_generated.len();
                mem::forget(proof_generated);
                0
            }
            Err(_) => 1
        };
    }
}

#[no_mangle]
pub extern fn verify(iterations: u32, challenge: *const u8, challenge_size: usize, proof: *const u8, proof_size: usize, int_size_bits: u16, is_pietrzak: bool) -> bool {
    unsafe {
        return verify_impl(
            iterations as u64,
            slice::from_raw_parts(challenge, challenge_size).to_vec(),
            slice::from_raw_parts(proof, proof_size).to_vec(),
            int_size_bits,
            is_pietrzak,
        );
    }
}
