from machine import Pin
import utime

trigger_pin = Pin(17, Pin.OUT)
echo_pin = Pin(16, Pin.IN)
def distance_cm():
    trigger_pin.low()
    utime.sleep_us(2)
    trigger_pin.high()
    utime.sleep_us(5)
    trigger_pin.low()

    while echo_pin.value() == 0:
        start_time = utime.ticks_us()
    while echo_pin.value() == 1:
        end_time = utime.ticks_us()

    duration = end_time - start_time
    distance = (duration * 0.0343) / 2
    return distance

#while True:
    #dist = distance_cm()
    #print("Distance: {:.1f} cm".format(dist))
    #utime.sleep(1)