[Sistem automatizare instalatii electrice tip Smart-House folosind Arduino](../index.html)

# Instructiuni de instalare si configurare

Acest ghid explica instalarea, configurarea si scrierea sketch-ului pentru proiectul `Proiect-Licenta-Acces-Supraveghere`.

Poti alege una dintre cele doua placi:

- `ESP32-S3-N16R8 IoT ESP-CAM Dev Board`
- `FireBeetle 2 ESP32-P4 Development Board + IO Expansion Board`

Pentru schema hardware detaliata si alimentari, vezi si `docs/hardware.html`.

## 1. Ce se pastreaza identic pe ambele variante

Pe ambele placi, proiectul foloseste:

- Raspberry Pi ca host pentru Wi-Fi
- Raspberry Pi ca broker MQTT
- `TMC2209` pentru usa garajului
- micro servo `9g` pentru blocarea/deblocarea portii
- card `microSD` / `TF` pentru fisierele web si `acces.conf`
- aceleasi topicuri MQTT:
  - `LICENTA/ACCES/GARAJ` cu mesaje `deschide`, `stop`, `inchide`
  - `LICENTA/ACCES/POARTA` cu mesaje `blocheaza`, `deblocheaza`
  - `LICENTA/ACCES/STATUS` pentru status JSON retained

## 2. Ce difera intre placi

| Aspect | ESP32-S3-N16R8 ESP-CAM | FireBeetle 2 ESP32-P4 + IO Expansion |
| --- | --- | --- |
| Board in Arduino IDE | `ESP32S3 Dev Module` | `ESP32P4 Dev Module` |
| Camera in acest proiect | da, `OV5640` | da, in aplicatia `esp32-p4-ov5640-video-server` bazata pe ESP-IDF |
| microSD/TF | onboard | onboard |
| Stepper | da | da |
| Servo | da | da |
| Wi-Fi si MQTT | da | da |

Important: pe `ESP32-P4`, daca vrei camera `OV5640`, MQTT, garaj si poarta in acelasi firmware, foloseste `esp32-p4-ov5640-video-server`. Sketch-ul Arduino principal pentru `ESP32-P4` ramane doar o varianta de test pentru actuatori.

## 3. Componente necesare

Componente comune:

- placa aleasa: `ESP32-S3` sau `ESP32-P4`
- driver stepper `TMC2209`
- motor `Bondtech NEMA17 Pancake Stepper 22mm`
- micro servo `9g`
- card `microSD`
- cablu `USB-C`
- sursa principala `12V`
- modul coborator `9-35V -> 5V 5A`

Pentru varianta `ESP32-S3`, mai ai:

- camera `OV5640` montata pe placa

Recomandat:

- radiator pentru `TMC2209`
- condensator `100uF - 470uF` intre `VMOT` si `GND` la TMC2209
- condensator `470uF - 1000uF` pe linia de `5V` daca servo-ul produce caderi de tensiune
- doua limit switch-uri pentru capetele de cursa ale garajului

## 4. Alimentare

Schema de alimentare este aceeasi pe ambele placi:

Pentru tabelele complete de conexiuni si checklist-ul electric, foloseste pagina `docs/hardware.html`.

```text
Sursa 12V
  +--> VMOT TMC2209
  +--> intrare buck 9-35V -> 5V

Buck 5V
  +--> 5V ESP32
  +--> 5V servo

Toate GND-urile:
  sursa 12V
  buck
  ESP32
  TMC2209
  servo
```

Nu alimenta:

- stepper-ul din `5V`
- servo-ul din `3.3V`

## 5. Wiring pentru fiecare placa

### 5.1. Varianta ESP32-S3

Conexiuni:

- `GPIO1` -> `STEP` pe `TMC2209`
- `GPIO14` -> `DIR`
- `GPIO21` -> `EN` / `ENN`
- `GPIO42` -> semnal servo
- `GND ESP32` -> `GND TMC2209`
- `GND ESP32` -> `GND servo`

microSD onboard:

- `CLK=39`
- `CMD=38`
- `D0=40`

Camera `OV5640` este deja definita in sketch si folosita automat pe acest profil.

