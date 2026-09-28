from hub import port, sound, light_matrix
import runloop
import force_sensor
import motor

async def main():
    await light_matrix.write("GO?")
    await runloop.until(lambda: force_sensor.pressed(port.E))
    await sound.beep(523, 150)
    motor.run(port.A, 600)
    await runloop.sleep_ms(2000)
    motor.stop(port.A)
    print("force was", force_sensor.force(port.E))

runloop.run(main())
