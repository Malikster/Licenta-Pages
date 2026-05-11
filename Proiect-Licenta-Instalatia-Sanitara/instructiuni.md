# Instructiuni Firmware - Instalatia Sanitara

Resurse asociate:

- `../index.html` - prezentare generala a proiectului
- `instructiuni.html` - versiune HTML a acestui ghid
- `mqtt.html` - schema logica pentru MQTT si modurile AUTO/MANUAL
- `hardware.html` - schema hardware, pini si alimentari
- `schema-instalatie.html` - schema vizuala a instalatiei

## Scopul proiectului

Acest firmware controleaza o instalatie sanitara experimentala bazata pe ESP32 cu doua rezervoare:

- `R1` si `R2`;
- doi senzori de nivel ultrasonici `JSN-SR04T`, cate unul pentru fiecare rezervor;
- doi plutitori, cate unul pentru fiecare rezervor;
- un debitmetru pe linia `R1 -> R2`;
- o valva electromagnetica normal inchisa;
- o pompa bidirectionala intre cele doua rezervoare;
- un ecran OLED integrat pentru afisarea starii locale;
- comunicatie MQTT pentru comenzi si status.

Topologia hidraulica urmarita de firmware:

- Linia 1: `R1 -> debitmetru -> valva -> R2`
- Linia 2: `R1 <-> pompa <-> R2`

Firmware-ul citeste nivelurile, afiseaza local starea si executa logica `AUTO` sau comenzile primite in `MANUAL`.

## Componente hardware necesare

- ESP32 Development Board cu OLED 0.96 inch integrat
- 2 x senzor ultrasonic waterproof `JSN-SR04T`
- 2 x plutitor pentru detectie nivel
- 1 x senzor debitmetru lichid
- 1 x valva electromagnetica 12V NC
- 1 x pompa dozatoare/peristaltica bidirectionala
- driver pentru valva
- driver pentru pompa cu inversare sens
- surse de alimentare adecvate pentru ESP32, valva si pompa
- rezistente pentru divizorul de tensiune pe `ECHO` la JSN-SR04T, daca senzorul este alimentat la 5V

## Cablare pe baza `pins.h`

Maparea curenta a pinilor este:

- `OLED_SDA = 4`
- `OLED_SCL = 15`
- `OLED_RST = 16`
- `FLOW_SENSOR = 27`
- `R1_TRIG = 18`
- `R1_ECHO = 19`
- `R2_TRIG = 21`
- `R2_ECHO = 22`
- `R1_FLOAT = 32`
- `R2_FLOAT = 33`
- `VALVE_CTRL = 25`
- `PUMP_DIR_A = 26`
- `PUMP_DIR_B = 14`

### Legare recomandata

#### OLED

Pe unele placi ESP32 cu OLED integrat, ecranul este deja legat intern. Daca ecranul nu porneste, verifica mai intai pinii `OLED_SDA`, `OLED_SCL` si `OLED_RST`.

#### JSN-SR04T

Pentru fiecare senzor:

- `VCC` -> 5V sau tensiunea recomandata de modul
- `GND` -> GND
- `TRIG` -> pinul GPIO definit in `pins.h`
- `ECHO` -> pinul GPIO definit in `pins.h`, prin divizor rezistiv sau level shifter catre 3.3V pentru ESP32

Exemplu divizor pentru `ECHO`:

- 1k intre `ECHO` si pinul ESP32
- 2k intre pinul ESP32 si `GND`

#### Plutitori

- fiecare plutitor la pinul dedicat din `pins.h`
- intrarea este configurata `INPUT_PULLUP`, deci montajul trebuie compatibil cu citire activa la `LOW`

#### Debitmetru

- semnalul debitmetrului la `FLOW_SENSOR`
- masa comuna intre senzor si ESP32

#### Valva

- `VALVE_CTRL` merge in driverul valvei, nu direct in valva de 12V

#### Pompa

- `PUMP_DIR_A` si `PUMP_DIR_B` merg in driverul pompei
- driverul trebuie sa permita:
  - `POMPA-A` = `R1 -> R2`
  - `POMPA-B` = `R2 -> R1`
  - `POMPA-0` = stop

## Configurare `config.h`

Fisierul `config.h` contine:

- setarile WiFi;
- setarile MQTT;
- timpii de refresh;
- calibrarea debitmetrului;
- filtrarea pentru JSN-SR04T;
- pragurile de nivel pentru modul `AUTO`.

Valorile de retea recomandate sunt:

- WiFi SSID: `Licenta-RPi-AP`
- WiFi password: `licenta-rpi`
- MQTT host: `192.168.4.1`
- MQTT port: `1883`
- client ID: `licenta-sanitar-esp32`

Exemplu de configurare recomandata:

```cpp
constexpr char WIFI_SSID[] = "Licenta-RPi-AP";
constexpr char WIFI_PASSWORD[] = "licenta-rpi";
constexpr char MQTT_HOST[] = "192.168.4.1";
constexpr uint16_t MQTT_PORT = 1883;
constexpr char MQTT_CLIENT_ID[] = "licenta-sanitar-esp32";
```

Mai trebuie verificate si ajustate:

- `FLOW_PULSES_PER_LITER`
- `R1_DISTANCE_EMPTY_CM`
- `R1_DISTANCE_FULL_CM`
- `R2_DISTANCE_EMPTY_CM`
- `R2_DISTANCE_FULL_CM`
- `R1_LEVEL_MIN_PERCENT`
- `R1_LEVEL_MAX_PERCENT`
- `R2_LEVEL_MIN_PERCENT`
- `R2_LEVEL_MAX_PERCENT`

