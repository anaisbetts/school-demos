# Speaker Notes: Programming Live Demo (15 minutes)

**Audience:** Age 13, German native speakers (advanced English class — keep spoken English clear and B1-friendly).

**Setup before you start:**
- Run `bun run dev` and open the browser on the right half of the screen.
- Open `src/main.ts` in your editor on the left half of the screen, scrolled to line 1, with big font size so the back row can read it.
- Everything runs 100% offline.

**Controls in the browser:**
- **Drag** = rotate camera
- **Scroll** = zoom in / out
- **Click any planet** = fly up close and follow it
- **Click empty space** = stop following
- **Space** = pause / resume
- **R** = reset camera to the full Solar System

**The one idea to land:** Programming is writing simple instructions and numbers that a computer turns into a living world — and you can experiment and change it in one second.

---

## 1. Hook: Show the 3D Solar System (0:00 – 2:00)

Start with the browser big (or side-by-side). Drag the camera around, zoom near Saturn's rings, click Earth to follow it, then press `R` to pull back out.

- "Today I want to show you what programming actually feels like."
- "This is a 3D Solar System running live in a web browser. No video, no pre-made animation — the computer is drawing every single frame right now, 60 times every second."
- "How does the computer know where to put the planets, how big they are, or what color they should be? Because a human wrote a list of rules and numbers. That list is called **code**."

---

## 2. First Live Edits: Control Time & the Sun (2:00 – 6:00)

Point to the top of `src/main.ts` (`SOLAR SYSTEM SETTINGS`). Read the variable names aloud slowly so the English words click.

- **Speed up time:** Change `TIME_SPEED = 1` to `5` and save.
  - "When I press Save, the app updates right away — we call this **hot reload**."
- **Freeze time:** Change `TIME_SPEED = 0` and save.
- **Reverse time:** Ask the class: "What do you think happens if I put a minus sign in front? Let's try `-3`." Save!
  - Set `TIME_SPEED = 1` again (or `1.5` for a lively feel).
- **Change the Sun:** Change `SUN_COLOR = '#ffb347'` to `'cyan'` or `'hotpink'`, and change `SUN_SIZE = 4.5` to `9` (watch it almost swallow Mercury!). Then change it back (or keep a cool color if the class loves it).
- **Scale every planet at once:** Change `PLANET_SCALE = 1` to `2.5` so all the planets look huge, then back to `1`.

---

## 3. Customize Individual Planets (6:00 – 10:00)

Point to the `PLANETS` list. Explain that each line is one planet with its own settings: `name`, `color`, `size`, `distance`, `speed`, `moons`, `rings`.

- **Click Earth** in the browser so the camera flies up close and rides along with it.
- **Give Earth rings:** On the `Earth` line, change `rings: false` to `rings: true` and save.
  - "In code, `true` means yes and `false` means no."
- **Add a moon swarm:** Change Earth's `moons: 1` to `moons: 15` and save.
- **Change a planet's color & size:** Pick Mars (or ask a student to pick a planet and a color name in English — e.g. `'lime'`, `'purple'`, `'hotpink'`). Change `color` and `size` and save.
- **Visual toggles:** Press `R` to zoom back out.
  - Toggle `SHOW_TRAILS = false` / `true` and `SHOW_ORBITS = false` / `true`.
  - Change `ASTEROID_COUNT = 600` to `3000` to make a massive asteroid belt between Mars and Jupiter!

---

## 4. Class Challenge: Invent Planet #9 (10:00 – 13:00)

Ask the class to design a brand-new planet together (great B1 English practice — call on 4–5 students for one property each):

1. "What should we name our new planet?" (e.g. `'Pizza'`, `'Robloxia'`, the teacher's name, etc.)
2. "What color?" (any English color word: `'magenta'`, `'gold'`, `'lime'`, `'crimson'`)
3. "How big? Small like Mercury (`0.5`), or giant like Jupiter (`3`)?"
4. "Close to the Sun (`12`) or far away (`75`)? Fast (`3`) or slow (`0.2`)?"
5. "How many moons? Rings: `true` or `false`?"

Duplicate the last line of `PLANETS`, type in their answers, and hit Save! Click their new planet in the 3D scene to fly right up to it.

---

## 5. Peek Under the Hood & Wrap Up (13:00 – 15:00)

Scroll down slowly through the rest of `src/main.ts` (just 10–15 seconds, no need to explain every line).

- "Everything you saw today is in this one file. At the top are the simple settings we changed; down here is the code that tells the computer how to build spheres, draw textures, move planets in circles, and point the camera."
- **Takeaway:** "You do not have to know everything to start programming. Most programmers start by taking something that works, changing one number, seeing what happens, and having fun."
- Open the floor for 1–2 quick questions!

---

## Emergency Tips on Stage
- **Made a typo and got an error screen?** Press `Ctrl+Z` / `Cmd+Z` and Save — Vite recovers immediately.
- **Lost the camera in deep space?** Click the browser and press `R`.
- **Want to reset all edits before the next class?** Run `git checkout src/main.ts`.