### 5.2. Varianta FireBeetle 2 ESP32-P4 + IO Expansion

Conexiuni:

- `GPIO20 / A0` -> `STEP` pe `TMC2209`
- `GPIO21 / A1` -> `DIR`
- `GPIO22 / A2` -> `EN` / `ENN`
- `GPIO23 / A3` -> semnal servo
- `GND ESP32-P4` -> `GND TMC2209`
- `GND ESP32-P4` -> `GND servo`

TF card onboard:

- `D0=39`
- `D1=40`
- `D2=41`
- `D3=42`
- `CLK=43`
- `CMD=44`
- `TF enable=45`

Aplicatia recomandata pentru `ESP32-P4` este `esp32-p4-ov5640-video-server`, care foloseste camera MIPI `OV5640` si include si controlul pentru garaj si poarta.

Pini pe care ii lasam liberi pe `ESP32-P4`:

- `GPIO7/GPIO8`, pentru `SDA/SCL` si camera/SCCB
- `GPIO39-45`, pentru TF card
- `GPIO14-19`, `GPIO54` si `GPIO6`, pentru modulul Wi-Fi/Bluetooth `ESP32-C6`
- `GPIO35`, pentru `BOOT`

## 6. Motorul stepper si TMC2209

Motorul folosit este:

- `Bondtech NEMA17 Pancake Stepper 22mm`

Setari recomandate pentru primele teste:

- curent TMC2209: aproximativ `0.6A - 0.8A RMS`
- incepe cu `GARAGE_STEP_INTERVAL_US=2500`
- calibreaza `GARAGE_TRAVEL_STEPS` dupa mecanica reala

Motorul se leaga la:

- `A1/A2` = bobina A
- `B1/B2` = bobina B

Daca motorul merge invers:

- seteaza `TMC_INVERT_DIRECTION=true` in `acces.conf`

## 7. Raspberry Pi: Wi-Fi si MQTT

Valorile implicite din proiect sunt:

```ini
WIFI_SSID=Licenta-RPi-AP
WIFI_PASSWORD=licenta-rpi
MQTT_HOST=192.168.4.1
MQTT_PORT=1883
MQTT_USERNAME=licenta
MQTT_PASSWORD=licenta
```

Exemplu de IP primit de placa:

```ini
STATIC_IP=192.168.4.3
```

## 8. Pregatirea cardului microSD / TF

1. Formateaza cardul in `FAT32`.
2. Copiaza in radacina cardului:
   - `index.html`
   - `upload.html`
   - `acces.conf`

Pentru varianta `ESP32-P4`, copiaza optional si fisierul:

- `esp32-p4-ov5640-video-server/sdcard/acces-p4.html`

Aplicatia `ESP32-P4` monteaza cardul la `/sdcard`. Endpoint-ul `http://IP/acces` incarca `acces-p4.html` de pe card daca fisierul exista, iar daca nu exista foloseste pagina inclusa in firmware.

Fisierele sursa sunt in:

- `licenta-acces-supraveghere/sdcard/index.html`
- `licenta-acces-supraveghere/sdcard/upload.html`
- `licenta-acces-supraveghere/sdcard/acces.conf.example`
- `licenta-acces-supraveghere/sdcard/acces-static.conf.example`

Exemplu de `acces.conf`:

```ini
WIFI_SSID=Licenta-RPi-AP
WIFI_PASSWORD=licenta-rpi
MQTT_HOST=192.168.4.1
MQTT_PORT=1883
MQTT_USERNAME=licenta
MQTT_PASSWORD=licenta
MQTT_CLIENT_ID=licenta-acces-placa1
STATIC_IP=192.168.4.3
STATIC_GATEWAY=
STATIC_SUBNET=255.255.255.0
STATIC_DNS1=192.168.4.1
STATIC_DNS2=
GARAGE_TRAVEL_STEPS=2400
GARAGE_STEP_INTERVAL_US=2500
TMC_ENABLE_AFTER_MOVE=false
TMC_INVERT_DIRECTION=false
SERVO_LOCKED_DEG=20
SERVO_UNLOCKED_DEG=95
```

Explicatii:

