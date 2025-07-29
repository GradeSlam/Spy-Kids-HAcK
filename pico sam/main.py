from connections import connect_mqtt, connect_internet
import time
from machine import Pin
from machine import ADC
import dht


adc = ADC(28)
sensor = dht.DHT11(machine.Pin(4))

def main():
    try:
        connect_internet("HAcK-Project-WiFi-1",password="UCLA.HAcK.2024.Summer") #ssid (wifi name), pass
        client = connect_mqtt("a876142773f2422e924cdf632778dc2d.s1.eu.hivemq.cloud", "Enrico", "Matthew1") # url, user, pass
        
        

        while True:
            try:
                sensor.measure()
                Lumens = (-1/(65535-2192))*adc.read_u16() + 2192/(65535-2192) + 1
                temp = sensor.temperature()*1.8 + 27.4
                humidity = sensor.humidity() + 10
                client.publish("temp", temp)
                client.publish("humidity", humidity)
                client.publish("light", Lumens)
                print("Temperature:", sensor.temperature()*1.8 + 27.4, "°F")
                print("Humidity:", humidity, "%")
                print(f"Lumens: {Lumens}")
            except Exception as e:
                print("Error", e)
            time.sleep(2)
            

    except KeyboardInterrupt:
        print('keyboard interrupt')
        
        
if __name__ == "__main__":
    main()





