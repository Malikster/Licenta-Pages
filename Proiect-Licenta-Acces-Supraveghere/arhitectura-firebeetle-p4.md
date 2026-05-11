[Sistem automatizare instalatii electrice tip Smart-House folosind Arduino](../index.html)

# Arhitectura FireBeetle 2 ESP32-P4

Acest document descrie varianta recomandata pentru kitul:

- `FireBeetle 2 ESP32-P4 Development Board + IO Expansion Board`
- camera `OV5640` pe `MIPI-CSI`
- card `microSD / TF`
- driver stepper `TMC2209`
- motor `Bondtech NEMA17 Pancake Stepper 22mm`
- micro servo `9g`

## Decizie principala

Pentru acest kit folosim o singura aplicatie `ESP-IDF`, aflata in:

- `esp32-p4-ov5640-video-server`

Aceasta aplicatie include:

- streaming camera `OV5640`
- Wi-Fi prin modulul intern `ESP32-C6`
- MQTT catre Raspberry Pi
- control garaj cu `TMC2209`
- control poarta cu servo
- pagina web locala la `/acces`
- card TF montat la `/sdcard`, cu posibilitatea de a servi `acces-p4.html` fara recompilare

Sketch-ul Arduino principal ramane util pentru varianta `ESP32-S3` si pentru teste rapide de actuatori pe `ESP32-P4`, dar nu este varianta finala pentru camera MIPI.

## Pini recomandati

Actuatori:

| Functie | Pin ESP32-P4 | Pin pe expansion |
| --- | --- | --- |
| TMC2209 `STEP` | `GPIO20` | `A0` |
| TMC2209 `DIR` | `GPIO21` | `A1` |
| TMC2209 `EN/ENN` | `GPIO22` | `A2` |
| Servo semnal | `GPIO23` | `A3` |

TF card:

| Functie | Pin ESP32-P4 |
| --- | --- |
| `D0` | `GPIO39` |
| `D1` | `GPIO40` |
| `D2` | `GPIO41` |
| `D3` | `GPIO42` |
| `CLK` | `GPIO43` |
| `CMD` | `GPIO44` |
| `EN` | `GPIO45` |

Pini evitati:

- `GPIO7/GPIO8`: `SDA/SCL`, folositi si pentru camera/SCCB
- `GPIO14-19`, `GPIO54`, `GPIO6`: conexiunea interna cu modulul Wi-Fi/Bluetooth `ESP32-C6`
- `GPIO39-45`: TF card
- `GPIO35`: `BOOT`
- `GPIO3`: LED onboard
- `GPIO9/GPIO12`: microfon PDM

## Alimentare

Alimentarea recomandata:

```text
Sursa 12V
  +--> VMOT TMC2209
  +--> intrare buck 9-35V -> 5V

Buck 5V
  +--> 5V FireBeetle 2 ESP32-P4
  +--> 5V servo

GND comun:
  sursa 12V
  buck
  ESP32-P4
  TMC2209
  servo
```

Stepper-ul nu se alimenteaza din `5V`. TMC2209 primeste `VMOT` din sursa motorului, iar curentul se limiteaza din driver.

Pentru motorul `Bondtech NEMA17 Pancake Stepper 22mm`, porneste conservator cu aproximativ `0.6A - 0.8A RMS`, radiator pe driver si verificare de temperatura.

## Software

Aplicatia `ESP-IDF` foloseste:

- `esp_video` pentru camera si stream
- `esp_cam_sensor` pentru `OV5640`
- `esp_wifi_remote` / `esp_hosted` pentru Wi-Fi prin `ESP32-C6`
- `esp-mqtt` pentru comenzile de acces
- `esp_http_server` pentru interfata web
- `fatfs` + `sdmmc` pentru cardul TF onboard
- `ledc` pentru servo
- `gpio` + `esp_timer` pentru semnalul `STEP/DIR`

Topicuri MQTT:

```text
LICENTA/ACCES/GARAJ   payload: deschide | stop | inchide
LICENTA/ACCES/POARTA  payload: blocheaza | deblocheaza
LICENTA/ACCES/STATUS  status JSON retained
```

`LICENTA/ACCES/STATUS` este publicat la conectarea MQTT, dupa comenzi pentru garaj/poarta si cand miscarea garajului se termina. Campurile sunt `board`, `ip`, `mqtt`, `camera`, `garageMoving`, `garagePositionSteps`, `garageTargetSteps`, `gateLocked`.

Endpoint-uri locale:

```text
http://IP/
http://IP/acces
http://IP:81/stream
http://IP/api/access_status
http://IP/api/garage/open
http://IP/api/garage/stop
http://IP/api/garage/close
http://IP/api/gate/lock
http://IP/api/gate/unlock
```

Pagina `/acces` foloseste fisierul `/sdcard/acces-p4.html` daca exista pe card. Daca fisierul lipseste sau cardul nu este disponibil, firmware-ul foloseste pagina HTML inclusa in binar.

## Etape urmatoare recomandate

1. Test fara mecanica: verifici Wi-Fi, MQTT, stream camera si miscarea servo.
2. Test cu TMC2209 fara sarcina: verifici directia si pulsul stepper.
3. Test cu mecanica: calibrezi `GARAGE_TRAVEL_STEPS`.
4. Adaugi limit switch-uri pentru capetele de cursa ale garajului.
5. Copiezi `esp32-p4-ov5640-video-server/sdcard/acces-p4.html` pe TF card daca vrei sa modifici pagina fara recompilare.
6. Folosesti TF card pentru configuratie persistenta, capturi sau loguri.