- `MQTT_CLIENT_ID` trebuie sa fie unic daca ai mai multe placi
- `GARAGE_TRAVEL_STEPS` este numarul de pasi pentru cursa completa
- `TMC_ENABLE_AFTER_MOVE=true` mentine cuplu dupa oprire, dar incalzeste mai mult
- `SERVO_LOCKED_DEG` si `SERVO_UNLOCKED_DEG` se calibreaza mecanic

## 9. Instalarea Arduino IDE

1. Instaleaza `Arduino IDE 2.x`.
2. Deschide `Boards Manager`.
3. Instaleaza `esp32 by Espressif Systems`.
4. Deschide `Library Manager`.
5. Instaleaza biblioteca `PubSubClient`.

Restul bibliotecilor necesare vin din pachetul `esp32`.

## 10. Selectarea placii in Arduino IDE

### Daca folosesti ESP32-S3

In `Tools`, selecteaza:

- `Board -> ESP32S3 Dev Module`

Setari recomandate:

- `USB CDC On Boot -> Enabled`
- `Flash Size -> 16MB`
- `PSRAM -> OPI PSRAM` sau `Enabled`
- `Upload Speed -> 460800` sau `921600`
- `Port -> COM-ul placii`

### Daca folosesti FireBeetle 2 ESP32-P4 in Arduino IDE pentru test rapid actuatori

In `Tools`, selecteaza:

- `Board -> ESP32P4 Dev Module`

Setari recomandate:

- `USB CDC On Boot -> Enabled`
- `Partition Scheme -> valoarea implicita a placii`
- `Flash Size -> 16MB`, daca optiunea este afisata
- `PSRAM -> valoarea implicita a placii`
- `Upload Speed -> 460800` sau `921600`
- `Port -> COM-ul placii`

## 11. Deschiderea proiectului

In Arduino IDE:

1. `File -> Open`
2. Deschide fisierul:

`licenta-acces-supraveghere/licenta-acces-supraveghere.ino`

Sketch-ul detecteaza automat tinta de compilare si activeaza profilul `ESP32-S3` sau `ESP32-P4`.

Pentru varianta completa `ESP32-P4`, cu camera si control in acelasi firmware, foloseste subproiectul:

- `esp32-p4-ov5640-video-server`

## 12. ESP32-P4 cu ESP-IDF

Pentru `FireBeetle 2 ESP32-P4 Development Board + IO Expansion Board`, aplicatia recomandata este:

- `esp32-p4-ov5640-video-server`

Aceasta aplicatie include:

- stream `OV5640` pe `http://IP:81/stream`
- pagina video Espressif pe `http://IP/`
- pagina de control acces pe `http://IP/acces`
- stare JSON pe `http://IP/api/access_status`
- control HTTP pentru garaj:
  - `/api/garage/open`
  - `/api/garage/stop`
  - `/api/garage/close`
- control HTTP pentru poarta:
  - `/api/gate/lock`
  - `/api/gate/unlock`
- MQTT pe topicurile:
  - `LICENTA/ACCES/GARAJ`
  - `LICENTA/ACCES/POARTA`
  - `LICENTA/ACCES/STATUS`, publicat retained

### 12.1. Ce trebuie instalat

- `ESP-IDF 5.4` sau mai nou
- toolchain-ul aferent instalat prin `ESP-IDF Tools Installer` sau setup-ul oficial Espressif

### 12.2. Configurare pentru P4

Din folderul proiectului:

```bash
cd esp32-p4-ov5640-video-server
idf.py set-target esp32p4
idf.py menuconfig
```

In `menuconfig`, verifica:

1. `Example Connection Configuration`
2. `Access Control Configuration`
3. `Example Video Initialization Configuration`
4. `Espressif Camera Sensors Configurations`

Valorile implicite deja pregatite in proiect sunt:

```ini
Wi-Fi SSID=Licenta-RPi-AP
Wi-Fi Password=licenta-rpi
MQTT Host=192.168.4.1
MQTT Port=1883
MQTT Username=licenta
MQTT Password=licenta
MQTT Client ID=licenta-acces-esp32p4
Garage Travel Steps=2400
Garage Step Interval Us=2500
Servo Locked Deg=20
Servo Unlocked Deg=95
```

### 12.3. Build si flash pentru P4

