/* stm32-startup.S — C runtime start for the STM32 flash images.
 *
 * SPDX-License-Identifier: MIT
 * Written for this repository (see LICENSE); not derived from ST/CMSIS
 * startup files.
 *
 * What silicon does at power-on: load SP from word 0 of flash, jump to the
 * address in word 1. SRAM holds garbage. A C program assumes initialised
 * globals hold their initialisers and the rest are zero, so before main()
 * someone has to copy .data from flash (LMA) to SRAM (VMA) and zero .bss.
 * That someone is Reset_Handler below.
 *
 * Generated programs bring their OWN vector table (section .vectors) whose
 * reset word is main itself and whose IRQ slots name the program's
 * handlers (TIM3, HardFault, ...). To keep those programs working
 * unchanged, the linker places THIS table at the start of flash and the
 * program's table right after it (between __bw_pv_start/__bw_pv_end).
 * Every exception except reset enters bw_dispatch, which reads the active
 * exception number from IPSR and tail-branches to the program's entry for
 * it, or parks in bw_default_handler when the program provides none. The
 * branch leaves LR (EXC_RETURN) untouched, so the program's handler
 * returns from the exception directly. Cost: a few cycles of latency.
 *
 * BW_VECTOR_COUNT (16 + number of IRQs) is passed with -D by the build.
 * Only Thumb-1 (ARMv6-M) instructions are used, so one file serves the
 * Cortex-M0, M0+ and M3 parts.
 */
#ifndef BW_VECTOR_COUNT
#define BW_VECTOR_COUNT 48
#endif

    .syntax unified
    .thumb

    .section .bw_isr_vector, "a", %progbits
    .align 2
    .global bw_startup_vectors
bw_startup_vectors:
    .word _estack
    .word Reset_Handler
    .rept BW_VECTOR_COUNT - 2
    .word bw_dispatch
    .endr

    .text
    .align 1

    .global Reset_Handler
    .type Reset_Handler, %function
    .thumb_func
Reset_Handler:
    /* .data: copy word by word from its flash image (both ends 4-aligned) */
    ldr  r0, =_sidata
    ldr  r1, =_sdata
    ldr  r2, =_edata
1:  cmp  r1, r2
    bhs  2f
    ldr  r3, [r0]
    str  r3, [r1]
    adds r0, #4
    adds r1, #4
    b    1b
    /* .bss: zero */
2:  ldr  r1, =_sbss
    ldr  r2, =_ebss
    movs r3, #0
3:  cmp  r1, r2
    bhs  4f
    str  r3, [r1]
    adds r1, #4
    b    3b
4:  bl   main
    /* main returned: nothing to return to on bare metal */
5:  b    5b
    .size Reset_Handler, . - Reset_Handler

    .global bw_dispatch
    .type bw_dispatch, %function
    .thumb_func
bw_dispatch:
    mrs  r0, ipsr
    lsls r0, r0, #2            /* byte offset of this exception's slot */
    ldr  r1, =__bw_pv_start
    ldr  r2, =__bw_pv_end
    subs r2, r2, r1            /* size of the program's table */
    cmp  r0, r2
    bhs  bw_default_handler    /* program's table too short */
    ldr  r1, [r1, r0]
    cmp  r1, #0
    beq  bw_default_handler    /* slot left empty by the program */
    bx   r1
    .size bw_dispatch, . - bw_dispatch

    .global bw_default_handler
    .type bw_default_handler, %function
    .thumb_func
bw_default_handler:
    b    bw_default_handler
    .size bw_default_handler, . - bw_default_handler

    .ltorg
