# IoT 101

## From sensors to systems

- Course kickoff
- What IoT is (and is not)
- How we will build and ship ideas

---

## What is IoT?

- Physical devices with sensors or actuators
- Connectivity for sending and receiving data
- Software that turns data into decisions

Note: Emphasize that IoT is a system, not a gadget.

---

## Real world examples

- Smart agriculture (soil moisture, irrigation)
- Building automation (HVAC, occupancy)
- Logistics tracking (temperature, location)
- Health monitoring (wearables)

---

## The IoT stack

- Device: sensors, actuators, microcontrollers
- Edge: local logic, buffering, quick decisions
- Network: WiFi, BLE, cellular, LoRa
- Cloud: storage, analytics, orchestration
- App: dashboards, alerts, integrations

----

### Device layer questions

- What are we measuring?
- How often do we sample?
- How is it powered?

----

### Network layer questions

- What range and bandwidth do we need?
- What is the cost per message?
- How do we secure the link?

---

## MQTT in one slide

```
Client -> Broker -> Subscriber
```

- Publish to topics
- Subscribers receive updates
- Lightweight for constrained devices

---

## First lab preview

- Read a sensor
- Send a value to a dashboard
- Trigger a simple alert

---

## Security mindset

- Least privilege
- Rotate credentials
- Assume devices will be lost

---

## Wrap up

- IoT is a system of systems
- Your job: make tradeoffs visible
- Next time: hardware basics and circuits