## Biblioteci Arduino necesare

Instaleaza in Arduino IDE:

- `PubSubClient`
- `Adafruit GFX Library`
- `Adafruit SSD1306`

Este necesar si suportul de placi pentru ESP32 in Arduino IDE.

## Compilare si upload in Arduino IDE

1. Deschide Arduino IDE.
2. Deschide fisierul `Proiect-Licenta-Instalatia-Sanitara.ino` sau folderul proiectului.
3. Instaleaza bibliotecile:
   - `PubSubClient`
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`
4. Selecteaza board-ul `ESP32 Dev Module` sau modelul exact al placii tale.
5. Selecteaza portul serial corect.
6. Actualizeaza `config.h` cu valorile reale de retea, daca este nevoie.
7. Apasa `Verify` pentru compilare.
8. Apasa `Upload` pentru incarcare pe placa.
9. Deschide `Serial Monitor` la `115200` baud pentru diagnostic.

## Topicuri MQTT

- topic comenzi: `LICENTA/SANITAR/COMANDA`
- topic status: `LICENTA/SANITAR/STATUS`

## Mesaje acceptate

Firmware-ul accepta urmatoarele comenzi pe `LICENTA/SANITAR/COMANDA`:

- `AUTO-1` - trece in modul `AUTO`
- `AUTO-0` - trece in modul `MANUAL`
- `POMPA-A` - porneste pompa in directia `R1 -> R2`
- `POMPA-B` - porneste pompa in directia `R2 -> R1`
- `POMPA-0` - opreste pompa
- `VALVA-1` - deschide valva
- `VALVA-0` - inchide valva

## Mesaje publicate

Firmware-ul publica pe `LICENTA/SANITAR/STATUS`:

- status scurt `ABC`
  - `A` = `0` manual, `1` auto
  - `B` = `0` valva inchisa, `1` valva deschisa
  - `C` = `0` pompa stop, `1` `R1 -> R2`, `2` `R2 -> R1`
- `NIVEL-1-XYZ`
- `NIVEL-2-XYZ`
- `DEBIT-XYZ`

Pentru debit:

- `XYZ` este debitul real in `L/min`
- valoarea este rotunjita
- formatul este pe 3 cifre, de exemplu:
  - `DEBIT-000`
  - `DEBIT-001`
  - `DEBIT-125`

Statusul este publicat periodic si imediat dupa schimbari relevante de pompa sau valva.

Cand simularea din CPU Principal este oprita, aceste valori reale raman sursa pentru afisajele Android/ecran.

## Modul AUTO si MANUAL

### AUTO

In modul `AUTO`:

- daca nivelul in `R1` depaseste pragul maxim, valva se deschide;
- daca nivelul in `R1` scade sub pragul minim, valva se inchide;
- daca nivelul in `R2` depaseste pragul maxim, pompa merge `R2 -> R1`;
- daca nivelul in `R2` scade sub pragul minim, pompa se opreste.

### MANUAL

In modul `MANUAL`:

- actiunile nu mai sunt luate automat din nivel;
- comenzile de valva si pompa sunt executate din MQTT;
- la trecerea in `MANUAL`, valva este inchisa si pompa este oprita imediat.

## Troubleshooting

### MQTT

Probleme posibile:

- placa nu se conecteaza la WiFi;
- brokerul MQTT nu raspunde;
- nu apar mesaje pe `LICENTA/SANITAR/STATUS`.

Verificari:

- SSID si parola sa fie corecte in `config.h`;
- brokerul sa fie accesibil la `192.168.4.1:1883`;
- topicurile sa fie scrise exact;
- monitorizarea seriala sa fie pornita la `115200`.

### JSN-SR04T

Probleme posibile:

- nivelul sare;
- citirile sunt `0` sau complet gresite;
- valorile nu se schimba aproape de nivel maxim.

Verificari:

- `ECHO` sa fie protejat catre 3.3V;
- senzorul sa fie montat vertical;
- nivelul maxim sa nu intre in zona moarta a senzorului;
- sa fie ajustate valorile:
  - `JSN_MIN_VALID_CM`
  - `JSN_MAX_VALID_CM`
  - `R1_DISTANCE_EMPTY_CM`
  - `R1_DISTANCE_FULL_CM`
  - `R2_DISTANCE_EMPTY_CM`
  - `R2_DISTANCE_FULL_CM`

### OLED

Probleme posibile:

- ecranul ramane negru;
- textul nu apare.

Verificari:

- biblioteca `Adafruit SSD1306` sa fie instalata;
- pinii `OLED_SDA`, `OLED_SCL`, `OLED_RST` sa fie corecti pentru placa;
- adresa I2C implicita sa fie compatibila cu ecranul folosit.

### Pompa

Probleme posibile:

- pompa merge doar intr-un sens;
- pompa nu se opreste;
- directiile `A` si `B` sunt inversate fizic.

Verificari:

- driverul pompei sa suporte inversarea sensului;
- `PUMP_DIR_A` si `PUMP_DIR_B` sa fie corect legati;
- daca sensurile sunt inversate pe instalatia reala, corecteaza cablarea sau logica driverului;
- conventia care trebuie pastrata este:
  - `POMPA-A` = `R1 -> R2`
  - `POMPA-B` = `R2 -> R1`

### Debitmetru

Probleme posibile:

- valoarea `DEBIT-XYZ` ramane `000`;
- debitul afisat nu corespunde realitatii.

Verificari:

- semnalul sa ajunga corect la `FLOW_SENSOR`;
- masa comuna sa fie comuna cu ESP32;
- `FLOW_PULSES_PER_LITER` sa fie calibrat pentru senzorul real.
