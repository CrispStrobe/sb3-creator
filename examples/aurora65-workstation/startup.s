.export _start
.export _vga_init_fast
.import _main
.importzp sp
.segment "STARTUP"
_start: sei
        cld
        ldx #$ff
        txs
        lda #<$4000
        sta sp
        lda #>$4000
        sta sp+1
        jsr _main
hang:   bra hang
.segment "VECTORS"
        .word _start
        .word _start
        .word _start

.segment "ZEROPAGE"
vga_ptr: .res 2

.segment "CODE"
; Fill one complete 32 KB VRAM bank with valid idle sync, then carve the
; 24-byte horizontal-sync pulse into every row. This is about 20x faster
; than cc65 pointer arithmetic and makes boot comfortably interactive.
_vga_init_fast:
        stz vga_ptr
        lda #$80
        sta vga_ptr+1
        ldx #128
@fillpage:
        ldy #0
        lda #$20
@fill: sta (vga_ptr),y
        iny
        bne @fill
        inc vga_ptr+1
        dex
        bne @fillpage
        lda #$a4
        sta vga_ptr
        lda #$80
        sta vga_ptr+1
        ldx #128
@syncrow:
        ldy #0
        lda #0
@sync: sta (vga_ptr),y
        iny
        cpy #24
        bne @sync
        inc vga_ptr+1
        dex
        bne @syncrow
        lda #$40
        sta $f5a4
        rts
