; SPDX-License-Identifier: BSD-3-Clause
.setcpu "65C02"

CRTC_SELECT = $4000
CRTC_VALUE  = $4001
SCREEN      = $3000
COLS        = 80
ROWS        = 32
PTR         = $00

.segment "CODE"
reset:
        sei
        cld
        ldx #$FF
        txs
        ldx #0
configure:
        stx CRTC_SELECT
        lda registers,x
        sta CRTC_VALUE
        inx
        cpx #16
        bne configure

        stz PTR
        lda #>SCREEN
        sta PTR+1
        lda #' '
        ldx #>(COLS * ROWS)
        ldy #0
clear:  sta (PTR),y
        iny
        bne clear
        inc PTR+1
        dex
        bne clear

        ldx #0
write:  lda message,x
        beq corners
        sta SCREEN+COLS+2,x
        inx
        bra write
corners:
        lda #'+'
        sta SCREEN
        sta SCREEN+COLS-1
        sta SCREEN+(ROWS-1)*COLS
        sta SCREEN+ROWS*COLS-1
        lda #'8'
        sta SCREEN+ROWS*COLS-4
        lda #'0'
        sta SCREEN+ROWS*COLS-3
        stp

registers:
        .byte 99, COLS, 82, $28, 38, 0, ROWS, 34, 0, 7, $20, 7, 0, 0, 0, 0
message:
        .asciiz "BRICKWRIGHT 6502 / MC6845 - 80 COLUMNS, 32 ROWS"

.segment "VECTORS"
        .addr reset, reset, reset
