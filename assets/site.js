(function () {
  const doorbellTopic = localStorage.getItem("licenta-doorbell-topic") || "LICENTA/SONERIE/COMANDA";
  const brokerUrl = localStorage.getItem("licenta-doorbell-broker-url") || "ws://192.168.4.1:9001/mqtt";
  const mqttUsername = localStorage.getItem("licenta-doorbell-username") || "licenta";
  const mqttPassword = localStorage.getItem("licenta-doorbell-password") || "licenta";

  function encodeRemainingLength(length) {
    const bytes = [];
    do {
      let encodedByte = length % 128;
      length = Math.floor(length / 128);
      if (length > 0) {
        encodedByte |= 128;
      }
      bytes.push(encodedByte);
    } while (length > 0);
    return bytes;
  }

  function encodeString(value) {
    const encoded = new TextEncoder().encode(value);
    return [encoded.length >> 8, encoded.length & 0xff, ...encoded];
  }

  function packet(type, payload) {
    return new Uint8Array([type, ...encodeRemainingLength(payload.length), ...payload]);
  }

  function connectPacket(clientId) {
    let flags = 0x02;
    const payload = [...encodeString(clientId)];

    if (mqttUsername) {
      flags |= 0x80;
      payload.push(...encodeString(mqttUsername));
    }

    if (mqttPassword) {
      flags |= 0x40;
      payload.push(...encodeString(mqttPassword));
    }

    const variableHeader = [
      ...encodeString("MQTT"),
      0x04,
      flags,
      0x00,
      0x3c,
    ];

    return packet(0x10, [...variableHeader, ...payload]);
  }

  function publishPacket(topic, message) {
    const payload = [
      ...encodeString(topic),
      ...new TextEncoder().encode(message),
    ];
    return packet(0x30, payload);
  }

  function publishDoorbell() {
    return new Promise((resolve, reject) => {
      const clientId = `licenta-pages-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const message = JSON.stringify({
        event: "pressed",
        source: "Licenta-Pages",
        timestamp: new Date().toISOString(),
      });
      const socket = new WebSocket(brokerUrl, "mqtt");
      let settled = false;

      function finish(error) {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeout);
        try {
          socket.close();
        } catch (closeError) {
          // Browserul poate inchide deja conexiunea dupa publish.
        }
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }

      const timeout = window.setTimeout(() => {
        finish(new Error("Conexiunea MQTT WebSocket nu a raspuns la timp."));
      }, 7000);

      socket.binaryType = "arraybuffer";

      socket.addEventListener("open", () => {
        socket.send(connectPacket(clientId));
      });

      socket.addEventListener("message", (event) => {
        const data = new Uint8Array(event.data);
        if ((data[0] & 0xf0) !== 0x20) {
          return;
        }

        if (data[3] !== 0) {
          finish(new Error(`Brokerul MQTT a refuzat conexiunea: cod ${data[3]}.`));
          return;
        }

        socket.send(publishPacket(doorbellTopic, message));
        socket.send(new Uint8Array([0xe0, 0x00]));
        finish();
      });

      socket.addEventListener("error", () => {
        finish(new Error("Nu se poate trimite soneria catre brokerul MQTT."));
      });
    });
  }

  function bellIcon() {
    return [
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      '<path d="M13.73 21a2 2 0 0 1-3.46 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
    ].join("");
  }

  function setButtonState(button, state, title) {
    button.classList.remove("is-sending", "is-ok", "is-error");
    if (state) {
      button.classList.add(state);
    }
    button.title = title;
    button.setAttribute("aria-label", title);
  }

  function installDoorbellButton() {
    const homeLink = document.querySelector(".site-home-link");
    if (!homeLink || document.querySelector(".site-doorbell-button")) {
      return;
    }

    const bar = document.createElement("div");
    bar.className = "site-top-bar";
    homeLink.parentNode.insertBefore(bar, homeLink);
    bar.appendChild(homeLink);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "site-doorbell-button";
    button.innerHTML = bellIcon();
    setButtonState(button, "", "Trimite soneria");
    bar.appendChild(button);

    button.addEventListener("click", async () => {
      button.disabled = true;
      setButtonState(button, "is-sending", "Se trimite soneria");
      try {
        await publishDoorbell();
        setButtonState(button, "is-ok", "Soneria a fost trimisa");
      } catch (error) {
        setButtonState(button, "is-error", error.message);
      } finally {
        window.setTimeout(() => {
          button.disabled = false;
          setButtonState(button, "", "Trimite soneria");
        }, 2200);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installDoorbellButton);
  } else {
    installDoorbellButton();
  }
})();
