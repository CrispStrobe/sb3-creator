from hub import port, sound
import runloop
import motor_pair
import distance_sensor

def close_to_wall():
    d = distance_sensor.distance(port.D)
    return d != -1 and d < 150

async def main():
    motor_pair.pair(motor_pair.PAIR_1, port.A, port.B)
    motor_pair.move(motor_pair.PAIR_1, 0, velocity=450)
    while True:
        d = distance_sensor.distance(port.D)
        if d != -1 and d < 150:
            break
        await runloop.sleep_ms(20)
    motor_pair.stop(motor_pair.PAIR_1)
    await sound.beep(880, 300)

runloop.run(main())
