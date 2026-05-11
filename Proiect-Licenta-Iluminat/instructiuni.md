# Proiect Licenta - Instructiuni instalare si configurare

Acest document descrie pasii pentru:

- pregatirea mediului de dezvoltare
- conectarea dintre `PC -> Arduino UNO -> ESP12F_Relay_30A_X8`
- configurarea Arduino IDE
- configurarea firmware-ului
- scrierea sketch-ului pe placa
- verificarea functionarii dupa upload

## 1. Componente necesare

### Hardware

- `ESP12F_Relay_30A_X8`
- `Arduino UNO` folosit ca adaptor USB-Serial
- cablu USB pentru Arduino UNO
- fire jumper
- sursa de alimentare pentru placa de relee, daca este necesar

### Software

- `Arduino IDE`
- pachetul de placi `ESP8266` pentru Arduino IDE
- biblioteca `PubSubClient`

## 2. Fisiere importante in proiect

- `Proiect_Licenta_Iluminat/Proiect_Licenta_Iluminat.ino` - logica firmware
- `Proiect_Licenta_Iluminat/config.h` - variabile de configurare
- `README.md` - descriere scurta a proiectului

## 3. Rolul Arduino UNO in programare

In acest scenariu, `Arduino UNO` nu ruleaza sketch-ul proiectului. El este folosit doar ca adaptor `USB -> Serial` intre PC si modulul ESP8266 de pe placa `ESP12F_Relay_30A_X8`.

Pentru a evita interferenta microcontrollerului ATmega328P de pe UNO:

- conecteaza pinul `RESET` de pe Arduino UNO la `GND`

Asta tine ATmega in reset si lasa partea USB-Serial disponibila pentru ESP.

## 4. Conexiunea dintre PC -> Arduino UNO -> ESP12F_Relay_30A_X8

### 4.1 Conectarea la PC

- conecteaza Arduino UNO la PC prin cablu USB

### 4.2 Conectarea pinilor

| Arduino UNO | ESP12F_Relay_30A_X8 | Rol |
|---|---|---|
| `GND` | `GND` | masa comuna |
| `D0 / RX` | `TX` | receptie pe UNO din ESP |
| `D1 / TX` | `RX` | transmisie din UNO spre ESP |
| `5V` | `5V` | alimentare, doar daca placa folosita accepta 5V pe acest pin |
| `GND` | `GPIO0` | pune ESP8266 in flash mode |
| `RESET` legat la `GND` | - | dezactiveaza microcontrollerul UNO |

### 4.3 Observatii importante

- `TX` si `RX` se leaga incrucisat: `TX -> RX`, `RX -> TX`
- `GPIO0` trebuie legat la `GND` doar in timpul programarii
- dupa upload, `GPIO0` trebuie deconectat de la `GND`
- nu programa placa in timp ce ai consumatori de `230V` conectati la relee

## 5. Ordinea recomandata pentru conectare

1. conecteaza Arduino UNO la PC prin USB
2. leaga `RESET` de pe UNO la `GND`
3. realizeaza legaturile `GND`, `TX`, `RX`, `5V`
4. leaga `GPIO0` de pe placa ESP la `GND`
5. alimenteaza placa
6. deschide Arduino IDE

## 6. Instalarea suportului ESP8266 in Arduino IDE

1. deschide `File -> Preferences`
2. in `Additional Boards Manager URLs` adauga:

```text
http://arduino.esp8266.com/stable/package_esp8266com_index.json
```

3. apasa `OK`
4. mergi la `Tools -> Board -> Boards Manager`
5. cauta `ESP8266`
6. instaleaza pachetul oficial `ESP8266`

## 7. Instalarea bibliotecii PubSubClient

1. mergi la `Sketch -> Include Library -> Manage Libraries`
2. cauta `PubSubClient`
3. instaleaza `PubSubClient by Nick O'Leary`

## 8. Setari in Arduino IDE pentru upload

Selecteaza:

- `Tools -> Board -> ESP8266 Boards -> Generic ESP8266 Module`
- `Tools -> Port` -> portul pe care apare Arduino UNO

