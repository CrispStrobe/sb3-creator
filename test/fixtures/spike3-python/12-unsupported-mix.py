from hub import port, light, sound
import runloop
import color_sensor
import distance_sensor
import color

async def main():
    light.color(light.POWER, color.GREEN)
    r, g, b, i = color_sensor.rgbi(port.C)
    distance_sensor.show(port.D, [100, 0, 100, 0])
    sound.volume(40)
    await sound.beep(660, 100)

runloop.run(main())
