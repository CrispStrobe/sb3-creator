from hub import port, light_matrix, sound
import motor
import time

light_matrix.show_image(light_matrix.IMAGE_HAPPY)
motor.run(port.A, 300)
time.sleep_ms(1000)
motor.stop(port.A)
sound.beep(440, 200, 50)
