[Sistem automatizare instalatii electrice tip Smart-House folosind Arduino](../index.html)

# Instructiuni de folosire - Aplicatia Android Control Casa

## Cuprins

- [Scopul aplicatiei](#scopul-aplicatiei)
- [Cerinte](#cerinte)
- [Build debug](#build-debug)
- [Instalare APK pe telefon](#instalare-apk-pe-telefon)
- [Configurare initiala](#configurare-initiala)
- [Topicuri MQTT folosite](#topicuri-mqtt-folosite)
- [Pagini si utilizare](#pagini-si-utilizare)
- [Troubleshooting](#troubleshooting)

## Scopul aplicatiei

Aplicatia Android este interfata mobila pentru controlul si monitorizarea subsistemelor proiectului de licenta:

- Acces: garaj, poarta si camera de supraveghere.
- Iluminat: controlul celor 8 circuite/relee.
- Instalatia Sanitara: niveluri, valva, pompa, debit si mod AUTO/MANUAL.

Aplicatia comunica in principal prin MQTT cu brokerul local de pe Raspberry Pi si foloseste HTTP pentru imaginea camerei si fallback-ul de status al subsistemului Acces.

## Cerinte

Pentru dezvoltare si rulare sunt necesare:

- Android Studio instalat.
- JDK compatibil cu proiectul Android.
- Android SDK Platform 34 sau compatibil cu proiectul.
- Telefon Android sau emulator.
- Telefonul conectat la reteaua locala a Raspberry Pi, de obicei `Licenta-RPi-AP`.
- Broker MQTT disponibil in reteaua locala.

## Build debug

Din radacina proiectului `Proiect-Licenta-Aplicatie-Telefon`, ruleaza:

```powershell
.\gradlew.bat assembleDebug
```

APK-ul debug se genereaza in:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## Instalare APK pe telefon

### Varianta prin Android Studio

1. Conecteaza telefonul prin USB.
2. Activeaza Developer options si USB debugging pe telefon.
3. Deschide proiectul in Android Studio.
4. Alege dispozitivul din bara de rulare.
5. Ruleaza configuratia `app`.

### Varianta prin ADB

1. Conecteaza telefonul prin USB.
2. Ruleaza build-ul debug:

```powershell
.\gradlew.bat assembleDebug
```

3. Instaleaza APK-ul:

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

### Varianta prin copiere APK

1. Copiaza APK-ul pe telefon.
2. Deschide APK-ul din managerul de fisiere.
3. Permite instalarea din surse necunoscute daca Android solicita acest lucru.

## Configurare initiala

La prima pornire, deschide aplicatia si intra in setari folosind butonul cu roata dintata din bara de sus.

Valori implicite recomandate:

| Setare | Valoare recomandata |
| --- | --- |
| Host MQTT | `tcp://192.168.4.1:1883` |
| User MQTT | `licenta` |
| Parola MQTT | `licenta` |
| URL Acces-Supraveghere | `http://192.168.4.3` |
| Refresh camera | `2000` ms sau valoarea dorita |

Setarea `Debug` este optionala. Cand este activata, aplicatia afiseaza informatii MQTT suplimentare si permite testarea comenzilor de pe pagina Acces fara autentificare biometrica.

## Topicuri MQTT folosite

Aplicatia foloseste urmatoarele topicuri:

| Topic | Directie | Rol |
| --- | --- | --- |
| `LICENTA/ACCES/GARAJ` | publish | Comenzi garaj: `inchide`, `stop`, `deschide` |
| `LICENTA/ACCES/POARTA` | publish | Comenzi poarta: `blocheaza`, `deblocheaza` |
| `LICENTA/ACCES/STATUS` | subscribe | Status Acces in format JSON |
| `LICENTA/ILUMINAT/COMANDA` | publish | Comenzi relee iluminat |
| `LICENTA/ILUMINAT/STATUS` | subscribe | Status 8 biti pentru circuitele de iluminat |
| `LICENTA/SANITAR/COMANDA` | publish | Comenzi AUTO/MANUAL, valva si pompa |
| `LICENTA/SANITAR/STATUS` | subscribe | Status sanitar scurt, niveluri si debit |
| `LICENTA/SONERIE/COMANDA` | subscribe | Eveniment sonerie; afiseaza notificare Android cu sunet |

### Format `LICENTA/ACCES/STATUS`

Payload-ul este JSON compatibil cu endpoint-urile `/status` si `/api/access_status`.

Campuri acceptate:

- `garageMoving`
- `garageState`
- `garagePositionSteps`
- `garageTargetSteps`
- `gateLocked`
- `camera`
- `mqtt`
- `lastGarageCommand`, optional
- `lastGateCommand`, optional
- `source`, optional

Exemplu:

```json
{
  "garageMoving": false,
  "garageState": "closed",
  "garagePositionSteps": 0,
  "garageTargetSteps": 0,
  "gateLocked": true,
  "camera": true,
  "mqtt": true,
  "lastGarageCommand": "inchide",
  "lastGateCommand": "blocheaza",
  "source": "CPUPrincipal"
}
```

### Format `LICENTA/ILUMINAT/STATUS`

Payload-ul este un sir de 8 biti:

```text
01010101
```

Fiecare bit reprezinta starea unui circuit, de la circuitul 1 la circuitul 8.

### Format `LICENTA/SANITAR/STATUS`

Aplicatia accepta:

- status scurt `ABC`, unde `A` este modul AUTO, `B` este valva si `C` este pompa;
- `NIVEL-1-XXX`;
- `NIVEL-2-XXX`;
- `DEBIT-XXX`.

Exemple:

```text
110
NIVEL-1-075
NIVEL-2-040
DEBIT-001
```

Debitul este afisat ca valoare in `L/min`, de exemplu `DEBIT-000` devine `0 L/min`, iar `DEBIT-001` devine `1 L/min`.

### Format `LICENTA/SONERIE/COMANDA`

Aplicatia afiseaza o notificare Android cand primeste un mesaj nou, neretained, pe topicul soneriei.

Exemplu:

```json
{"event":"pressed","source":"test","timestamp":"2026-05-11T00:00:00Z"}
```

Notificarea are titlul `Sonerie` si textul `Cineva a apasat soneria`.

## Pagini si utilizare

### Acces

Pagina Acces controleaza garajul, poarta si afiseaza camera.

Comenzi garaj:

- `Inchide`
- `Stop`
- `Deschide`

Comanda poarta:

- `Blocheaza` / `Deblocheaza`

In mod normal, comenzile de acces cer autentificare biometrica. Cand `Debug` este activat in setari, autentificarea este sarita pentru testare.

Statusul Acces este actualizat din `LICENTA/ACCES/STATUS` cand CPU Principal publica statusul JSON. Camera foloseste URL-ul de baza setat in aplicatie si endpoint-ul `/camera.jpg`.

### Iluminat

Pagina Iluminat contine 8 butoane, cate unul pentru fiecare circuit.

- Apasa un circuit pentru a trimite comanda MQTT.
- Starea butoanelor este actualizata din `LICENTA/ILUMINAT/STATUS`.
- Statusul recomandat pentru `LICENTA/ILUMINAT/STATUS` trebuie publicat retained de CPU Principal, ca telefonul sa poata recupera ultima stare dupa reconectare.

### Instalatia Sanitara

Pagina Instalatie sanitara afiseaza:

- Nivel 1.
- Nivel 2.
- Starea valvei.
- Starea pompei si debitul.
- Comutator AUTO/MANUAL.
- Control valva.
- Control pompa: `Pornire 1`, `Stop`, `Pornire 2`.

In modul AUTO, controalele manuale pentru valva si pompa pot fi dezactivate sau ignorate de firmware, in functie de logica subsistemului.

## Troubleshooting

### Lipsa conexiunii MQTT

Verifica:

1. Telefonul este conectat la reteaua `Licenta-RPi-AP`.
2. Host MQTT este `tcp://192.168.4.1:1883`.
3. User/parola MQTT sunt `licenta` / `licenta`.
4. Brokerul MQTT ruleaza pe Raspberry Pi.
5. Telefonul nu foloseste date mobile pentru traficul local in locul retelei Wi-Fi.
6. In setari, apasa butonul de reconectare MQTT din aplicatie.

Daca mesajele intarzie, verifica daca CPU Principal publica statusurile ca mesaje retained, mai ales `LICENTA/ILUMINAT/STATUS`.

### Camera inaccesibila

Verifica:

1. Telefonul este conectat la `Licenta-RPi-AP`.
2. URL Acces-Supraveghere este `http://192.168.4.3`.
3. Endpoint-ul camerei este disponibil in browser:

```text
http://192.168.4.3/camera.jpg
```

4. Subsistemul Acces-Supraveghere este pornit si conectat la reteaua Raspberry Pi.

### Telefon neconectat la `Licenta-RPi-AP`

Verifica:

1. Deschide setarile Wi-Fi ale telefonului.
2. Conecteaza-te la reteaua `Licenta-RPi-AP`.
3. Daca Android avertizeaza ca reteaua nu are internet, alege sa ramai conectat.
4. Dezactiveaza temporar datele mobile daca telefonul evita reteaua locala.
5. Revino in aplicatie si apasa reconectare MQTT.
