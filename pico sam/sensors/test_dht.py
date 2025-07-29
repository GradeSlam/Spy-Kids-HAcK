import machine
import time
import dht

sensor = dht.DHT11(machine.Pin(4))  # Adjust pin if needed

while True:
    try:
        sensor.measure()
        print("Temperature:", sensor.temperature()*1.8 + 27.4, "°F")
        print("Humidity:", sensor.humidity() + 10, "%")
    except Exception as e:
        print("Error reading sensor:", e)
    time.sleep(2)
