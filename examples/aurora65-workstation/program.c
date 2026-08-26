/* Aurora-65: W65C02 + W65C22 + PS/2 + SSD1306 + SimpleVGA.
 * Original BrickWright firmware. See intro.md for provenance. */
#define VIA_ORB  (*(volatile unsigned char *)0x6000u)
#define VIA_ORA  (*(volatile unsigned char *)0x6001u)
#define VIA_DDRB (*(volatile unsigned char *)0x6002u)
#define VIA_DDRA (*(volatile unsigned char *)0x6003u)
#define VIA_PCR  (*(volatile unsigned char *)0x600Cu)
#define VIA_IFR  (*(volatile unsigned char *)0x600Du)
#define PB_BANK 0x01u
#define PB_SDA  0x02u
#define PB_SCL  0x04u
static unsigned char pb;
static void pb_write(unsigned char v) { pb = v; VIA_ORB = pb; }
static void sda(unsigned char hi) { pb_write(hi ? pb | PB_SDA : pb & (unsigned char)~PB_SDA); }
static void scl(unsigned char hi) { pb_write(hi ? pb | PB_SCL : pb & (unsigned char)~PB_SCL); }
static void i2c_delay(void) { volatile unsigned char i; for (i = 0; i < 3; ++i) ; }
static void i2c_start(void) { sda(1); scl(1); i2c_delay(); sda(0); i2c_delay(); scl(0); }
static void i2c_stop(void) { sda(0); scl(1); i2c_delay(); sda(1); i2c_delay(); }
static void i2c_write(unsigned char v) {
    unsigned char i;
    for (i = 0; i < 8; ++i) { sda((v & 0x80u) != 0); v <<= 1; scl(1); i2c_delay(); scl(0); i2c_delay(); }
    sda(1); scl(1); i2c_delay(); scl(0); /* ACK clock */
}
static void oled_cmd(unsigned char v) { i2c_start(); i2c_write(0x78); i2c_write(0); i2c_write(v); i2c_stop(); }
static void oled_data(void) { i2c_start(); i2c_write(0x78); i2c_write(0x40); }
static void oled_page(unsigned char page, unsigned char col) {
    oled_cmd((unsigned char)(0xB0u | page)); oled_cmd((unsigned char)(col & 15u));
    oled_cmd((unsigned char)(0x10u | (col >> 4)));
}
static void oled_init(void) {
    static const unsigned char init[] = {0xAE,0xD5,0x80,0xA8,0x3F,0xD3,0,0x40,0x8D,0x14,0x20,2,0xA1,0xC8,0xDA,0x12,0x81,0xCF,0xD9,0xF1,0xDB,0x40,0xA4,0xA6,0xAF};
    unsigned int i;
    for (i = 0; i < sizeof(init); ++i) oled_cmd(init[i]);
    /* Write the visible boot pages first. Avoid making an interactive 1 MHz
       machine wait behind a full-screen 1024-byte clear before it can type. */
    oled_page(0, 0); oled_data(); for (i = 0; i < 128; ++i) i2c_write((i & 7u) ? 1 : 0x7F); i2c_stop();
    oled_page(2, 12); oled_data(); for (i = 0; i < 104; ++i) i2c_write((i & 1u) ? 0x22 : 0x55); i2c_stop();
}
static void oled_key(unsigned char code) {
    unsigned char i;
    oled_page(5, 16); oled_data(); for (i = 0; i < 96; ++i) i2c_write(i < (code >> 1) ? 0x7E : 0); i2c_stop();
    oled_page(7, 40); oled_data();
    for (i = 0; i < 8; ++i) { i2c_write((code & (1u << i)) ? 0x7E : 0x18); i2c_write(0); }
    i2c_stop();
}
static void vga_put(unsigned char x, unsigned char y, unsigned char c) {
    *(volatile unsigned char *)(0x8000u + ((unsigned int)y << 8) + x) = (unsigned char)(0x20u | (c & 15u));
}
extern void vga_init_fast(void);
static void vga_init(void) {
    unsigned char row, x;
    pb_write((unsigned char)((pb & (unsigned char)~PB_BANK) | PB_SDA | PB_SCL));
    vga_init_fast();
    for (x = 10; x < 150; ++x) { vga_put(x, 10, 11); vga_put(x, 111, 11); }
    for (row = 11; row < 111; ++row) { vga_put(10, row, 11); vga_put(149, row, 11); }
    for (x = 18; x < 145; x = (unsigned char)(x + 8)) {
        vga_put(x, 32, 3); vga_put(x, 48, 5); vga_put(x, 64, 6); vga_put(x, 80, 9); vga_put(x, 96, 13);
    }
}
static void vga_key(unsigned char code) {
    static unsigned char cursor; unsigned char y; unsigned char color = (unsigned char)((code & 7u) | 8u);
    if (cursor < 16 || cursor >= 144) cursor = 16;
    for (y = 24; y < 104; ++y) vga_put(cursor, y, (y & 4u) ? color : (unsigned char)(code & 15u));
    ++cursor;
}
void main(void) {
    unsigned char code;
    pb = PB_SDA | PB_SCL; VIA_DDRB = PB_BANK | PB_SDA | PB_SCL; VIA_DDRA = 0;
    VIA_PCR = 1; /* CA1 rising edge = PS/2 DATA READY */ VIA_ORB = pb;
    (void)VIA_ORA; /* discard the capture chain's power-up edge */
    vga_init(); oled_init();
    for (;;) if (VIA_IFR & 2u) { code = VIA_ORA; vga_key(code); oled_key(code); }
}
