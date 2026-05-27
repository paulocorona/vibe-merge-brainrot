# Brainrot Merge

## Full Game Design Document (GDD)

### Meta Horizon Worlds — Mobile First

### Version 1.0 Design Foundation

---

# 1. GAME OVERVIEW

## Elevator Pitch

Brainrot Merge is a fast-paced cozy-chaotic mobile merge game where players tap rapidly to spawn items, merge evolving chains, and discover absurd Brainrot meme creatures.

Players expand their grid, unlock new Brainrots in the INDEX, and generate passive income through permanent collection progression.

The gameplay focuses on:

- satisfying merges
- tactile interactions
- rapid discovery
- escalating board chaos
- collectible meme characters

---

# 2. TARGET AUDIENCE

## Primary Audience

Children and young adults familiar with:

- TikTok meme culture
- Brainrot meme characters
- hyper-casual mobile games
- collectible progression systems

## Player Motivations

Players are here for:

- discovery
- dopamine hits
- collecting
- visual satisfaction
- chaos management
- meme humor

NOT:

- deep strategy
- difficult puzzles
- competitive gameplay
- complex resource management

---

# 3. PLATFORM

## Platform

Meta Horizon Worlds

## Primary Device

Mobile (portrait only)

## Input

Touchscreen only:

- tapping
- dragging

---

# 4. CORE GAME FANTASY

> “Spam weird items together until absurd Brainrot creatures are born.”

The game should feel:

- cozy
- chaotic
- tactile
- rewarding
- playful
- collectible

---

# 5. DESIGN PILLARS

## 5.1 Fast Discovery

Players should constantly feel close to discovering something new.

New merges, new evolutions, and new Brainrots should happen frequently.

---

## 5.2 Controlled Chaos

The board should become messy and stressful, but never impossible or confusing.

Players should feel:

> “I can recover if I organize well.”

---

## 5.3 Tactile Satisfaction

Dragging, merging, tapping, and spawning must feel responsive and juicy.

Polish is critical.

---

## 5.4 Meme Anticipation

Players should chase recognizable Brainrot combinations.

The INDEX should tease discoveries and recipes clearly.

---

## 5.5 Permanent Collection

Unlocking Brainrots should feel meaningful forever.

INDEX completion is a primary long-term retention mechanic.

---

# 6. CORE GAMEPLAY LOOP

## Primary Loop

1. Tap spawn button
2. Progress bar fills
3. Item spawns into empty grid space
4. Merge identical pieces
5. Earn currency
6. Build toward Brainrot recipe
7. Unlock Brainrot
8. Gain passive income
9. Expand grid
10. Repeat

---

# 7. SESSION STRUCTURE

## Intended Session Length

10–20 minutes

## Session Goals

During a session players should:

- discover merges
- chase recipes
- manage chaos
- unlock Brainrots
- expand the board

---

# 8. GAME BOARD

## Starting Grid

4x4

## Maximum Grid

8x8

## Grid Behavior

- Pieces occupy one tile
- All pieces remain same size footprint
- Pieces can swap positions
- Pieces can move into empty spaces

---

# 9. SPAWNING SYSTEM

## Spawn Mechanics

Players tap a button to accelerate spawning.

A progress bar continuously fills:

- slowly automatically
- faster through tapping

When full:

- one item spawns
- bar resets

---

## Spawn Locations

Items spawn into:

- random empty spaces only

---

## Spawn Pool Rules

Initially:

- limited spawn pool

Additional starter pieces unlock gradually.

This improves:

- onboarding
- readability
- progression pacing

---

## Spawn Weighting (Hidden Assistance System)

The game secretly helps progression by:

- boosting recipe-related pieces
- reducing dead-end RNG
- improving odds during bad streaks

Players should FEEL lucky.

---

# 10. MERGING SYSTEM

## Merge Rule

Two identical pieces merge into:

- one higher-level piece

---

## Merge Input

- drag one piece onto another
- slight magnetic snapping
- forgiving but precise hitboxes

---

## Merge Feedback

Every merge should include:

- pop animation
- sound effect
- scale punch
- particle burst
- combo indicator

---

## Combo Merges

Quick consecutive merges grant:

- bonus currency
- combo feedback
- stronger juice effects

---

# 11. BOARD PRESSURE

## Failure State

If no space remains:

- players may continue organizing
- OR clear the board

---

## Clear Board Button

- free to use
- deletes all board items
- does NOT affect INDEX progress

The action should feel emotionally painful:

- vacuum animation
- sad sound
- dramatic wipe

---

# 12. BRAINROT DISCOVERY SYSTEM

## Final Fusion Rule

A Brainrot is created by:

- merging two completed level-6 chains

---

## Discovery Moment

Unlocking a Brainrot triggers:

