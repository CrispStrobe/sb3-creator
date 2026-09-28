from hub import port, motion_sensor
import runloop
import motor_pair

async def main():
    motor_pair.pair(motor_pair.PAIR_2, port.C, port.D)
    await motor_pair.move_tank_for_degrees(motor_pair.PAIR_2, 360, 400, 200)
    await motor_pair.move_tank_for_time(motor_pair.PAIR_2, -300, -300, 800)
    yaw, pitch, roll = motion_sensor.tilt_angles()
    print(yaw)
    if motion_sensor.up_face() == motion_sensor.TOP:
        await motor_pair.move_for_degrees(motor_pair.PAIR_2, -360, 0)

runloop.run(main())
