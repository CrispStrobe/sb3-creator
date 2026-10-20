/* stm32g030-flash.ld — STM32G030 flash layout (Cortex-M0+, 64K flash at
 * 0x08000000, 8K SRAM at 0x20000000).
 *
 * A REAL flash image, booted the way silicon (and the bw-board emulator)
 * boots it: word 0 is the initial SP, word 1 the reset handler.
 *
 * Flash starts with the startup table from stm32-startup.S (SP = end of
 * SRAM, Reset_Handler, every other slot -> bw_dispatch), then the
 * program's own .vectors table, which bw_dispatch forwards exceptions to.
 * Assembly sources linked without the startup object get their .vectors
 * first, as before.
 *
 * Reset_Handler copies .data from its flash image (_sidata) to SRAM
 * (_sdata.._edata) and zeroes .bss (_sbss.._ebss) before calling main:
 * SRAM is garbage at power-on.
 *
 * __bw_stack_reserve bytes of SRAM are kept free above .bss for the
 * stack; a program whose globals eat into it fails at link time.
 */
ENTRY(main)

__bw_stack_reserve = 1024;

MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 64K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 8K
}

SECTIONS
{
    .text :
    {
        KEEP(*(.bw_isr_vector))
        __bw_pv_start = .;
        KEEP(*(.vectors))
        __bw_pv_end = .;
        *(.text.startup*) *(.text*) *(.rodata*)
        . = ALIGN(4);
    } > FLASH

    .data :
    {
        . = ALIGN(4);
        _sdata = .;
        *(.data*)
        . = ALIGN(4);
        _edata = .;
    } > RAM AT> FLASH
    _sidata = LOADADDR(.data);

    .bss (NOLOAD) :
    {
        . = ALIGN(4);
        _sbss = .;
        *(.bss*) *(COMMON)
        . = ALIGN(4);
        _ebss = .;
    } > RAM

    _estack = ORIGIN(RAM) + LENGTH(RAM);

    ASSERT(_ebss + __bw_stack_reserve <= _estack,
           "stm32g030: globals (.data + .bss) leave less than the 1024-byte stack reserve in 8 KB SRAM - use fewer or smaller variables/lists")
}
