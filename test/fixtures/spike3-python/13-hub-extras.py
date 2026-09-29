from hub import port, light, light_matrix, sound, motion_sensor
import runloop
import color_sensor
import distance_sensor
import motor_pair
import color

async def main():
    light.color(light.POWER, color.RED)
    sound.volume(60)
    distance_sensor.clear(port.D)
    distance_sensor.show(port.D, [100, 0, 0, 100])
    motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)
    motion_sensor.reset_yaw(0)
    motor_pair.move(motor_pair.PAIR_1, 100, velocity=222)
    await runloop.until(lambda: motion_sensor.angular_velocity()[2] < -100)
    motor_pair.stop(motor_pair.PAIR_1)
    red = color_sensor.rgbi(port.C)[0]
    if red > 500:
        light_matrix.show([100] * 25)

runloop.run(main())
