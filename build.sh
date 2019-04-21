#!/usr/bin/env bash
set -e

if [[ ! -f $(which emconfigure) ]]; then
    echo emconfigure is not available
    exit 1
fi
if [[ ! -f $(which emcc) ]]; then
    echo emcc is not available
    exit 1
fi
if [[ ! -f $(which cargo) ]]; then
    echo cargo is not available
    exit 1
fi

cd `dirname "${BASH_SOURCE[0]}"`

TARGET_DIR=$(pwd)/src
CACHE_DIR=$(pwd)/.cache
BUILD_ARTIFACTS_LOCATION=target/wasm32-unknown-emscripten/release
GMP_RELEASE=gmp-6.1.2

mkdir -p $CACHE_DIR/lib

if [[ ! -f $CACHE_DIR/lib/libgmp.a ]]; then
    echo libgmp.a is not built yet, compiling it

    pushd $CACHE_DIR
        curl https://gmplib.org/download/gmp/$GMP_RELEASE.tar.bz2 -O
        tar xf $GMP_RELEASE.tar.bz2
        pushd $GMP_RELEASE
            CC_FOR_BUILD=$(which gcc) emconfigure ./configure --build i386-linux-gnu --host none --disable-assembly --disable-shared --prefix=$(pwd)/build
            patch < ../../src/gmp/config.h.patch
            make -j $(getconf _NPROCESSORS_ONLN)
            cp .libs/libgmp.a $CACHE_DIR/lib/
        popd
        rm -rf $GMP_RELEASE*
    popd
fi

if [[ -d $BUILD_ARTIFACTS_LOCATION/deps ]]; then
    rm -f $BUILD_ARTIFACTS_LOCATION/deps/*.wasm
fi

if [[ -d $BUILD_ARTIFACTS_LOCATION/deps ]]; then
    rm -f $BUILD_ARTIFACTS_LOCATION/deps/*.js
fi

echo Compiling to WebAssembly

cargo build --target=wasm32-unknown-emscripten --release

echo Creating build artifacts in $TARGET_DIR

mkdir -p $TARGET_DIR

rm -f $TARGET_DIR/vdf.{js,wasm}

cp $BUILD_ARTIFACTS_LOCATION/deps/*.wasm $TARGET_DIR/vdf.wasm
cp $BUILD_ARTIFACTS_LOCATION/deps/*.js $TARGET_DIR/vdf.js

wasm_artifact_name=$(basename $BUILD_ARTIFACTS_LOCATION/deps/*.wasm)
sed -i s/$wasm_artifact_name/vdf.wasm/ "$TARGET_DIR/vdf.js"

echo Done
