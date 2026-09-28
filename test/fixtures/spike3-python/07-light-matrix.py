from hub import light_matrix
import runloop

async def main():
    light_matrix.clear()
    for i in range(5):
        light_matrix.set_pixel(i, i, 100)
        await runloop.sleep_ms(100)
    await light_matrix.write(str(42))
    light_matrix.show([100] * 25)

runloop.run(main())
