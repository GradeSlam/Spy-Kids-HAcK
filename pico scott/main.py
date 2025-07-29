from connections import connect_mqtt, connect_internet
from time import sleep
from machine import Pin, I2C
import utime
from ssd1306 import SSD1306_I2C

trigger_pin = Pin(13, Pin.OUT)
echo_pin = Pin(12, Pin.IN)

# Initialize I2C for OLED
i2c = I2C(0, scl=Pin(1), sda=Pin(0), freq=400000)


oled_width = 128
oled_height = 64

oled = SSD1306_I2C(oled_width, oled_height, i2c)

# Clear display initially
oled.fill(0)
oled.show()

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

# Function to display message on OLED
def display_to_OLED(topic, message):
    print(f"Received message on topic {topic}: {message}")
    
    # Clear the display
    oled.fill(0)
    
    message_str = message.decode()
    if len(message_str) <= 16:  # If message fits on one line
        oled.text( message_str, 0, 16)
    else:  # If message is longer, split it
        oled.text("Msg: " + message_str[:16], 0, 16)
        oled.text(message_str[16:32], 0, 26)  # Second line
        if len(message_str) > 32:
            oled.text(message_str[32:48], 0, 36)
    
    oled.show()
    

def main():
    try:
        connect_internet("bruins",password="connect12") #ssid (wifi name), pass
        client = connect_mqtt("a876142773f2422e924cdf632778dc2d.s1.eu.hivemq.cloud", "Enrico", "Matthew1") # url, user, pass
        
        # Subscribe to topic to receive messages from backend
        client.set_callback(display_to_OLED)
        client.subscribe("display")
        print("Subscribed to 'display' topic")

        while True:
            sleep(2)
            client.check_msg()
            dist = distance_cm()
            client.publish("ultrasonic", str(dist))
            print("Distance: {:.1f} cm".format(dist))
            

    except KeyboardInterrupt:
        print('keyboard interrupt')
        
        
if __name__ == "__main__":
    main()