Setari recomandate:

| Setare | Valoare |
|---|---|
| Board | `Generic ESP8266 Module` |
| Flash Mode | `DIO` |
| Flash Frequency | `40MHz` |
| CPU Frequency | `80MHz` |
| Flash Size | `4MB` |
| Upload Speed | `115200` |

Daca upload-ul esueaza, incearca:

- `57600`
- `9600`

## 9. Configurarea proiectului

Deschide fisierul:

```text
Proiect_Licenta_Iluminat/config.h
```

Si completeaza valorile:

```cpp
const char* WIFI_SSID = "Licenta-RPi-AP";
const char* WIFI_PASSWORD = "licenta-rpi";
const IPAddress WIFI_LOCAL_IP(192, 168, 4, 2);
const IPAddress WIFI_GATEWAY(192, 168, 4, 1);
const IPAddress WIFI_SUBNET(255, 255, 255, 0);
const IPAddress WIFI_DNS(192, 168, 4, 1);
const char* MQTT_BROKER = "192.168.4.1";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER = "licenta";
const char* MQTT_PASSWORD = "licenta";
```

Adresa IP a modulului ESP in reteaua WiFi va fi fixa:

```text
192.168.4.2
```

Topicurile folosite sunt:

```text
LICENTA/ILUMINAT/COMANDA
LICENTA/ILUMINAT/STATUS
```

## 10. Cum se face upload-ul sketch-ului

1. deschide `Proiect_Licenta_Iluminat/Proiect_Licenta_Iluminat.ino`
2. verifica daca `config.h` este completat
3. verifica daca `GPIO0` este conectat la `GND`
4. apasa `Verify`
5. apasa `Upload`
6. daca este nevoie, reporneste placa exact cand incepe procesul de upload
7. asteapta confirmarea `Done uploading`

## 11. Ce faci dupa upload

1. scoate legatura `GPIO0 -> GND`
2. reporneste placa
3. deschide `Serial Monitor`
4. seteaza viteza seriala la `115200`
5. verifica mesajele de conectare la WiFi si MQTT

## 12. Comportamentul firmware-ului

- se conecteaza la WiFi-ul creat de Raspberry Pi
- se conecteaza la brokerul MQTT de pe Raspberry Pi
- urmareste topicul `LICENTA/ILUMINAT/COMANDA`
- accepta mesaje de forma:

```text
RELEU-X-Y
```

unde:

- `X` este releul `1..8`
- `Y` este starea `0` sau `1`

- la fiecare reconectare MQTT, urmareste si topicul `LICENTA/ILUMINAT/STATUS`
- aplica primul mesaj valid de forma:

```text
ABCDEFGH
```

- dupa restaurare, se dezaboneaza de la `STATUS` pana la urmatoarea reconectare

## 13. Exemple de mesaje

### Comenzi

```text
RELEU-1-1
RELEU-4-0
RELEU-8-1
```

### Status

```text
10000001
```

Interpretare:

- releul 1 pornit
- releele 2-7 oprite
- releul 8 pornit

## 14. Probleme frecvente

### Upload-ul nu porneste

Verifica:

- `GPIO0 -> GND`
- portul selectat in Arduino IDE
- cablul USB
- repornirea placii inainte sau la inceputul upload-ului

### Nu exista comunicatie seriala

Verifica:

- `D0 / RX` de pe UNO catre `TX` de pe ESP
- `D1 / TX` de pe UNO catre `RX` de pe ESP
- `GND` comun

### Placa nu se conecteaza la WiFi

Verifica:

- valorile din `config.h`
- daca reteaua Raspberry Pi este pornita
- daca parola este corecta

### Placa nu revine la statusul anterior

Verifica:

- daca Raspberry Pi publica pe `LICENTA/ILUMINAT/STATUS`
- daca mesajul are exact 8 caractere `0` sau `1`
- daca Raspberry Pi retrimite mesajul sau il publica retained

### Placa se reseteaza

Cauze probabile:

- alimentare insuficienta
- contact slab pe fire
- sursa instabila in timpul activarii WiFi