```bash
idf.py build
idf.py -p PORT flash monitor
```

In serial monitor ar trebui sa vezi:

- conectarea la Wi-Fi
- conectarea la MQTT
- pornirea serverului pe portul `80`
- pornirea stream-ului pe portul `81`

### 12.4. Acces din browser pentru P4

- `http://IP/` pentru interfata video
- `http://IP/acces` pentru pagina simpla cu stream si butoane
- `http://IP/api/access_status` pentru status JSON

## 13. Verificare si upload

1. Apasa `Verify`.
2. Daca build-ul trece, apasa `Upload`.
3. Dupa upload, deschide `Serial Monitor` la `115200 baud`.

La pornire vei vedea:

- profilul de placa
- montarea cardului
- conectarea la Wi-Fi
- conectarea la MQTT
- initializarea camerei, doar pe `ESP32-S3`

## 14. Daca upload-ul nu porneste

### ESP32-S3

1. tine apasat `BOOT`
2. apasa scurt `RST` sau `EN`
3. elibereaza `RST`
4. dupa 1-2 secunde elibereaza `BOOT`
5. reporneste `Upload`

### ESP32-P4

De regula, upload-ul merge direct dupa selectarea `ESP32P4 Dev Module`. Daca nu porneste:

1. verifica portul COM
2. deconecteaza si reconecteaza USB-C
3. apasa `RST`
4. reporneste `Upload`

## 15. Testare dupa pornire

Testeaza in browser:

- `http://IP_PLACA/`
- `http://IP_PLACA/upload.html`
- `http://IP_PLACA/status`

Pe `ESP32-S3`, testeaza si:

- `http://IP_PLACA/camera.jpg`

Pe `ESP32-P4` cu aplicatia `ESP-IDF`, testeaza si:

- `http://IP_PLACA/acces`
- `http://IP_PLACA/api/access_status`
- `http://IP_PLACA:81/stream`

Teste MQTT:

```bash
mosquitto_pub -h 192.168.4.1 -u licenta -P licenta -t LICENTA/ACCES/GARAJ -m deschide
mosquitto_pub -h 192.168.4.1 -u licenta -P licenta -t LICENTA/ACCES/GARAJ -m stop
mosquitto_pub -h 192.168.4.1 -u licenta -P licenta -t LICENTA/ACCES/GARAJ -m inchide
mosquitto_pub -h 192.168.4.1 -u licenta -P licenta -t LICENTA/ACCES/POARTA -m deblocheaza
mosquitto_pub -h 192.168.4.1 -u licenta -P licenta -t LICENTA/ACCES/POARTA -m blocheaza
mosquitto_sub -h 192.168.4.1 -u licenta -P licenta -t LICENTA/ACCES/STATUS -v
```

Topicul `LICENTA/ACCES/STATUS` este publicat retained la conectarea MQTT, dupa comenzi pentru garaj/poarta si cand miscarea garajului se termina. Campurile JSON sunt:

```json
{
  "board": "...",
  "ip": "192.168.4.3",
  "mqtt": true,
  "camera": true,
  "garageMoving": false,
  "garagePositionSteps": 0,
  "garageTargetSteps": 0,
  "gateLocked": true
}
```

## 16. Update firmware de pe card

1. Incarca fisierul compilat ca `/firmware.bin` prin `/upload.html`.
2. Apasa butonul de restart/update din pagina.
3. La urmatorul boot, placa aplica update-ul si reporneste.

## 17. Troubleshooting

- Daca stepper-ul vibreaza si nu se roteste, verifica perechile de bobine.
- Daca merge invers, foloseste `TMC_INVERT_DIRECTION=true`.
- Daca servo-ul face reset la placa, imbunatateste alimentarea de `5V`.
- Daca vrei camera si control in acelasi firmware pe `ESP32-P4`, foloseste `esp32-p4-ov5640-video-server`.
- Daca Wi-Fi sau MQTT nu merg pe FireBeetle 2 ESP32-P4 dintr-un lot vechi, verifica nota DFRobot despre unele placi fabricate la `31 octombrie 2025`, unde poate fi necesar reflash pentru firmware-ul `ESP32-C6`.
