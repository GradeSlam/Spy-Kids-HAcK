from machine import ADC
import time

adc = ADC(28)



print("Testing Light in 5 Seconds")
time.sleep(5)
Lumens = (-1/(65535-2192))*adc.read_u16() + 2192/(65535-2192) + 1
print(Lumens)
print(adc.read_u16())

