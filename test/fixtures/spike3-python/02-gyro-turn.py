from hub import port, motion_sensor
import runloop
import motor_pair

def yaw_degrees():
    return motion_sensor.tilt_angles()[0] * -0.1

async def turn_right(target):
    motion_sensor.reset_yaw(0)
    motor_pair.move(motor_pair.PAIR_1, 100, velocity=200)
    await runloop.until(lambda: yaw_degrees() >= target)
    motor_pair.stop(motor_pair.PAIR_1)

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)
    await turn_right(90)
    await motor_pair.move_for_time(motor_pair.PAIR_1, 1500, 0, velocity=500)
    await turn_right(90)

runloop.run(main())