- popup reveal
- light rays
- celebratory SFX
- rarity glow
- “BRAINROT UNLOCKED” text

Then:

- character animates into INDEX button

This is the biggest dopamine moment in the game.

---

# 13. INDEX SYSTEM

## Purpose

The INDEX acts as:

- collection tracker
- recipe guide
- long-term retention system

---

## INDEX Features

- discovered Brainrots
- undiscovered silhouettes
- rarity colors
- recipe previews
- completion percentage
- “NEW” indicators

---

## Recipe Tracking

Players can:

- select a tracked Brainrot

UI then displays:

- required chains
- progress toward completion

This guides players WITHOUT restricting freedom.

---

# 14. PASSIVE INCOME

## Brainrot Income

Unlocked Brainrots generate:

- passive currency over time
- including offline progression

---

## Offline Income

Players earn currency while away.

Upon returning:

- summary popup appears

Simple implementation only.

---

# 15. ECONOMY

## Currency Sources

Currency earned from:

- merges
- combo chains
- Brainrot unlocks
- passive income

---

## Currency Uses

Players spend currency on:

- grid expansion
- spawn button upgrades
- direct item purchases

---

## Direct Item Purchases

Players may buy:

- specific needed pieces

Higher rarity items cost significantly more.

This prevents RNG frustration.

---

# 16. BUTTON UPGRADE SYSTEM

## Purpose

Reduce required taps per spawn.

Example:

- 10 taps per spawn
- upgraded to 9
- then 8
- etc.

---

## Design Goal

The button should always feel:

- useful
- spam-worthy
- rewarding

---

# 17. RARITY SYSTEM

## Full Planned Rarity Structure


| Rarity    | Color    |
| --------- | -------- |
| Common    | Grey     |
| Uncommon  | Green    |
| Rare      | Blue     |
| Epic      | Purple   |
| Legendary | Yellow   |
| Mythical  | Orange   |
| Cosmic    | Sky Blue |
| Secret    | Red      |
| Celestial | Gold     |


---

## V1 Rarities

Only:

- Common
- Rare
- Legendary

---

## Rare Spawn Chance

Small chance for:

- upgraded pieces
- bonus-value items
- rare variants

Purpose:

- excitement
- surprise moments

---

# 18. BRAINROT CHAINS

# 18.1 Bombardiero Crocodilo

## Creature Chain


| Level | Piece             |
| ----- | ----------------- |
| 1     | Egg               |
| 2     | Cracked Egg       |
| 3     | Baby Crocodile    |
| 4     | Crocodile         |
| 5     | Armored Crocodile |
| 6     | Elite Crocodile   |


## Machine Chain


| Level | Piece        |
| ----- | ------------ |
| 1     | Gear         |
| 2     | Engine Part  |
| 3     | Motor        |
| 4     | Propeller    |
| 5     | Airplane     |
| 6     | Bomber Plane |


## Final Fusion

Elite Crocodile + Bomber Plane =

### Bombardiero Crocodilo

---

# 18.2 Tralalero Tralala

## Creature Chain


| Level | Piece       |
| ----- | ----------- |
| 1     | Fish Egg    |
| 2     | Tiny Fish   |
| 3     | Baby Shark  |
| 4     | Shark       |
| 5     | Cool Shark  |
| 6     | Mafia Shark |


## Music Chain


| Level | Piece           |
| ----- | --------------- |
| 1     | Shoe Lace       |
| 2     | Sneaker         |
| 3     | Headphones      |
| 4     | Boombox         |
| 5     | DJ Mixer        |
| 6     | Concert Speaker |


## Final Fusion

Mafia Shark + Concert Speaker =

### Tralalero Tralala

---

# 18.3 Ballerina Capuccina

## Coffee Chain


| Level | Piece             |
| ----- | ----------------- |
| 1     | Coffee Bean       |
| 2     | Espresso          |
| 3     | Cappuccino        |
| 4     | Fancy Cappuccino  |
| 5     | Royal Cappuccino  |
| 6     | Living Cappuccino |


## Ballet Chain


| Level | Piece           |
| ----- | --------------- |
| 1     | Ribbon          |
| 2     | Ballet Shoe     |
| 3     | Music Box       |
| 4     | Tutu            |
| 5     | Ballerina Doll  |
| 6     | Prima Ballerina |


## Final Fusion

Living Cappuccino + Prima Ballerina =

### Ballerina Capuccina

---

# 18.4 Chimpanzini Bananini

## Monkey Chain


| Level | Piece       |
| ----- | ----------- |
| 1     | Peanut      |
| 2     | Baby Monkey |
| 3     | Monkey      |
| 4     | Chimpanzee  |
| 5     | Big Chimp   |
| 6     | Alpha Chimp |


