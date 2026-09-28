from hub import port
import runloop
import motor

ARM = port.C

async def main():
    motor.reset_relative_position(ARM, 0)
    await motor.run_to_relative_position(ARM, 120, 300)
    await motor.run_for_time(ARM, 500, -200)
    where = motor.relative_position(ARM)
    print(where)
    angle = motor.absolute_position(ARM)
    if angle > 0:
        await motor.run_to_absolute_position(ARM, 0, 200, direction=motor.COUNTERCLOCKWISE)
    motor.stop(ARM, stop=motor.HOLD)

runloop.run(main())
