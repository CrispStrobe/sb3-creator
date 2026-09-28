from hub import port, light_matrix, button
import runloop
import motor

count = 0

async def blink():
    while True:
        light_matrix.set_pixel(2, 2, 100)
        await runloop.sleep_ms(250)
        light_matrix.set_pixel(2, 2, 0)
        await runloop.sleep_ms(250)

async def spin():
    global count
    while count < 3:
        await motor.run_for_degrees(port.B, 360, 720)
        count += 1
    await runloop.until(lambda: button.pressed(button.LEFT))
    motor.stop(port.B)

runloop.run(blink(), spin())
