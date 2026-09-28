from hub import port
import runloop
import motor_pair

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)
    for _ in range(4):
        await motor_pair.move_for_degrees(motor_pair.PAIR_1, 720, 0, velocity=400)
        await motor_pair.move_for_degrees(motor_pair.PAIR_1, 190, 100, velocity=300)

runloop.run(main())
