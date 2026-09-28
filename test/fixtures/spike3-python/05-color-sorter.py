from hub import port, light_matrix
import runloop
import motor
import color_sensor
import color

async def main():
    while True:
        c = color_sensor.color(port.C)
        if c == color.RED:
            light_matrix.show_image(light_matrix.IMAGE_HEART)
            await motor.run_to_absolute_position(port.F, 90, 300)
        elif c is color.BLUE:
            light_matrix.show_image(light_matrix.IMAGE_SAD)
            await motor.run_to_absolute_position(port.F, -90, 300)
        else:
            light_matrix.clear()
        await runloop.sleep_ms(100)

runloop.run(main())