## Banana Chain


| Level | Piece         |
| ----- | ------------- |
| 1     | Banana Slice  |
| 2     | Banana        |
| 3     | Banana Bunch  |
| 4     | Golden Banana |
| 5     | Banana Crate  |
| 6     | Banana Throne |


## Final Fusion

Alpha Chimp + Banana Throne =

### Chimpanzini Bananini

---

# 18.5 Vaquita Saturnita

## Space Chain


| Level | Piece         |
| ----- | ------------- |
| 1     | Rock          |
| 2     | Meteor        |
| 3     | Tiny Planet   |
| 4     | Saturn        |
| 5     | Galaxy Core   |
| 6     | Cosmic Saturn |


## Sea Creature Chain


| Level | Piece            |
| ----- | ---------------- |
| 1     | Water Drop       |
| 2     | Fish             |
| 3     | Dolphin          |
| 4     | Vaquita          |
| 5     | Space Vaquita    |
| 6     | Galactic Vaquita |


## Final Fusion

Cosmic Saturn + Galactic Vaquita =

### Vaquita Saturnita

---

# 19. ONBOARDING

## First 60 Seconds

Player should:

- understand tapping
- spawn pieces
- perform first merge
- understand progression

---

## First 90 Seconds

Player should:

- discover first Brainrot

This is critical.

---

## First 10 Minutes

Player should:

- understand recipes
- unlock upgrades
- feel board pressure
- expand grid

---

# 20. VISUAL DIRECTION

## Art Style

- colorful
- soft
- toy-like
- cozy
- readable
- exaggerated silhouettes

---

## Visual Priorities

Readability over detail.

Especially:

- on mobile
- during chaos
- during rapid movement

---

## Piece Animation

All pieces should feel alive:

- subtle bounce
- idle motion
- blinking
- wobble
- breathing

---

# 21. AUDIO DIRECTION

## Audio Goals

Audio should:

- reward interaction
- amplify dopamine
- support merge rhythm

---

## Important Audio Moments

- spawn clicks
- merge pops
- combo stingers
- Brainrot unlock fanfare
- board clear sadness

---

# 22. USER INTERFACE

# Top Bar

- Currency
- Passive income rate
- Settings

---

# Recipe Bar

- Tracked Brainrot
- Required chains
- Progress indicators

---

# Center

- Merge grid

---

# Bottom Area

- Spawn button
- Progress meter
- Clear button
- INDEX button

---

# 23. TECHNICAL CONSIDERATIONS

## Engine

TypeScript inside Meta Horizon Worlds

---

## Performance Priorities

- low memory usage
- lightweight VFX
- responsive touch controls
- stable mobile framerate

---

## Save Data

Persistent:

- INDEX progress
- unlocked Brainrots
- upgrades
- grid expansion
- passive income values

Board state itself does NOT need permanent persistence.

---

# 24. PROTOTYPE SCOPE

## Prototype Goal

Answer:

> “Is the merge loop addictive?”

---

## Prototype Features

### Include

- 4x4 grid
- tapping
- spawning
- drag merge
- merge effects
- one Brainrot
- basic economy
- basic index
- simple upgrades

### Exclude

- multiplayer
- monetization
- cosmetics
- quests
- events
- advanced UI

---

# 25. VERTICAL SLICE GOALS

## Purpose

Prove:

- 10-minute retention
- recipe clarity
- progression pacing
- board readability

---

## Additions

- 3 Brainrots
- offline progression
- rarity system
- improved juice
- audio polish

---

# 26. V1 GOALS

## Final Deliverables

- 5 Brainrots
- full INDEX
- polished UX
- balanced progression
- satisfying feel
- optimized mobile performance

---

# 27. BIGGEST RISKS


| Risk               | Solution                  |
| ------------------ | ------------------------- |
| Board clutter      | Smart spawn weighting     |
| RNG frustration    | Hidden assistance systems |
| Weak game feel     | Prioritize juice early    |
| Visual confusion   | Strong silhouettes        |
| Slow progression   | Fast first unlock         |
| Mobile frustration | Responsive drag behavior  |


---

# 28. SUCCESS METRICS

## Prototype Success

Players voluntarily continue playing after first Brainrot.

---

## Vertical Slice Success

Players remain engaged for:  
10+ minutes consistently.

---

## V1 Success

Players:

- chase INDEX completion
- return for passive income
- continue unlocking recipes

---

# 29. FINAL DESIGN PHILOSOPHY

Brainrot Merge succeeds if:

- every merge feels satisfying
- every unlock feels exciting
- the board feels manageable but chaotic
- players constantly anticipate the next discovery

This is NOT a deep strategy game.

It is:

# a tactile collectible dopamine machine built around absurd meme discovery.

