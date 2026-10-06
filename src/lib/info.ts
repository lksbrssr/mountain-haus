// Practical info for guests staying at The Haus.
// Edit these values — placeholders for now. PRs welcome.

export const wifi = {
  network: "TheHaus",
  password: "wendelstein", // TODO: set the real WiFi password
};

export const stayTimes = {
  checkIn: "from 15:00",
  checkOut: "by 11:00",
};

export type InfoItem = {
  title: string;
  emoji: string;
  body: string;
};

// The "Good to know" cards. Keep them short and practical.
export const houseInfo: InfoItem[] = [
  {
    title: "Laundry",
    emoji: "🧺",
    body:
      "Washer and dryer are in the cellar. Pods are in the basket on the shelf — one per load. 40 °C for most things. Please hang the drying rack back up when you're done.",
  },
  {
    title: "Heating",
    emoji: "🔥",
    body:
      "Underfloor heating runs on the thermostat in the hallway — 21 °C is comfortable. For the wood stove in the Studio, there's dry wood in the shed; crack the flue before you light it.",
  },
  {
    title: "Kitchen",
    emoji: "🍳",
    body:
      "Help yourself to anything in the pantry and the coffee. Dishwasher tabs are under the sink. Start the dishwasher before bed so it's ready in the morning.",
  },
  {
    title: "Rubbish & recycling",
    emoji: "♻️",
    body:
      "Restmüll (grey) and Bio (brown) bins are by the carport; glass and paper go in the bins at the end of the lane. Collection is early Tuesday — bins out Monday night.",
  },
  {
    title: "Parking",
    emoji: "🚗",
    body:
      "Park in the carport or on the gravel beside the house. Leave room for the neighbours to pass. In winter, clear your windscreen on the far side so you don't block the turn.",
  },
  {
    title: "Boots & gear",
    emoji: "🥾",
    body:
      "Ski and hiking boots go in the boot room by the side door, not inside. There's a boot dryer, poles, and a few pairs of snowshoes to borrow. Dry everything before you pack up.",
  },
  {
    title: "Before you leave",
    emoji: "🔑",
    body:
      "Strip the beds and leave the linens in the hamper, start a final dishwasher load, turn the heating down to 16 °C, and drop the keys in the lockbox by the door.",
  },
  {
    title: "If you need us",
    emoji: "📞",
    body:
      "Call or message anytime — the number is on the fridge. Nearest shop is the Edeka in the village (10 min walk); the doctor and pharmacy are on Schulstraße.",
  },
];
