# NES PPU

## Hardware Emulation Approach 

Probably one of the more difficult things when writing an NES emulator from my experience so far is just knowing where to begin when it comes to implementing the PPU. 

After a while, running `nestest.nes` a few times, you will get a sense of some security in that your emulated 2A03 CPU is "good enough". Another thing is that you will need something new to show off!  

Now it's time to implement the PPU! But, where do we begin? This document aims to give one a "first start" when it comes to writing a basic NES PPU emulation. As of this current time, NesThing doesn't really have a full-featured PPU -- yet. But it can output some background frames of *Donkey Kong*. 

The following discussion aims to give the reader an approach to achieve the same thing with their own implementation. 

I should also warn that everything that will be discussed in this document is in the context of NTSC video. However, most of the information is applicable to PAL too... it's just that the *exact* numbers will be slightly differet, but if you're familiar with video, you will know what to look out for... refresh rates, timings, etc. These are all easily referenced elsewhere.

## The Facts

The system architecture of the NES is not **von Neumann**. That is, it is **not** a system architecture that is designed for components to work serially, where all input is given to the CPU, and the CPU works to give output to some other device. The basic diagram from this [article](https://en.wikipedia.org/wiki/Von_Neumann_architecture) is shown below:

![von Neumann architecture](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Von_Neumann_Architecture.svg/2560px-Von_Neumann_Architecture.svg.png)


Since the NES is not a von Neumann machine, and the CPU and PPU do not execute serially. These 2 components execute in parallel. Therefore, since the CPU and PPU share the same data bus, they can really mess each other up depending on how programs are written! 

When first thinking about how the CPU and PPU execute alongside one another, it is not obvious. One approach is to write a multi-threaded emulator where the CPU and PPU are executed in 2 different threads at once and access each other through calls. This is very complicated, and generally not a recommend approach at all.

Since the NES CPU and PPU execute at the same time in real-life, we will compensate by emulating this parallel execution through explotation of the fact that modern computers are generally very fast. We can execute the CPU and PPU separately, in the smallest possible time periods we can manage. We can define a "small time period" as a single CPU instruction. Then we can decide that for every CPU instruction, the emulator will execute the number of PPU cycles needed to "catch-up" to the CPU. See the discussion on [emulator catchup](https://wiki.nesdev.com/w/index.php/Catch-up).

## Execution

The CPU runs at a clock rate of 1.79 MHz, and since the PPU runs 3x the number of cycles the CPU runs for every instruction, the hardware PPU can be deduced to have a clock of 5.37 MHz. All these clock speeds are derived by a main clock with the CPU and PPU clock values being some divided value of it.

In the case of the NES, the main clock is `21.4772 MHz` with the CPU clock being `21.4772/12` and PPU being `21.4772/4`.

In our implementation, we will execute 3 PPU cycles for every CPU cycle. For every instruction, where the number of cycles it had taken the emulated CPU core to execute, we can define it by `cpuCyclesExecuted`. The PPU cycles then can be found by multiplying this number by 3 -- which can be represented as: `ppuCyclesToRun = 3 * cpuCyclesExecuted`.


Forgetting about optimizations, we can visualize pseudo-code to be a loop like this for "parallel" CPU and PPU execution: 

```
while(cpuIsRunning) {
    cpuCyclesExecuted = cpu.Run();

    let ppuCyclesToRun = 3 * cpuCyclesExecuted;
    while(ppuCycles > 0) {
        ppu.run(); // the ppu.run() method runs the PPU for 1 cycle.
        ppuCyclesToRun--;
    }
}
```

## Interfacing Between the CPU and PPU


THe PPU also interacts with the CPU through memory-mapped I/O. The PPU's registered as exposed at the CPU address space in addresses `$2000` to `$2007`, giving a total of 8 bytes for the CPU to communicate with the PPU.


It is important to know that these registers just serve as an alias to the hardware registers to the PPU. So that means that if the CPU is writing to `$2006` with the databyte, the databyte will be stored directly in the PPU hardware register. 

The PPU has several registers:

`v` the VRAM register which is 14 bits wide.
`t` the temporary VRAM register which is also 14 bits wide.
`x` the fine x scroll register;
`w` the second write toggle

## Colors and Palette

![Standard NES color palette](assets/ppu_color_palette.png)

The NES PPU can output a total of 64 colors in its color space. Really, only 52 color are "unique". These colors are actually more of a **CLUT** (color lookup table), and the RGB values have already been predefined. 

It is then fair to claim and assume that each value such as `$2C` read from memory when dealing with colors refers to the light-blue color as seen in the palette shown above. Or more precisely: `rgb(62, 194, 205)`, or:

![Color 2C](assets/ppu_color_2C.png)

Since we are dealing with writing an emulator, let's start referring to "dots" as "pixels" to be rendered. Ultimately the end goal of implementing the PPU is to output an image rendered on screen on what the real PPU would output onto the television.

Just because there are 64 colors to choose from to represent an image does not mean they can all be used at once. An even bigger restriction, which lead to creative art during the later titles released on the NES was that the number of active colors on screen could only be 16.

This means that each pixel to be rendered is represented by **4 bits** (0 - 15).

The structure of these 4 bits allow us to determine which color to output onto the screen:

```
AAHL
```

`AA` are the 2 bits which represents the specific palette index of which palette the colors will be coming from.

`HL` represents the 2 bits which given the palette, the offset from the specific palette address to add to the base palette address which will then contain the byte of the color

The memory layout of the background palettes is as follows:

|Address|Palette Index|
|-------|-------------|
|$3F00|Universal background color|
|$3F01|0|
|$3F05|1|
|$3F09|2|
|$3F0D|3|

Suppose then our memory map is as follows:

```
$3F00: $0F
$3F01: $2C
$3F02: $38
$3F03: $12
$3F04: $0F
$3F05: $27
...
$3F08: $27
```

A 4 bit string representing a single can be: `0010` which translates to hex value `$2`. Dissecting this, we can see that `AA = 00` which then gives us a `basePaletteAddress = $3F01`. The index, which is zero based can be calculated by taking the lower order 2 bits where `HL = 10`: `colorOffset = $10 - $01 = $01`. We then compute the `effectiveAddress` of the color byte as follows:

```
const effectiveAddress = basePaletteAddress + colorOffset;

= $3F01 + $1 = $3F02
```

Looking at memory, we find that `$3F02` gives us the color `$38` which going back to our color palette gives us: `rgb(228, 220, 168)`, or:

![Color value 38](assets/ppu_color_38.png)

Now we will go into detail on how we even compose the following 4 bit string: `AAHL`. For that, we must understand how *background tile rendering* works.

## Background Tile Rendering

Since we know that a single color is a string of 4 bits, `AAHL`, you may expect that we need 3 different pieces of information. In fact, we need 4!

The next few sections introduce some terminology which will hopefully clarify a lot of the ambiguity when it comes to getting your first frame rendered!

## Nametable

The nametable is essentially a representation of 32x30 tiles, where each tile is composed of 8x8 pixels. Each nametable byte at a specific address is a reference for a background pattern.

Background patterns are referenced at either `$0000`, or `$1000` -- depending on what is set in `PpuReg$2000`.

The nametables start at addresses `$2000`, `$2400`, `$2800`, and `$2C00`. Each nametable is then 960 bytes each, with some space allocated for attribute memory (64 bytes). Therefore, each nametable is compared of 1024 bytes. 

Since the PPU's VRAM is only 2 KB, there can only be 2 active nametables at a time. We will discuss on how these nametables are referenced later, but for now, the important concept is to understand that the each address within the address space of a nametable, points to an offset at which where to start retrieving the real background pattern bytes. 

Each background tile is actually composed of 16 bytes which are computed along with the attribute byte to form an 8x8 tile image. The nametable is just used as an index to indicate where to begin fetching these bytes.

## Background Pattern Tiles

As mentioned before, to calculate where the background tiles to fetch, we can take the `nametableAddress` along with the `backgroundTileBaseAddress` and compute the location on where to begin fetching the pattern tiles:

```
const lowBgTile = backgroundTileBaseAddress + ($10 * getByte(nametableAddress)) + fineY;

const highBgTile = backgroundTileBaseAddress + ($10 * getByte(nametableAddress)) + fineY + 8;
```

We will discuss `fineY` soon but notice the `+8` when computing the `highBgTile`. A single background pattern is composed of 16 bytes. 8 bytes serve as a low bit of a 2 bit color index offset. 

## Attribute Byte

## UNSORTED INFORMATION (WIP)

1. Nametable Byte
2. Attribute Byte
3. Tile Low
4. Tile High



The NES PPU also renders out 240 visible scanlines. In every scanline, there are 341 cycles performed. 256 of those cycles are allocated towards rendering out a dot to the screen.

Therefore, it is sufficient to say that a scanline, made up with 256 dots per scanline.

---
## References

1. NesDev Cycle Reference Chart. NesDev Wiki. https://wiki.nesdev.com/w/index.php/Cycle_reference_chart 
2. Von Neumann Architecture. Wikipedia. https://en.wikipedia.org/wiki/Von_Neumann_architecture
3. NesDev PPU Palettes. NesDev Wiki. (https://wiki.nesdev.com/w/index.php/PPU_palettes)