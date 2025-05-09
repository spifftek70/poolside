import serial

ser = serial.Serial(
    port='/dev/ttyS0',
    baudrate=9600,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=1
)

# Send a status request to IntelliFlo VSF (address 1)
message = bytes([0x16, 0x02, 0x01, 0x00, 0x00, 0x00, 0x16, 0x03])
ser.write(message)

# Read response
response = ser.read(32)
print("Response (hex):", response.hex())

ser.close()