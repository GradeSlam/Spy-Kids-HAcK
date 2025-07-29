import machine
import time
import dht
from machine import ADC

adc = ADC(28)
sensor = dht.DHT11(machine.Pin(4))  # Adjust pin if needed

while True:
    try:
        sensor.measure()
        Lumens = (-1/(65535-2192))*adc.read_u16() + 2192/(65535-2192) + 1
        print("Temperature:", sensor.temperature()*1.8 + 27.4, "°F")
        print("Humidity:", sensor.humidity() + 10, "%")
        print(f"Lumens: {Lumens}")
    except Exception as e:
        print("Error", e)
    time.sleep(2)
    



