; crt0 for the EATER6502 machine — the minimum cc65 needs: hardware stack,
; cc65 software stack at top of RAM, BSS zeroed, DATA copied from ROM,
; then main(). main() never returns in generated programs; if it does, STP.
        .import   _main, zerobss, copydata
        .import   __RAM_START__, __RAM_SIZE__
        .importzp sp
        .PC02

        .segment "STARTUP"
reset:  sei
        cld
        ldx #$ff
        txs
        lda #<(__RAM_START__ + __RAM_SIZE__)
        sta sp
        lda #>(__RAM_START__ + __RAM_SIZE__)
        sta sp+1
        jsr zerobss
        jsr copydata
        jsr _main
halt:   .byte $db          ; STP — parks the emulated machine
        jmp halt

irq:    rti                 ; no interrupts in generated builds

        .segment "VECTORS"
        .word irq           ; NMI
        .word reset         ; RESET
        .word irq           ; IRQ/BRK
