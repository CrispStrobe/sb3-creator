/*
 * eater6502-vdp-hello — write "HELLO" to a TMS9918A name table.
 *
 * Machine: EATER6502 + TMS9918 at $4000.
 * BW_VDP_DATA ($4000) and BW_VDP_CTRL ($4001) are defined by
 * generateC when CHIP vdp1 = TMS9918 AT $4000 is declared.
 *
 * Graphics I mode, default pattern table (built-in font at $0000
 * in VRAM — the TMS9918 ships with no font ROM, but the emulator
 * preloads ASCII glyphs for exactly this use case).
 *
 * Name table at VRAM $3800 (R2 = 0x0E → base = 0x0E << 10 = $3800).
 * Color table at $0000, patterns at $0800 — the stock init.
 */

#define BW_VDP_DATA (*(volatile unsigned char *)0x4000u)
#define BW_VDP_CTRL (*(volatile unsigned char *)0x4001u)

static void vdp_wreg(unsigned char reg, unsigned char val)
{
    BW_VDP_CTRL = val;
    BW_VDP_CTRL = 0x80u | reg;
}

static void vdp_set_write_addr(unsigned int addr)
{
    BW_VDP_CTRL = (unsigned char)(addr & 0xFF);
    BW_VDP_CTRL = 0x40u | (unsigned char)((addr >> 8) & 0x3F);
}

static void vdp_write_glyph(unsigned char ch, const unsigned char *rows)
{
    unsigned char row;
    vdp_set_write_addr((unsigned int)ch * 8u);
    for (row = 0; row < 8; row++)
        BW_VDP_DATA = rows[row];
}

void main(void)
{
    static const unsigned char glyph_h[8] = { 0x42, 0x42, 0x42, 0x7E, 0x42, 0x42, 0x42, 0x00 };
    static const unsigned char glyph_e[8] = { 0x7E, 0x40, 0x40, 0x7C, 0x40, 0x40, 0x7E, 0x00 };
    static const unsigned char glyph_l[8] = { 0x40, 0x40, 0x40, 0x40, 0x40, 0x40, 0x7E, 0x00 };
    static const unsigned char glyph_o[8] = { 0x3C, 0x42, 0x42, 0x42, 0x42, 0x42, 0x3C, 0x00 };

    /* Graphics I mode: R0=0x00, R1=0xC0 (16K, blank off, no IRQ) */
    vdp_wreg(0, 0x00);
    vdp_wreg(1, 0xC0);

    /* Name table at $3800: R2 = 0x0E */
    vdp_wreg(2, 0x0E);

    /* Color table at $2000: R3 = 0x80 */
    vdp_wreg(3, 0x80);

    /* Pattern table at $0000: R4 = 0x00 */
    vdp_wreg(4, 0x00);

    /* Sprite attributes at $3B00. A $D0 Y coordinate ends the list. */
    vdp_wreg(5, 0x76);
    vdp_set_write_addr(0x3B00);
    BW_VDP_DATA = 0xD0;

    /* The VDP reads character patterns from RAM. Upload the four letter shapes. */
    vdp_write_glyph('H', glyph_h);
    vdp_write_glyph('E', glyph_e);
    vdp_write_glyph('L', glyph_l);
    vdp_write_glyph('O', glyph_o);

    /* Text color: white on dark blue (R7 = 0xF4) */
    vdp_wreg(7, 0xF4);

    /* Fill color table: white on dark blue for all 32 entries */
    vdp_set_write_addr(0x2000);
    {
        unsigned char i;
        for (i = 0; i < 32; i++)
            BW_VDP_DATA = 0xF4;
    }

    /* Clear the name table (768 bytes of spaces = 0x20) */
    vdp_set_write_addr(0x3800);
    {
        unsigned int i;
        for (i = 0; i < 768; i++)
            BW_VDP_DATA = 0x20;
    }

    /* Write "HELLO" at row 11, column 13 (center of 32x24 screen) */
    vdp_set_write_addr(0x3800 + 11 * 32 + 13);
    BW_VDP_DATA = 'H';
    BW_VDP_DATA = 'E';
    BW_VDP_DATA = 'L';
    BW_VDP_DATA = 'L';
    BW_VDP_DATA = 'O';

    /* Spin — the VDP displays the frame autonomously */
    for (;;) ;
}
