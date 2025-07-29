import time
from machine import disable_irq, enable_irq, Pin

class DHTBase:
    def __init__(self, pin):
        self.pin = pin
        self.pin.init(Pin.OPEN_DRAIN)
        self.pin.value(1)

    def measure(self):
        self.pin.value(0)
        time.sleep_ms(20)
        self.pin.value(1)
        time.sleep_us(40)
        irq_state = disable_irq()
        try:
            if self._check_response():
                data = self._collect_input()
                if self._validate(data):
                    self._process_data(data)
                else:
                    raise Exception("Checksum failure")
            else:
                raise Exception("Sensor not responding")
        finally:
            enable_irq(irq_state)

    def _check_response(self):
        if self._wait_for_pin(0, 100) and self._wait_for_pin(1, 100):
            return True
        return False

    def _wait_for_pin(self, val, timeout):
        t = time.ticks_us()
        while self.pin.value() != val:
            if time.ticks_diff(time.ticks_us(), t) > timeout:
                return False
        return True

    def _collect_input(self):
        data = []
        for _ in range(40):
            while self.pin.value() == 0:
                pass
            t = time.ticks_us()
            while self.pin.value() == 1:
                pass
            duration = time.ticks_diff(time.ticks_us(), t)
            data.append(duration)
        return data

    def _validate(self, data):
        bits = [1 if pulse > 50 else 0 for pulse in data]
        the_bytes = []
        for i in range(5):
            byte = 0
            for j in range(8):
                byte <<= 1
                byte |= bits[i * 8 + j]
            the_bytes.append(byte)
        checksum = sum(the_bytes[0:4]) & 0xFF
        if checksum != the_bytes[4]:
            return False
        self.data = the_bytes
        return True

    def _process_data(self, data):
        raise NotImplementedError()

class DHT11(DHTBase):
    def __init__(self, pin):
        super().__init__(pin)

    def _process_data(self, data):
        self.temperature_value = self.data[2]
        self.humidity_value = self.data[0]

    def temperature(self):
        return self.temperature_value

    def humidity(self):
        return self.humidity_value

class DHT22(DHTBase):
    def __init__(self, pin):
        super().__init__(pin)

    def _process_data(self, data):
        self.humidity_value = ((self.data[0] << 8) + self.data[1]) / 10
        self.temperature_value = (((self.data[2] & 0x7F) << 8) + self.data[3]) / 10
        if self.data[2] & 0x80:
            self.temperature_value = -self.temperature_value

    def temperature(self):
        return self.temperature_value

    def humidity(self):
        return self.humidity_value
