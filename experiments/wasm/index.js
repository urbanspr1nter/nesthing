const importObject ={
    env: {
      STACKTOP: 0,
      STACK_MAX:65536,
      abortStackOverflow: function(val) { throw new Error("stackoverfow"); },
      memory: new WebAssembly.Memory( { initial: 256, maximum:256 } ),
      table: new WebAssembly.Table( { initial:14, maximum:14, element: "anyfunc" } ),
      __memory_base:0,
      __table_base:0,
      _clock: () => {},
      abort: () => {},
      ___syscall146: () => {},
      _emscripten_memcpy_big: () => {},
      ___syscall6: () => {},
      ___syscall54: () => {},
      _time: () => {},
      ___syscall140: () => {},
      _printf: () => {},
      _rand: () => {},
      _srand: () => {},
      abortOnCannotGrowMemory: () => {},
      nullFunc_ii: () => {},
      nullFunc_iiii: () => {},
      nullFunc_jiji: () => {},
      ___lock: () => {},
      ___setErrNo: () => {},
      ___unlock: () => {},
      _emscripten_get_heap_size: () => {},
      _emscripten_memcpy_big: () => {},
      _emscripten_resize_heap: () => {},
      setTempRet0: () => {},
      tempDoublePtr: 0,
      DYNAMICTOP_PTR: 0
    }
};

WebAssembly.instantiateStreaming(fetch("main.wasm"), importObject).then((m) => {
    const { instance } = m;

    const n = instance.exports._benchmark();
    console.log(n);
});