from hub import port
import runloop
import motor_pair
import color_sensor
import force_sensor

BASE = 300
GAIN = 4

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)
    while not force_sensor.pressed(port.E):
        error = color_sensor.reflection(port.C) - 50
        motor_pair.move_tank(motor_pair.PAIR_1, BASE + error * GAIN, BASE - error * GAIN)
        await runloop.sleep_ms(10)
    motor_pair.stop(motor_pair.PAIR_1)

runloop.run(main())
