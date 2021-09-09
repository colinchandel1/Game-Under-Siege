function main () {
	/* list of stuff this game still needs: 
	fix sniper ai
	the rest of the promotionspromotions
	untangle pSize
	arrays to methods
	
	lower priority:
	implement 'surprise!'
	*/
	
	const canvas = document.getElementById('canvas')
	const ctx = canvas.getContext('2d')
	const alerts = document.getElementById('alerts')
	const playerMusic = document.getElementById('playerMusic')
	const playerSiegeMusic = document.getElementById('playerSiegeMusic')
	const enemyMusic = document.getElementById('enemyMusic')
	playerMusic.loop = true
	playerSiegeMusic.loop = true
	enemyMusic.loop = true
	
	const pSize = 15
	let iTime = 0
	const enemyInterval = 15
	const timeInterval = 40
	
	// cursor
	let mouseX = 300 / pSize
	let mouseY = 150 / pSize
	let mouseSpeed = 1 / 2
	let previousSelected = 0
	
	// difficulty variables
	let wealthInterval = 80
	let enemyLatency = 5
	let enemyMaterialLag = 0.1
	let enemySiegeMin = 20
	let enemySiegeMax = 60
	let promotions = true
	const cheatCount = {
		'overMoving': 0,
		'tampering': 0,
		'turnSkipping': 0,
		'movingWrongPhase': 0,
		'controllingDead': 0,
		'cheatAlert': (cheat) => {
			if (cheatCount[cheat] === cheatsToLimits[cheat][0]) writeAlerts(cheatsToMsg[cheat][0])
			if (cheatCount[cheat] === cheatsToLimits[cheat][1]) writeAlerts(cheatsToMsg[cheat][1])
			if (surprised) manageSurprise(cheat)
			if (cheatCount[cheat] === cheatsToLimits[cheat][2]) summonSurprise()
		}
	}
	const cheatsToMsg = {
		'overMoving': ['It\'s a bad idea for a character to act more than once per turn.', 'The gods frown upon a character fighting or healing more than once per turn.'],
		'tampering': ['It\'s a bad idea to tamper with forces beyond your players.', 'The gods grow angry with your tampering.'],
		'turnSkipping': ['Be patient, the turn hasn\'t ended yet.', 'The gods dislike your impatience.'],
		'movingWrongPhase': ['Halt! It is not your turn.', 'The gods are angered by your disrespect of turns.'],
		'controllingDead': ['Only fools trifle with spirits of the dead.', 'The gods will not allow you to control the dead.']
	}
	const cheatsToLimits = {
		'overMoving': [4, 8, 24],
		'tampering': [3, 6, 16],
		'turnSkipping': [4, 8, 15],
		'movingWrongPhase': [2, 4, 10],
		'controllingDead': [3, 6, 12]
	}
	const summonSurprise = (cheat) => {
		writeAlerts('The gods have decided to punish you!')
		surprised = true
		const lvl = allPlayers.slice().sort((a, b) => b.level - a.level)[0].level + 20
		const surprise = new Surprise(50, 10, lvl)
	}
	const manageSurprise = (cheat) => {
		surprises.forEach(surprise => {
			if (cheat === 'overMoving') {
				enemyPhase = true
				iTime = 1
			} else if (cheat === 'turnSkipping') surprise.move += 1
			else if (cheat === 'movingWrongPhase') surprise.move += 2
			surprise.level += 2
			surprise.updateStats()
		})
	}
	const cheatDecrementChance = 0.1
	
	// constant conversions (item - number)
	const WEAPON = {
		'Sword': 1,
		'Lance': 2,
		'Axe': 3,
		'Bow': 4,
		'Ballista': 4,
		'Staff': 5,
		'Weapon': 6,
		'Dagger': 7,
		'Claws': 10
	}
	const MATERIAL = {
		0: 6,
		'No': 6,
		'Bronze': 1,
		'Iron': 2,
		'Steel': 3,
		'Adamant': 4,
		'Heal': 5,
		'Wooden': 6,
		' ': 7
	}
	const ARMORBLOCK = {
		'No': 0,
		'Bronze': 1,
		'Iron': 3,
		'Steel': 5,
		'Adamant': 9
	}
	const ARMORWEIGHT = {
		'No': 0,
		'Bronze': 1,
		'Iron': 3,
		'Steel': 5,
		'Adamant': 5
	}
	
	// reverse constant conversions (number-item)
	const reverseWEAPON = {
		1: 'Sword',
		2: 'Lance',
		3: 'Axe',
		4: 'Bow'
	}
	const reverseMATERIAL = {
		1: 'Bronze',
		2: 'Iron',
		3: 'Steel',
		4: 'Adamant'
	}
	
	// wall coordinates
	class Wall {
		constructor (X, Y, L, W) {
			this.x = X * pSize
			this.y = Y * pSize
			this.length = L * pSize
			this.width = W * pSize
		}
		points () {
			const filler = this
			return Array(this.length / pSize).fill().map(
				(_, i) => Array(filler.width / pSize).fill().map(
					(_, j) => [filler.x / pSize + i, filler.y / pSize +j])).flat()
		}
	}
	const wall0 = new Wall(3, 3, 1, 14)
	const walls = [wall0]
	walls.push(new Wall (4, 3, 20, 1))
	walls.push(new Wall (4, 16, 4, 1))
	walls.push(new Wall (6, 5, 1, 10))
	walls.push(new Wall (7, 16, 1, 5))
	walls.push(new Wall (7, 21, 4, 1))
	walls.push(new Wall (13, 21, 1, 1))
	walls.push(new Wall (15, 21, 4, 1))
	walls.push(new Wall (16, 19, 1, 1))
	walls.push(new Wall (17, 19, 3, 1))
	walls.push(new Wall (19, 4, 1, 12))
	walls.push(new Wall (16, 15, 3, 1))
	walls.push(new Wall (19, 20, 1, 2))
	walls.push(new Wall (21, 21, 6, 1))
	walls.push(new Wall (24, 19, 3, 1))
	walls.push(new Wall (22, 22, 1, 2))
	walls.push(new Wall (22, 26, 1, 2))
	walls.push(new Wall (13, 23, 1, 3))
	walls.push(new Wall (13, 28, 10, 1))
	walls.push(new Wall (9, 22, 1, 6))
	walls.push(new Wall (10, 25, 1, 1))
	walls.push(new Wall (9, 28, 4, 1))
	walls.push(new Wall (13, 27, 1, 1))
	walls.push(new Wall (20, 5, 1, 1))
	walls.push(new Wall (23, 4, 1, 1))
	walls.push(new Wall (22, 5, 3, 1))
	walls.push(new Wall (24, 4, 2, 1))
	walls.push(new Wall (24, 11, 1, 8))
	walls.push(new Wall (25, 11, 2, 1))
	walls.push(new Wall (26, 12, 1, 7))
	walls.push(new Wall (26, 2, 1, 4))
	walls.push(new Wall (26, 1, 6, 1))
	walls.push(new Wall (31, 2, 1, 4))
	walls.push(new Wall (29, 6, 2, 1))
	walls.push(new Wall (29, 6, 2, 1))
	walls.push(new Wall (30, 5, 1, 1))
	walls.push(new Wall (26, 23, 12, 1))
	walls.push(new Wall (39, 15, 1, 7))
	walls.push(new Wall (40, 15, 3, 1))
	walls.push(new Wall (42, 4, 1, 7))
	walls.push(new Wall (32, 3, 11, 1))
	walls.push(new Wall (42, 14, 1, 1))
	walls.push(new Wall (26, 24, 1, 5))
	walls.push(new Wall (23, 28, 3, 1))
	walls.push(new Wall (37, 22, 2, 1))
	walls.push(new Wall (38, 21, 1, 1))
	walls.push(new Wall (27, 15, 2, 4))
	walls.push(new Wall (30, 11, 4, 1))
	walls.push(new Wall (30, 12, 1, 1))
	walls.push(new Wall (30, 13, 4, 1))
	walls.push(new Wall (33, 12, 1, 1))
	walls.push(new Wall (36, 6, 2, 5))
	walls.push(new Wall (37, 17, 2, 1))
	
	class Door {
		constructor (X, Y, L, Axis, opened) {
			this.x = X * pSize
			this.y = Y * pSize
			this.length = L * pSize
			this.axis = Axis
			this.isOpen = opened
		}
		points () {
			if (!this.isOpen) {
				const filler = this
				if (this.axis === 'x') {
					return Array(this.length / pSize).fill().map(
						(_, i) => [filler.x / pSize + i, filler.y / pSize])
				} else {
					return Array(this.length / pSize).fill().map(
						(_, i) => [filler.x / pSize, filler.y / pSize + i])
				}
			}
		}
	}
	let door0 = new Door(19, 16, 3, 'y', true)
	let doors = [door0]
	doors.push(new Door(16, 20, 1, 'y', false))
	doors.push(new Door(20, 21, 1, 'x', false))
	doors.push(new Door(6, 4, 1, 'y', true))
	doors.push(new Door(6, 15, 1, 'y', true))
	doors.push(new Door(21, 5, 1, 'x', true))
	
	class Lever {
		constructor (X, Y, pulled) {
			this.x = X
			this.y = Y
			this.isPulled = pulled
		}
		pull () {
			this.isPulled = !this.isPulled
		}
	}
	lever0 = new Lever (10, 5, false)
	let levers = [lever0]
	levers.push(new Lever (12, 5, true))
	levers.push(new Lever (14, 5, false))
	levers.push(new Lever (4, 8, false))
	levers.push(new Lever (4, 11, false))
	levers.push(new Lever (21, 4, false))
	
	// ballistas
	class ballista {
		constructor (X, Y) {
			this.x = X
			this.y = Y
		}
	}
	const ballistas = [new ballista (30, 10), new ballista (25, 5)]
	
	// forts
	class Fort {
		constructor (X, Y) {
			this.x = X
			this.y = Y
		}
	}
	const forts = [new Fort (30, 17), new Fort (32, 17), new Fort (33, 17), new Fort (34, 17), new Fort (35, 17), new Fort (20, 4)]
	
	// pillars
	const pillarAvoid = 20
	class Pillar {
		constructor (X, Y) {
			this.x = X
			this.y = Y
		}
	}
	const pillars = [new Pillar (32, 14), new Pillar (36, 17)]
	
	class breakableWall {
		constructor (X, Y, Health, Defense) {
			this.name = 'Breakable Wall'
			this.con = 1
			this.x = X
			this.y = Y
			this.health = Health
			this.maxHealth = Health
			this.defense = Defense
			this.skill = [0, 0, 0, 0, 0, 0]
			this.speed = 0
			this.ids = ['wall']
		}
		getSkill (num) {
			return 0
		}
		getArmor (num) {
			return 0
		}
		getWeapon (num) {
			return 0
		}
		armorSum () {
			return 5
		}
		armorWeightSum () {
			return 0
		}
		getActiveSkill () {
			return 0
		}
		getWeight () {
			return 1
		}
	}
	
	const breakableWalls = [new breakableWall (14, 21, 60, 2), new breakableWall(22, 25, 40, 4)]
	breakableWalls.push(new breakableWall (11, 21, 60, 2))
	breakableWalls.push(new breakableWall (12, 21, 60, 2))
	breakableWalls.push(new breakableWall (11, 25, 50, 3))
	breakableWalls.push(new breakableWall (12, 25, 50, 3))
	breakableWalls.push(new breakableWall (22, 24, 40, 4))
	
	class playerRespawner {
		constructor (x, y, health, selfRegenRate, regenRate) {
			this.name = 'Player Respawner'
			this.x = x
			this.y = y
			this.selfRegenRate = selfRegenRate
			this.regenRate = regenRate
			this.maxHealth = health
			this.health = health
			this.defense = 2
			this.skill = [0, 0, 0, 0, 0, 0]
			this.speed = 0
			this.ids = ['respawner']
			this.tiles = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
			this.tileIsOccupied = [false, false, false, false]
		}
		getSkill (num) {
			return 0
		}
		getArmor (num) {
			return 0
		}
		getWeapon (num) {
			return 0
		}
		armorSum () {
			return 5
		}
		armorWeightSum () {
			return 0
		}
		getActiveSkill () {
			return 0
		}
		getWeight () {
			return 1
		}
	}
	
	const playerRespawners = [new playerRespawner(9, 9, 100, 1, 15)]
	
	// players
	/*
	let playerCC = {'x': 10, 'y': 6, 'moved': false, 'player': true, 'name': 'Colin', 'maxHealth': 15, 'health': 15, 'strength': 5, 'defense': 4, 'skill': [7, 5, 2, 0, 0, 0], 'speed': 9, 'armor': ['No', 'No', 'No', 'No'], 'weapon': ['Sword', 'Bronze'], 'shield': 0}
	let playerCL = {'x': 14, 'y': 6, 'moved': false, 'player': true, 'name': 'Chase', 'maxHealth': 15, 'health': 15, 'strength': 7, 'defense': 8, 'skill': [7, 3, 0, 3, 0, 1], 'speed': 7, 'armor': ['No', 'No', 'No', 'No'], 'weapon': ['Sword', 'Bronze'], 'shield': 0}
	let playerTG = {'x': 10, 'y': 10, 'moved': false, 'player': true, 'name': 'Taejon', 'maxHealth': 15, 'health': 15, 'strength': 9, 'defense': 2, 'skill': [5, 0, 0, 5, 0, 0], 'speed': 4, 'armor': ['No','No', 'No', 'No'], 'weapon': [0, 'Bronze'], 'shield': 0}
	let playerTT = {'x': 12, 'y': 8, 'moved': false, 'player': true, 'name': 'Tyler', 'maxHealth': 15, 'health': 15, 'strength': 6, 'defense': 4, 'skill': [5, 1, 1, 1, 1, 0], 'speed': 5, 'armor': ['No', 'No', 'No', 'No'], 'weapon': [0, 'Bronze'], 'shield': 0}
	let playerNS = {'x': 14, 'y': 10, 'moved': false, 'player': true, 'name': 'Nick', 'maxHealth': 15, 'health': 15, 'strength': 3, 'defense': 3, 'skill': [8, 2, 2, 2, 2, 0], 'speed': 7, 'armor': ['No', 'No', 'No', 'No'], 'weapon': [0, 'Bronze'], 'shield': 0}
	*/
 // max health, health, strength, defense, skill, speed, armor, armor material, weapon, shield, shield skill
 // [15,15,5,4,7,9,0,0,"copper sword",0,5,15,15,7,8,6,4,25,1,"copper sword",0,5,15,15,9,2,5,4,0,0,"copper sword",0,6,15,15,6,4,5,7,0,0,"copper sword",0,4,15,15,3,3,8,7,0,0,"copper sword",0,5,15,15,3,4,5,4,0,0,"copper sword",0,5,15,15,9,8,4,3,0,0,"copper mace",0,6];
/*  skill: [sum, sword, lance, axe, bow, shield]
	weapon: [type, material]
	material: 1 = bronze, 2 = iron, 3 = steel, 4 = adamant
	type: 1 = sword, 2 = lance, 3 = axe, 4 = bow, 0 = none
	armor: [head, chest, legs, feet](material)
*/
/* battle formulas
attack1 = strength1 + might1
defense1 = defense1 + armor1 + shieldBlock * ifShielded
shieldChance = chance of shielded = 2 * shieldSkill1 - weaponSkill2 / 2
for melee {
	attackSpeed1 = speed * con / (con + weight)
	hit1 = accuracy1 + skillWeapon1 + skillTotal1 - attackSpeed2
}
crit1 = (weaponCrit1 + skillWeapon1 - armorCritReduction2)!shielded
F = ma
speed * con = attackSpeed * (con + weight)
attackSpeed = speed * con / (con + weight)
*/

	let allEnemies = []
	let allPlayers = []
	let allObjects = []
	
	class Player {
		constructor (Name) {
			this.player = true
			this.neutral = false
			this.name = Name
			this.con = 130
			this.ids = []
			this.promoted = false
			this.respawning = false
			this.arena = false
			this.attacked = false
			if (Name === 'Colin') {
				this.letter = 'C'
				this.con = 130
				this.x = 10
				this.y = 12
				this.maxHealth = 15
				this.health = 15
				this.strength = 5
				this.defense = 4
				this.skill = [8, 6, 2, 0, 0, 0]
				this.speed = 11
				this.armor = ['No', 'No', 'No', 'No']
				this.weapon = ['Sword', 'Bronze']
				this.shield = 0
				this.inventory = [['Sword', 'Bronze']]
				this.healthGrowth = 80
				this.strengthGrowth = 45
				this.defenseGrowth = 35
				this.skillGrowth = [0, 45, 15, 0, 0, 0]
				this.speedGrowth = 80
				this.option1 = 'Swordmaster'
				this.option2 = 'Spearmaster'
				this.prfWeapon = [' ', 'Dagger']
			} else if (Name === 'Chase') {
				this.letter = 'L'
				this.con = 230
				this.x = 14
				this.y = 12
				this.maxHealth = 15
				this.health = 15
				this.strength = 7
				this.defense = 8
				this.skill = [6, 2, 0, 2, 0, 2]
				this.speed = 4
				this.armor = ['No', 'No', 'No', 'No']
				this.weapon = ['Sword', 'Bronze']
				this.inventory = [['Sword', 'Bronze']]
				this.shield = 0
				this.healthGrowth = 90
				this.strengthGrowth = 50
				this.defenseGrowth = 60
				this.skillGrowth = [0, 20, 0, 20, 0, 10]
				this.speedGrowth = 35
				this.option1 = 'Hero'
				this.option2 = 'Great Knight'
				this.prfWeapon = [' ', 'Igneo Blade']
			} else if (Name === 'Taejon') {
				this.letter = 'G'
				this.con = 250
				this.x = 10
				this.y = 16
				this.maxHealth = 15
				this.health = 15
				this.strength = 10
				this.defense = 2
				this.skill = [6, 0, 0, 5, 0, 1]
				this.speed = 4
				this.armor = ['No', 'No', 'No', 'No']
				this.weapon = ['Axe', 'Bronze']
				this.inventory = [['Axe', 'Bronze']]
				this.shield = 0
				this.healthGrowth = 85
				this.strengthGrowth = 85
				this.defenseGrowth = 25
				this.skillGrowth = [0, 0, 0, 40, 0, 10]
				this.speedGrowth = 45
				this.option1 = 'Warrior'
				this.option2 = 'Berserker'
			} else if (Name === 'Tyler') {
				this.letter = 'T'
				this.x = 12
				this.y = 14
				this.maxHealth = 15
				this.health = 15
				this.strength = 6
				this.defense = 5
				this.skill = [5, 1, 1, 1, 1, 1]
				this.speed = 6
				this.armor = ['No', 'No', 'No', 'No']
				this.weapon = ['Lance', 'Bronze']
				this.inventory = [['Lance', 'Bronze']]
				this.shield = 0
				this.healthGrowth = 90
				this.strengthGrowth = 45
				this.defenseGrowth = 40
				this.skillGrowth = [50, 0, 20, 0, 20, 10]
				this.speedGrowth = 60
				this.option1 = ''
				this.option2 = 'Sniper'
			} else if (Name === 'Nick') {
				this.letter = 'S'
				this.x = 14
				this.y = 16
				this.maxHealth = 15
				this.health = 15
				this.strength = 4
				this.defense = 3
				this.skill = [10, 2, 4, 2, 2, 0]
				this.speed = 7
				this.armor = ['No', 'No', 'No', 'No']
				this.weapon = ['Lance', 'Bronze']
				this.inventory = [['Lance', 'Bronze']]
				this.shield = 0
				this.healthGrowth = 80
				this.strengthGrowth = 40
				this.defenseGrowth = 40
				this.skillGrowth = [70, 0, 30, 30, 0, 10]
				this.speedGrowth = 70
				this.option1 = 'Halberdier'
				this.option2 = 'Wyvern Rider'
			} else if (Name === 'Healer') {
				this.letter = 'H'
				this.didHeal = false
				this.x = 12
				this.y = 10
				this.maxHealth = 15
				this.health = 15
				this.strength = 0
				this.magic = 5
				this.defense = 4
				this.skill = [0, 0, 0, 0, 0, 0]
				this.speed = 5
				this.armor = ['No', 'No', 'No', 'No']
				this.weapon = ['Staff', 'Heal']
				this.inventory = [['Staff', 'Heal']]
				this.shield = 0
				this.healthGrowth = 75
				this.strengthGrowth = 0
				this.magicGrowth = 40
				this.defenseGrowth = 40
				this.skillGrowth = [0, 0, 0, 0, 0, 0]
				this.speedGrowth = 60
				this.option1 = 'Bishop'
				this.option2 = ''
			}
			this.shieldInv = this.shield
			this.exp = 0
			this.level = 1
			this.gold = 50
			this.deaths = 0
			if (WEAPON[this.getWeapon(0)] !== 4) this.weaponRange = 1
			else this.weaponRange = 3
			allPlayers.push(this)
			allObjects.push(allPlayers[allPlayers.length - 1])
		}
		getSkill (num) {
			return this.skill[num]
		}
		getSkillGrowth (num) {
			return this.skillGrowth[num]
		}
		getArmor (num) {
			return this.armor[num]
		}
		getWeapon (num) {
			return this.weapon[num]
		}
		armorSum () {
			return ARMORBLOCK[this.getArmor(0)] + ARMORBLOCK[this.getArmor(1)] + ARMORBLOCK[this.getArmor(2)] + ARMORBLOCK[this.getArmor(3)]
		}
		armorWeightSum () {
			return ARMORWEIGHT[this.getArmor(0)] + ARMORWEIGHT[this.getArmor(1)] + ARMORWEIGHT[this.getArmor(2)] + ARMORWEIGHT[this.getArmor(3)]
		}
		getActiveSkill () {
			return this.getSkill(WEAPON[this.getWeapon(0)])
		}
		getInRange () {
			let inRange = []
			for (let i = 0; i < allEnemies.length; i++) {
				if ((Math.abs(this.x - allEnemies[i].x) + Math.abs(this.y - allEnemies[i].y)) <= this.weaponRange) {
					inRange[inRange.length] = allEnemies[i]
					inRange[inRange.length - 1].index = i
					inRange[inRange.length - 1].dist = Math.abs(this.x - allEnemies[i].x) + Math.abs(this.y - allEnemies[i].y)
				}
			}
			return inRange
		}
		getWeight () {
			let mass = this.con + this.armorWeightSum()
			if (this.weapon) mass += weight[WEAPON[this.getWeapon(0)] - 1][MATERIAL[this.getWeapon(1)] - 1]
			if (this.shield) mass += weight[1][MATERIAL[this.shield] - 1]
			return mass
		}
		heal (object) {
			object.health += 10 + this.magic
			this.exp += 25
			if (object.health > object.maxHealth) object.health = object.maxHealth
		}
		recover () {
			this.health += this.maxHealth / 4
			this.health = Math.round(this.health)
			if (this.health > this.maxHealth) this.health = this.maxHealth
		}
		levelUp () {
			if (Math.random() * 100 <= this.healthGrowth) {
				this.maxHealth += 1
				this.health += 1
			}
			if (Math.random() * 100 <= this.strengthGrowth) this.strength += 1
			if (Math.random() * 100 <= this.defenseGrowth) this.defense += 1
			if (Math.random() * 100 <= this.getSkillGrowth(1)) this.skill[1] += 1
			if (Math.random() * 100 <= this.getSkillGrowth(2)) this.skill[2] += 1
			if (Math.random() * 100 <= this.getSkillGrowth(3)) this.skill[3] += 1
			if (Math.random() * 100 <= this.getSkillGrowth(4)) this.skill[4] += 1
			if (Math.random() * 100 <= this.getSkillGrowth(5)) this.skill[5] += 1
			this.skill[0] = this.getSkill(1) + this.getSkill(2) + this.getSkill(3) + this.getSkill(4) + this.getSkill(5)
			if (Math.random() * 100 <= this.speedGrowth) this.speed += 1
			if (this.name === 'Healer') {
				if (Math.random() * 100 <= this.magicGrowth) this.magic += 1
			}
			this.level += 1
		}
		promoting () {
			ctx.fillStyle = '#000000'
			ctx.fillRect(0, 500, 900, 400)
			ctx.fillStyle = '#ffffff'
			ctx.fillText('Promotion!', 450 - 10 * 9 / 2, 600)
			ctx.fillText('Press q', 150 - 7 * 9 / 2, 650)
			ctx.fillText('Press p', 750 - 7 * 9 / 2, 650)
			ctx.fillText(this.option1, 150 - this.option1.length * 9 / 2, 675)
			ctx.fillText(this.option2, 750 - this.option2.length * 9 / 2, 675)
			if (keyWentDown['q']) this.promote(this.option1)
			else if (keyWentDown['p']) this.promote(this.option2)
		}
		promote (newClass) {
			if (newClass !== '') {
				this.promoted = true
			}
			if (newClass === 'Swordmaster') {
				
				// sword skill and speed intensive. bonus: crit
				this.con += 15
				this.maxHealth += 4
				this.health += 4
				this.strength += 2
				this.defense += 2
				this.skill[0] += 2
				this.skill[1] += 2
				this.speed += 1
				this.healthGrowth += 10
				this.strengthGrowth += 10
				this.defenseGrowth += 10
				this.skillGrowth[0] += 5
				this.skillGrowth[1] += 5
				this.speedGrowth += 1
			} else if (newClass === 'Spearmaster') {
				
				// strength and defense intensive. balance sword and lance. bonus: armor effective
				this.effective = 'Armored'
				this.con += 20
				this.maxHealth += 4
				this.health += 4
				this.strength += 3
				this.defense += 3
				this.skill[0] += 4
				this.skill[1] += 2
				this.skill[2] += 2
				this.speed += 1
				this.healthGrowth += 10
				this.strengthGrowth += 15
				this.defenseGrowth += 15
				this.skillGrowth[1] = 40
				this.skillGrowth[2] = 40
				this.speedGrowth += 0
			} else if (newClass === 'Hero') {
				this.effective = 'Monster'
				this.con += 30
				this.maxHealth += 5
				this.health += 5
				this.strength += 1
				this.defense += 1
				this.skill[0] += 8
				this.skill[1] += 3
				this.skill[3] += 3
				this.skill[5] += 2
				this.speed += 4
				this.healthGrowth += 5
				this.strengthGrowth += 5
				this.skillGrowth[1] += 6
				this.skillGrowth[3] += 6
				this.skillGrowth[5] += 12
				this.speedGrowth += 15
			} else if (newClass === 'Great Knight') {
				this.ids.push('Mounted')
				this.ids.push('Armored')
				this.con += 50
				this.maxHealth += 3
				this.health += 3
				this.strength += 2
				this.defense += 2
				this.skill[0] += 8
				this.skill[1] += 2
				this.skill[2] += 2
				this.skill[3] += 2
				this.skill[5] += 2
				this.speed += 2
				this.healthGrowth += 5
				this.strengthGrowth += 10
				this.skillGrowth[5] += 10
				if (this.skillGrowth[1] >= this.skillGrowth[2] && this.skillGrowth[1] >= this.skillGrowth[3]) {
					this.skillGrowth[1] += 1
					this.skillGrowth[2] = this.skillGrowth[1]
					this.skillGrowth[3] = this.skillGrowth[1]
				}  else if (this.skillGrowth[2] >= this.skillGrowth[1] && this.skillGrowth[2] >= this.skillGrowth[3]) {
					this.skillGrowth[2] += 1
					this.skillGrowth[1] = this.skillGrowth[2]
					this.skillGrowth[3] = this.skillGrowth[2]
				} else {
					this.skillGrowth[3] += 1
					this.skillGrowth[1] = this.skillGrowth[3]
					this.skillGrowth[2] = this.skillGrowth[3]
				}
				this.skillGrowth[5] += 5
				this.speedGrowth += 5
			} else if (newClass === 'Warrior') {
				
				// strength and skill, better defense growth
				this.con += 10
				this.maxHealth += 3
				this.health += 3
				this.strength += 2
				this.defense += 1
				this.skill[3] += 1
				this.skill[4] += 3
				this.speed += 1
				this.healthGrowth += 15
				this.strengthGrowth += 5
				this.defenseGrowth += 15
				this.skillGrowth[3] -= 10
				this.skillGrowth[4] += 30
				this.speedGrowth += 5
			} else if (newClass === 'Berserker') {
				
				// strength and speed, better defense base
				this.con += 10
				this.maxHealth += 3
				this.health += 3
				this.strength += 2
				this.defense += 4
				this.skill[3] += 1
				this.skill[4] += 1
				this.speed += 3
				this.healthGrowth += 15
				this.strengthGrowth += 5
				this.defenseGrowth += 10
				this.skillGrowth[3] += 10
				this.skillGrowth[4] += 30
				this.speedGrowth += 15
			} else if (newClass === 'Halberdier') {
				// lance skill and speed intensive, 
				this.con += 15
				this.maxHealth += 4
				this.health += 4
				this.strength += 2
				this.defense += 2
				this.skill[2] += 3
				this.skill[5] += 5
				this.speed += 3
				this.healthGrowth += 10
				this.strengthGrowth += 10
				this.defenseGrowth += 5
				this.skillGrowth[2] += 15
				this.skillGrowth[3] += 5
				this.skillGrowth[5] += 10
				this.speedGrowth += 10
				this.effective = 'Armored'
			} else if (newClass === 'Wyvern Rider') {
				// uses axe, weak on speed 
				this.con += 15
				this.maxHealth += 5
				this.health += 5
				this.strength += 4
				this.defense += 3
				this.skill[3] += 2
				this.speed += 1
				this.healthGrowth += 10
				this.strengthGrowth += 20
				this.defenseGrowth += 10
				this.skillGrowth[3] += 10
				this.ids.push('Flying')
			} else if (newClass === 'Sniper') {
				this.con += 10
				this.ids.push('Range')
				if (this.weapon[0] === 'Bow') ++this.weaponRange
				this.health += 4
				this.maxHealth += 4
				this.strength += 2
				this.defense += 2
				this.healthGrowth += 10
				this.strengthGrowth += 15
				this.defenseGrowth += 10
				this.skillGrowth[4] += 10
				this.skillGrowth[5] -= 5
				this.speedGrowth += 5
			}
		}
	}
	
	let playerCC = new Player('Colin')
	let playerCL = new Player('Chase')
	let playerTG = new Player('Taejon')
	let playerTT = new Player('Tyler')
	let playerNS = new Player('Nick')
	let healer = new Player('Healer')
	
	allPlayers.forEach(e => {
		e.weaponRange = 1 + 2 * (e.weapon[1] === 4)
	})
	
	const getAverageMaterial = () => {
		let materialSum = 0
		let totalNumber = 0
		allPlayers.forEach(e => {
			for (const item of e.inventory) {
				if (MATERIAL[item[1]] < 5) {
					materialSum += MATERIAL[item[1]]
					totalNumber += 1
				}
			}
			for (const item of e.armor) {
				if (item !== 'No') {
					materialSum += MATERIAL[item]
					totalNumber += 1
				}
			}
		})
		return materialSum / totalNumber
	}
	
// enemies
let swordChance = 24
let lanceChance = 48
let axeChance = 72
let bowChance = 96
let sword2Chance = 11.5
let mercChance = 23
let lance2Chance = 34.5
let cavalierChance = 46
let warriorChance = 57.5
let armorChance = 69
let sniperChance = 80.5
let nomadChance = 92
let mountedTrollChance = 96


	class Hostile {
		constructor (lvl, mat) {
			this.x = Math.round(Math.random() * 10 + 45)
			this.y = Math.round(Math.random() * 20 + 5)
			this.player = false
			this.neutral = false
			this.hostile = true
			this.ids = []
			this.fleeing = false
			this.fled = false
			this.arena = false
			this.con = 130
			this.armor = ['No', 'No', 'No', 'No']
			if (lvl < 1) lvl = 1
			this.level = lvl
			this.gold = 25 + Math.round(Math.random() * 25 / 5) * 5
			const rand = Math.random() * 100
			const rand1 = Math.random() * 100
			if (rand1 <= 0.258 * 20) this.shield = 'Bronze'
			else this.shield = 0
			this.move = 5
			if (lvl < 20 || !promotions) {
				if (rand < swordChance) {
					this.name = 'Goblin Swordsman'
					this.letter = 'g'
					this.healthGrowth = 60
					this.strengthGrowth = 40
					this.strength = 3 + Math.round(this.strengthGrowth / 100 * (lvl - 1))
					this.defenseGrowth = 20
					this.defense = 3 + Math.round(this.defenseGrowth / 100 * (lvl - 1))
					this.skillGrowth = [0, 35, 0, 0, 0, 15]
					this.skill = [0, 5 + Math.round(this.skillGrowth[1] / 100 * (lvl - 1)), 0, 0, 0, 1 + Math.round(this.skillGrowth[5] / 100 * (lvl - 1))]
					this.speedGrowth = 55
					this.speed = 6 + Math.round(this.speedGrowth / 100 * (lvl - 1))
					this.weapon = ['Sword', 'Bronze']
				} else if (rand < lanceChance) {
					this.name = 'Goblin Soldier'
					this.con = 150
					this.letter = 'g'
					this.healthGrowth = 60
					this.strengthGrowth = 50
					this.strength = 4 + Math.round(this.strengthGrowth / 100 * (lvl - 1))
					this.defenseGrowth = 25
					this.defense = 4 + Math.round(this.defenseGrowth / 100 * (lvl - 1))
					this.skillGrowth = [0, 0, 25, 0, 0, 10]
					this.skill = [5, 0, 4 + Math.round(this.skillGrowth[2] / 100 * (lvl - 1)), 0, 0, Math.round(this.skillGrowth[5] / 100 * (lvl - 1))]
					this.speedGrowth = 40
					this.speed = 4 + Math.round(this.speedGrowth / 100 * (lvl - 1))
					this.armor = ['No', 'No', 'No', 'No']
					this.weapon = ['Lance', 'Bronze']
				} else if (rand < axeChance) {
					this.name = 'Goblin Fighter'
					this.letter = 'g'
					this.con = 180
					this.healthGrowth = 60
					this.strengthGrowth = 65
					this.strength = 5 + Math.round(this.strengthGrowth / 100 * (lvl - 1))
					this.defenseGrowth = 30
					this.defense = 5 + Math.round(this.defenseGrowth / 100 * (lvl - 1))
					this.skillGrowth = [0, 0, 0, 20, 0, 5]
					this.skill = [3, 0, 0, 3 + Math.round(this.skillGrowth[3] / 100 * (lvl - 1)), 0, Math.round(this.skillGrowth[5] / 100 * (lvl - 1))]
					this.speedGrowth = 35
					this.speed = 3 + Math.round(this.speedGrowth / 100 * (lvl - 1))
					this.weapon = ['Axe', 'Bronze']
				} else if (rand <= bowChance) {
					this.name = 'Goblin Archer'
					this.letter = 'g'
					this.healthGrowth = 60
					this.strengthGrowth = 50
					this.strength = 4 + Math.round(this.strengthGrowth / 100 * (lvl - 1))
					this.defenseGrowth = 25
					this.defense = 4 + Math.round(this.defenseGrowth / 100 * (lvl - 1))
					this.skillGrowth = [0, 0, 0, 0, 25, 10]
					this.skill = [5, 0, 0, 0, 4 + Math.round(this.skillGrowth[4] / 100 * (lvl - 1)), Math.round(this.skillGrowth[5] / 100 * (lvl - 1))]
					this.speedGrowth = 40
					this.speed = 4 + Math.round(this.speedGrowth / 100 * (lvl - 1))
					this.armor = ['No', 'No', 'No', 'No']
					this.weapon = ['Bow', 'Bronze']
					this.effective = 'Flying'
				} else {
					this.ids.push('Monster')
					++lvl
					this.con = 300
					this.move = 3
					this.healthGrowth = 85
					this.strengthGrowth = 80
					this.strength = 10 + Math.round(this.strengthGrowth / 100 * (lvl - 1))
					this.defenseGrowth = 35
					this.defense = 8 + Math.round(this.defenseGrowth / 100 * (lvl - 1))
					this.skillGrowth = [0, 0 , 0, 15, 0, 10]
					this.skill = [4, 0, 0, 3 + Math.round(this.skillGrowth[3] / 100 * (lvl - 1)), 0, 1 + Math.round(this.skillGrowth[5] / 100 * (lvl - 1))]
					this.speedGrowth = 25
					this.speed = 3 + Math.round(this.speedGrowth / 100 * (lvl - 1))
					this.name = 'Troll'
					this.letter = 't'
					this.weapon = ['Axe', 'Bronze']
					if (rand1 <= 200 * 0.258) this.shield = 'Bronze'
				} 
			} else {
					/* let sword2chance = 13
	let mercChance = 26
	let lance2chance = 39
	let cavalierChance = 52
	let warriorChance = 65
	let armorChance = 78
	let agileTrollChance = 89 */
	// name, con, letter, growths, stats, weapon, armor?, 
				if (rand < sword2Chance) {
					this.name = 'Great Goblin Swordsman'
					this.con = 150
					this.letter = 'g'
					this.move = 6
					this.healthGrowth = 70
					this.strengthGrowth = 55
					this.defenseGrowth = 25
					this.skillGrowth = [0, 40, 0, 0, 0, 10]
					this.speedGrowth = 70
					this.maxHealth = Math.round(26.4 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(10.6 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(6.8 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, Math.round(11.65 + this.skillGrowth[1] * (lvl - 20) / 100), 0, 0, 0, Math.round(3.85 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(16.45 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Sword', 'Iron']
				} else if (rand < mercChance) {
					this.name = 'Goblin Mercenary'
					this.con = 160
					this.letter = 'g'
					this.move = 6
					this.healthGrowth = 70
					this.strengthGrowth = 60
					this.defenseGrowth = 35
					this.skillGrowth = [0, 30, 0, 10, 0, 15]
					this.speedGrowth = 60
					this.maxHealth = Math.round(26.4 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(10.6 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(6.8 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, Math.round(11.65 + this.skillGrowth[1] * (lvl - 20) / 100), 0, 0, 0, Math.round(3.85 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(16.45 + this.speedGrowth * (lvl - 20) / 100)
					if (Math.random() < 0.7) this.weapon = ['Sword', 'Iron']
					else this.weapon = ['Axe', 'Iron']
				} else if (rand < lance2Chance) {
					this.name = 'Great Goblin Spearman'
					this.con = 165
					this.letter = 'g'
					this.move = 6
					this.healthGrowth = 70
					this.strengthGrowth = 60
					this.defenseGrowth = 40
					this.skillGrowth = [0, 0, 40, 0, 0, 10]
					this.speedGrowth = 55
					this.maxHealth = Math.round(26.5 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(13.5 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(10.7 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, Math.round(8.75 + this.skillGrowth[2] * (lvl - 20) / 100), 0, 0, Math.round(1.9 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(11.6 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Lance', 'Iron']
					this.effective = 'Armored'
				} else if (rand < cavalierChance) {
					this.name = 'Goblin Cavalier'
					this.con = 170
					this.ids.push('Mounted')
					this.letter = 'g'
					this.move = 8
					this.healthGrowth = 70
					this.strengthGrowth = 60
					this.defenseGrowth = 35
					this.skillGrowth = [0, 0, 30, 0, 0, 15]
					this.speedGrowth = 60
					this.maxHealth = Math.round(26.5 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(13.5 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(10.7 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, Math.round(8.75 + this.skillGrowth[2] * (lvl - 20) / 100), 0, 0, Math.round(1.9 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(11.6 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Lance', 'Iron']
				} else if (rand < warriorChance) {
					this.name = 'Goblin Warrior'
					this.con = 175
					this.letter = 'g'
					this.move = 6
					this.healthGrowth = 70
					this.strengthGrowth = 75
					this.defenseGrowth = 35
					this.skillGrowth = [0, 0, 0, 30, 0, 5]
					this.speedGrowth = 50
					this.maxHealth = Math.round(26.5 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(17.35 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(10.7 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, 0, Math.round(6.8 + this.skillGrowth[3] * (lvl - 20) / 100), 0, Math.round(0.95 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(9.65 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Axe', 'Iron']
				} else if (rand < armorChance) {
					this.name = 'Goblin Armor Knight'
					this.con = 190
					this.ids.push('Armored')
					this.letter = 'g'
					this.move = 5
					this.healthGrowth = 75
					this.strengthGrowth = 70
					this.defenseGrowth = 45
					this.skillGrowth = [0, 0, 0, 25, 0, 15]
					this.speedGrowth = 35
					this.maxHealth = Math.round(26.5 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(17.35 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(10.7 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, 0, Math.round(6.8 + this.skillGrowth[3] * (lvl - 20) / 100), 0, Math.round(0.95 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(9.65 + this.speedGrowth * (lvl - 20) / 100)
					this.skill[5] += 8
					this.weapon = ['Axe', 'Iron']
					this.shield = 'Bronze'
				} else if (rand < sniperChance) {
					this.name = 'Goblin Sniper'
					this.con = 165
					this.ids.push('Range')
					this.letter = 'g'
					this.move = 6
					this.healthGrowth = 70
					this.strengthGrowth = 60
					this.defenseGrowth = 30
					this.skillGrowth = [0, 0, 0, 0, 40, 10]
					this.speedGrowth = 55
					this.maxHealth = Math.round(26.5 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(13.5 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(10.7 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, Math.round(8.75 + this.skillGrowth[2] * (lvl - 20) / 100), 0, 0, Math.round(1.9 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(11.6 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Bow', 'Iron']
					this.effective = 'Flying'
				} else if (rand < nomadChance) {
					this.name = 'Goblin Raider'
					this.con = 165
					this.ids.push('Mounted')
					this.ids.push('Raider')
					this.letter = 'g'
					this.move = 7
					this.healthGrowth = 70
					this.strengthGrowth = 60
					this.defenseGrowth = 30
					this.skillGrowth = [0, 0, 0, 0, 35, 10]
					this.speedGrowth = 60
					this.maxHealth = Math.round(26.5 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(13.5 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(10.7 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, Math.round(8.75 + this.skillGrowth[2] * (lvl - 20) / 100), 0, 0, Math.round(1.9 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(11.6 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Bow', 'Iron']
					this.effective = 'Flying'
				} else if (rand < mountedTrollChance) {
					this.name = 'Mounted Troll'
					this.ids.push('Mounted')
					this.ids.push('Monster')
					this.letter = 't'
					this.con = 350
					this.move = 6
					this.healthGrowth = 90
					this.strengthGrowth = 90
					this.defenseGrowth = 45
					this.skillGrowth = [0, 0, 0, 25, 0, 10]
					this.speedGrowth = 40
					this.maxHealth = Math.round(29.25 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(25.2 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(14.65 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, 0, Math.round(5.85 + this.skillGrowth[3] * (lvl - 20) / 100), 0, Math.round(1.95 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(7.75 + this.speedGrowth * (lvl - 20) / 100)
					this.weapon = ['Axe', 'Iron']
					if (rand1 <= 200 * 0.258) this.shield = 'Iron'
				} else {
					this.name = 'Armored Troll'
					this.ids.push('Monster')
					this.ids.push('Armored')
					this.letter = 't'
					this.con = 370
					this.move = 3
					this.healthGrowth = 100
					this.strengthGrowth = 90
					this.defenseGrowth = 55
					this.skillGrowth = [0, 0, 0, 20, 0, 20]
					this.speedGrowth = 30
					this.maxHealth = Math.round(29.25 + this.healthGrowth * (lvl - 20) / 100)
					this.strength = Math.round(25.2 + this.strengthGrowth * (lvl - 20) / 100)
					this.defense = Math.round(14.65 + this.defenseGrowth * (lvl - 20) / 100)
					this.skill = [0, 0, 0, Math.round(5.85 + this.skillGrowth[3] * (lvl - 20) / 100), 0, Math.round(1.95 + this.skillGrowth[5] * (lvl - 20) / 100)]
					this.speed = Math.round(7.75 + this.speedGrowth * (lvl - 20) / 100)
					this.skill[5] += 6
					this.weapon = ['Axe', 'Iron']
					this.shield = 'Iron'
				}
			}
			this.fleeDimentions = {'x': 57, 'y': 0, 'length': 3, 'height': 30}
			this.fleeArea = Array(this.fleeDimentions.height).fill(Array(this.fleeDimentions.length).fill()).map((row, i) => {
				return row.map((_, j) => {
					return { 'x': this.fleeDimentions.x + j, 'y': this.fleeDimentions.y + i }
				})
			}).flat()
			
			this.weapon[1] = reverseMATERIAL[Math.round(mat + Math.random() - 1 / 2)]
			if (this.shield) this.shield = reverseMATERIAL[Math.round(mat + Math.random() - 1 / 2)]
			this.inventory = [this.weapon]
			if (lvl < 20) this.maxHealth = 15 + Math.round(this.healthGrowth / 100 * (lvl - 1))
			this.health = this.maxHealth
			this.skill[0] = this.skill[1] + this.skill[2] + this.skill[3] + this.skill[4] + this.skill[5]
			if (this.ids.includes('Armored')) {
				this.armor = this.armor.map(armorPiece => reverseMATERIAL[Math.round(mat + Math.random() - 1 / 2)])
			}
			if (WEAPON[this.getWeapon(0)] !== 4) this.weaponRange = 1
			else {
				this.weaponRange = 3
				if (this.ids.includes('Range')) this.weaponRange += 1
			}
			allEnemies.push(this)
			allObjects.push(allEnemies[allEnemies.length - 1])
			this.num  = allEnemies.length
		}
		getSkill (num) {
			return this.skill[num]
		}
		getArmor (num) {
			return this.armor[num]
		}
		getWeapon (num) {
			return this.weapon[num]
		}
		armorSum () {
			return ARMORBLOCK[this.getArmor(0)] + ARMORBLOCK[this.getArmor(1)] + ARMORBLOCK[this.getArmor(2)] + ARMORBLOCK[this.getArmor(3)]
		}
		armorWeightSum () {
			return ARMORWEIGHT[this.getArmor(0)] + ARMORWEIGHT[this.getArmor(1)] + ARMORWEIGHT[this.getArmor(2)] + ARMORWEIGHT[this.getArmor(3)]
		}
		getActiveSkill () {
			return this.getSkill(WEAPON[this.getWeapon(0)])
		}
		paint () {
			ctx.fillStyle = '#808000'
			ctx.fillRect(this.x * pSize, this.y * pSize, pSize, pSize)
			ctx.fillStyle = '#e000e0'
			ctx.fillText(this.letter, (this.x + 1 / 5) * pSize, (this.y + 3 / 4) * pSize)
		}
		getWeight () {
			let mass = this.con + this.armorWeightSum()
			if (this.weapon) mass += weight[WEAPON[this.getWeapon(0)] - 1][MATERIAL[this.getWeapon(1)] - 1]
			if (this.shield) mass += weight[1][MATERIAL[this.shield] - 1]
			return mass
		}
		recover () {
			this.health += this.maxHealth / 4
			this.health = Math.round(this.health)
			if (this.health > this.maxHealth) this.health = this.maxHealth
		}
		attacking () {
			const range = this.move + this.weaponRange
			let inRange = []
			for (const p of attackables) {
				if (Math.abs(this.x - p.x) + Math.abs(this.y - p.y) <= range) inRange.push(p)
			}
			for (let i = 0; i < attackables.length; ++i) {
				if (!attackables[i].player && !attackables[i].neutral) attackables.splice(i, 1)
			}
			if (inRange.length) {
				
				// go for the weakest enemy
				inRange.sort((a, b) => (a.defense + a.armorSum() - b.defense - b.armorSum()))
			}
			
			return inRange
		}
		targetting () {
			let itself = this
			
			// figure out if a player is in range of the enemy
			const range = this.move + this.weaponRange
			let inRange = []
			for (const p of attackables) {
				if ((Math.abs(this.x - p.x) + Math.abs(this.y - p.y) <= range) && p.health > 0) inRange.push(p)
			}
			for (let i = attackables.length - 1; i >= 0; --i) {
				if (!attackables[i].player && !attackables[i].neutral) attackables.splice(i, 1)
			}
			let itemsInRange = []
			for (const s of stockpiles) {
				if (Math.abs(this.x - s.x) + Math.abs(this.y - s.y) <= range) itemsInRange.push(s)
			}
			let stockpileTargets = stockpiles.slice().sort((a, b) => Math.abs(this.x - a.x) + Math.abs(this.y - a.y) - Math.abs(this.x - b.x) - Math.abs(this.y - b.y))
			if (stockpileTargets.length) {
				for (let i = stockpileTargets.length - 1; i >= 0; --i) {
					if (stockpileTargets[i].gold <= 0) stockpileTargets.splice(i, 1)
				}
			}
			if (inRange.length) {
				
				// go for the weakest enemy
				inRange.sort((a, b) => (a.defense - b.defense))
				for (let i = inRange.length - 1; i >= 0; --i) {
					if (this.weaponRange >= 1 && this.strength + might[WEAPON[this.weapon[0]] - 1][MATERIAL[this.weapon[1]] - 1] - inRange[i].defense - inRange[i].armorSum() <= 0) inRange.splice(i, 1)
				}
			}
			if (itemsInRange.length) {
				
				// go for the stockpile
				for (let i = 0; i < itemsInRange.length; ++i) {
					if (!itemsInRange[i].gold) itemsInRange.splice(i, 1)
				}
				itemsInRange.sort((a, b) => (b.gold - a.gold))
			}
			
			// go for the closest enemy
			let enemies = attackables.slice()
			for (let i = enemies.length - 1; i > 0; --i) {
				if ((!enemies[i].player && !enemies[i].neutral) || enemies[i].health <=0) enemies.splice(i, 1)
				if (this.weaponRange > 1 && this.strength + might[WEAPON[this.weapon[0]] - 1][MATERIAL[this.weapon[1]] - 1] - enemies[i].defense - enemies[i].armorSum() <= 0) enemies.splice(i, 1)
			}
			enemies.sort((a, b) => Math.abs(itself.x - a.x) + Math.abs(itself.y - a.y) - Math.abs(itself.x - b.x) - Math.round(itself.y - b.y))
			let stableWalls = breakableWalls.slice()
			for (let i = stableWalls.length - 1; i >= 0; --i) {
				if (stableWalls[i].health <= 0) stableWalls.splice(i, 1)
			}
			let stableRespawners = playerRespawners.slice()
			for (let i = 0; i < stableRespawners.length; ++i) {
				if (stableRespawners[i].health <= 0) stableRespawners.splice(i, 1)
			}
			if (!this.ids.includes('Raider')) return [[inRange, enemies], stableWalls, stableRespawners]
			else if (!this.fleeing) return [[itemsInRange, inRange, stockpileTargets], enemies, stableWalls, stableRespawners]
		}
		pathFinding (map) {
			let start = map.grid[this.x][this.y]
			let picked = 0
			let pickedPath
			const range = this.move + this.weaponRange
			
			// check each target
			let targets = this.targetting()
			let possiblePaths = Array(targets.length).fill([])
			possiblePaths[0] = Array(targets[0].length).fill([])
			
			targets[0].forEach((targetList, j) => {
				for (let i = 0; i < targetList.length && !picked; ++i) {
					
					// check target priority 0
					map.grid[targetList[i].x][targetList[i].y].weight = 1
					let pathValid = false
					while (!pathValid) {
						const possiblePath = astar.search(map, start, map.grid[targetList[i].x][targetList[i].y])
						pathValid = true
						for (const enemy of allEnemies) {
							if (possiblePath.length !== 0 && enemy !== this) {
								/* case 1: within range and weaponRange === 1, check 1 away
								   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
								   case 3: longer than 2
								*/
								
								if (targetList[i].player || targetList[i].neutral) {
									if (possiblePath.length <= range && possiblePath.length > 1 && this.weaponRange === 1) {
										if (possiblePath[possiblePath.length - 2].x === enemy.x && possiblePath[possiblePath.length - 2].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									} else if (this.weaponRange > 1 && possiblePath.length > 2 && possiblePath.length <= this.move + 2) {
										if (possiblePath[possiblePath.length - 3].x === enemy.x && possiblePath[possiblePath.length - 3].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									} else if (possiblePath.length > 2) {
										if (possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									}
								} else {
									if (possiblePath.length <= this.move) {
										if (possiblePath[possiblePath.length - 1].x === enemy.x && possiblePath[possiblePath.length - 1].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									} else if (possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
										map.grid[enemy.x][enemy.y].weight = 0
										pathValid = false
									}
								}
							}
						}
					}
					/* 
					   while !pathValid {
					   create path
					   pathValid = true
					   for every hostile
						 if possiblePath.length !== 0
						   if (enemy is in range and (last - this.weaponRange) tile of path is occupied)
						     map.grid[hostile position].weight = 0
						     pathValid = false
						   else if (move th tile is occupied)
						     map.grid[hostile position].weight = 0
						     pathValid = false
					   }
					   create path
					   for allEnemies
					     map.grid[enemy position].weight = 1
					   
					    
					*/
					
					const possiblePath = astar.search(map, start, map.grid[targetList[i].x][targetList[i].y])
					for (const enemy of allEnemies) {
						map.grid[enemy.x][enemy.y].weight = 1
					}
					if (possiblePath.length !== 0) {
						if (possiblePath.length - 1 <= range) {
							pickedPath = possiblePath
							picked = targetList[i]
						} else possiblePaths[0][j][i] = possiblePath
					}
					map.grid[targetList[i].x][targetList[i].y].weight = 0
				}
			})
			
			targets[1].forEach(target => {
				
				// check target priority 1
				map.grid[target.x][target.y].weight = 1
				let pathValid = false
				while (!pathValid) {
					const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
					pathValid = true
					for (const enemy of allEnemies) {
						if (possiblePath.length !== 0 && enemy !== this) {
							/* case 1: within range and weaponRange === 1, check 1 away
							   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
							   case 3: longer than 2
							*/
							
							if (possiblePath.length < range && this.weaponRange === 1 && possiblePath.length > 1) {
								if (possiblePath[possiblePath.length - 2].x === enemy.x && possiblePath[possiblePath.length - 2].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (this.weaponRange > 1 && possiblePath.length > 2 && possiblePath.length < this.move + 2) {
								if (possiblePath[possiblePath.length - 3].x === enemy.x && possiblePath[possiblePath.length - 3].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (possiblePath.length > 2 && possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
								map.grid[enemy.x][enemy.y].weight = 0
								pathValid = false
							}
						}
					}
				}
				const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
				for (const enemy of allEnemies) {
					map.grid[enemy.x][enemy.y].weight = 1
				}
				if (possiblePath.length !== 0) {
					if (possiblePath.length - 1 <= range) {
						pickedPath = possiblePath
						picked = target
					} else possiblePaths[1].push(possiblePath)
				}
				map.grid[target.x][target.y].weight = 0
			})
			
			targets[2].forEach(target => {
				
				// check target priority 1
				map.grid[target.x][target.y].weight = 1
				let pathValid = false
				while (!pathValid) {
					const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
					pathValid = true
					for (const enemy of allEnemies) {
						if (possiblePath.length !== 0 && enemy !== this) {
							/* case 1: within range and weaponRange === 1, check 1 away
							   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
							   case 3: longer than 2
							*/
							
							if (possiblePath.length < range && this.weaponRange === 1 && possiblePath.length > 1) {
								if (possiblePath[possiblePath.length - 2].x === enemy.x && possiblePath[possiblePath.length - 2].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (this.weaponRange > 1 && possiblePath.length > 2 && possiblePath.length < this.move + 2) {
								if (possiblePath[possiblePath.length - 3].x === enemy.x && possiblePath[possiblePath.length - 3].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (possiblePath.length > 2 && possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
								map.grid[enemy.x][enemy.y].weight = 0
								pathValid = false
							}
						}
					}
				}
				const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
				for (const enemy of allEnemies) {
					map.grid[enemy.x][enemy.y].weight = 1
				}
				if (possiblePath.length !== 0) {
					if (possiblePath.length - 1 <= range) {
						pickedPath = possiblePath
						picked = target
					} else possiblePaths[1].push(possiblePath)
				}
				map.grid[target.x][target.y].weight = 0
			})
			
			if (!pickedPath) {
				possiblePaths[0].forEach(pathGroup => {
					pathGroup.sort((a, b) => a.length - b.length)
				})
				for (let i = 0; i < possiblePaths[0].length && !pickedPath; ++i) {
					pickedPath = possiblePaths[0][i][0]
				}
				if (!pickedPath) {
					pickedPath = possiblePaths[1][0]
				}
			}
			
			/*
			for (let i = 0; i < targets[1].length && !picked; ++i) {
				
				// check target priority 2
				map.grid[targets[1][i].x][targets[1][i].y].weight = 1
				const possiblePath = astar.search(map, start, map.grid[targets[1][i].x][targets[1][i].y])
				if (possiblePath.length !== 0 && possiblePath.length - 1 <= range) {
					pickedPath = possiblePath
					picked = targets[1][i]
				}
				map.grid[targets[1][i].x][targets[1][i].y].weight = 0
			}
			for (let i = 0; i < targets[2].length && !picked; ++i) {
				
				// check target priority 3
				map.grid[targets[2][i].x][targets[2][i].y].weight = 1
				const possiblePath = astar.search(map, start, map.grid[targets[2][i].x][targets[2][i].y])
				if (possiblePath.length !== 0) {
					pickedPath = possiblePath
					picked = targets[2][i]
				}
				map.grid[targets[2][i].x][targets[2][i].y].weight = 0
			}
			for (let i = 0; i < targets[3].length && !picked; ++i) {
				
				// check target priority 4
				map.grid[targets[3][i].x][targets[3][i].y].weight = 1
				const possiblePath = astar.search(map, start, map.grid[targets[3][i].x][targets[3][i].y])
				if (possiblePath.length !== 0) {
					pickedPath = possiblePath
					picked = targets[3][i]
				}
				map.grid[targets[3][i].x][targets[3][i].y].weight = 0
			}
			*/
			
			if (pickedPath && pickedPath.length <= range && (picked.player || picked.neutral || picked.ids[0] === 'wall' || picked.ids[0] === 'respawner')) {
				/* case 1: within range and weaponRange === 1, check 1 away
				   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
				   case 3: longer than 2
				*/
				if (this.weaponRange === 1 && pickedPath.length > 1) {
					this.x = pickedPath[pickedPath.length - 2].x
					this.y = pickedPath[pickedPath.length - 2].y
				} else if (this.weaponRange === 3 && pickedPath.length > 2 && pickedPath.length <= range - 1) {
					this.x = pickedPath[pickedPath.length - 3].x
					this.y = pickedPath[pickedPath.length - 3].y
				} else if (this.weaponRange === 3 && pickedPath.length > 3 && pickedPath.length <= range) {
					this.x = pickedPath[pickedPath.length - 4].x
					this.y = pickedPath[pickedPath.length - 4].y
				} else if (this.weaponRange === 4 && pickedPath.length > 2 && pickedPath.length <= range - 2) {
					this.x = pickedPath[pickedPath.length - 3].x
					this.y = pickedPath[pickedPath.length - 3].y
				} else if (this.weaponRange === 4 && pickedPath.length > 3 && pickedPath.length <= range - 1) {
					this.x = pickedPath[pickedPath.length - 4].x
					this.y = pickedPath[pickedPath.length - 4].y
				} else if (this.weaponRange === 4 && pickedPath.length > 4 && pickedPath.length <= range) {
					this.x = pickedPath[pickedPath.length - 5].x
					this.y = pickedPath[pickedPath.length - 5].y
				} else if (this.weaponRange === 4 && pickedPath.length >= this.move) {
					this.x = pickedPath[this.move - 1].x
					this.y = pickedPath[this.move - 1].y
				}
			} else if (pickedPath && pickedPath.length - 1 <= range && !(picked.player || picked.neutral) && picked.ids[0] !== 'wall' && picked.ids[0] !== 'respawner') {
				this.x = pickedPath[pickedPath.length - 1].x
				this.y = pickedPath[pickedPath.length - 1].y
			} else if (pickedPath) {
				this.x = pickedPath[this.move - 1].x
				this.y = pickedPath[this.move - 1].y
			}
		}
		
		flee (map) {
			let start = map.grid[this.x][this.y]
			let picked = 0
			let pickedPath
			
			let fleeAreaSorted = this.fleeArea.slice()
			fleeAreaSorted.sort((a, b) => Math.abs(this.x - a.x) + Math.abs(this.y - a.y) - Math.abs(this.x - b.x) - Math.abs(this.y - b.y))
			
			for (const tile of fleeAreaSorted) {
				if (!picked) {
					const possiblePath = astar.search(map, start, map.grid[tile.x][tile.y])
					if (possiblePath.length !== 0 || (this.x === tile.x && this.y === tile.y)) {
						pickedPath = possiblePath
						picked = tile
					}
				}
			}
			
			if (pickedPath.length !== 0) {
				if (pickedPath.length - 1 <= this.move) {
					this.x = picked.x
					this.y = picked.y
				} else {
					this.x = pickedPath[this.move - 1].x
					this.y = pickedPath[this.move - 1].y
				}
			} else if (this.x === picked.x && this.y === picked.y) {
				this.fled = true
				writeAlerts(this.name = ' fled!')
			}
		}
	}
	let enemyPhase = false
	let enemyAttacking = false
	
	// neutral objects
	class Neutral {
		constructor (Name) {
			this.player = false
			this.neutral = true
			this.ids = []
			this.con = 150
			this.gold = 50
			this.x = 27 + Math.round(Math.random() * 3)
			this.y = 2 + Math.round(Math.random() * 2)
			this.name = Name
			this.letter = 'M'
			this.maxHealth = 25
			this.health = 25
			this.strength = 0
			this.defense = 4
			this.skill = [0, 0, 0, 0, 0, 0]
			this.speed = 5
			this.armor = ['No', 'No', 'No', 'No']
			this.weapon = ['Weapon', 'No']
			this.shield = 0
			this.inventory = [[reverseWEAPON[Math.round(Math.random() * 4 + 0.499)], 'Iron']]
			this.inventory.push([reverseWEAPON[Math.round(Math.random() * 4 + 0.499)], 'Iron'])
			this.shieldInv = ['Iron']
			this.armorInv = []
			for (const _ of Array(4)) {
				if (Math.random() < 0.3) this.armorInv.push('Bronze')
					else this.armorInv.push('No')
			}
		}
		getSkill (num) {
			return this.skill[num]
		}
		getArmor (num) {
			return this.armor[num]
		}
		getWeapon (num) {
			return this.weapon[num]
		}
		armorSum () {
			return ARMORBLOCK[this.getArmor(0)] + ARMORBLOCK[this.getArmor(1)] + ARMORBLOCK[this.getArmor(2)] + ARMORBLOCK[this.getArmor(3)]
		}
		armorWeightSum () {
			return ARMORWEIGHT[this.getArmor(0)] + ARMORWEIGHT[this.getArmor(1)] + ARMORWEIGHT[this.getArmor(2)] + ARMORWEIGHT[this.getArmor(3)]
		}
		getActiveSkill () {
			return this.getSkill(WEAPON[this.getWeapon(0)] - 1)
		}
		getWeight () {
			return this.con + this.armorWeightSum()
		}
		getNewItem (avgMaterial, itemChance, armorChance, shieldChance) {
			const materialNo = Math.round(avgMaterial + Math.random())
			if (materialNo < 5) {
				if (Math.random() <= itemChance) this.inventory.push([reverseWEAPON[Math.round(Math.random() * 4 + 0.499)], reverseMATERIAL[materialNo]])
				if (this.inventory.length === 5) this.inventory.splice(0, 1)
				if (Math.random() <= armorChance) {
					const armorNo = Math.round(Math.random() * 4 - 0.5)
					if (materialNo > MATERIAL[this.armorInv[armorNo]] || this.armorInv[armorNo] === 'No') this.armorInv[armorNo] = reverseMATERIAL[materialNo]
				}
				if (Math.random() <= shieldChance) {
					if (materialNo > MATERIAL[this.shieldInv[0]] || this.shieldInv[0] === 'No') this.shieldInv[0] = reverseMATERIAL[materialNo]
				}
			}
		}
		heal (object) {
			object.health += 10 + this.magic
			if (object.health > object.maxHealth) object.health = object.maxHealth
		}
		recover () {
			this.health += Math.round(this.maxHealth / 4)
			this.health = Math.round(this.health)
			if (this.health > this.maxHealth) this.health = this.maxHealth
		}
	}
	
	const surprises = []
	class Surprise {
		constructor (x, y, lvl) {
			this.x = x
			this.y = y
			this.uninvitedGuest = true
			this.player = false
			this.neutral = false
			this.hostile = true
			this.name = 'Punishment from Above'
			this.ids = []
			this.fleeing = false
			this.fled = false
			this.arena = false
			this.con = 300
			this.armor = ['Adamant', 'Adamant', 'Adamant', 'Adamant']
			if (lvl < 1) lvl = 1
			this.level = lvl
			this.shield = 0
			this.gold = 0
			this.move = 8
			this.letter = 'S'
			this.healthGrowth = 90
			this.strengthGrowth = 100
			this.strength = 10 + Math.round(this.strengthGrowth / 100 * (lvl - 1))
			this.defenseGrowth = 80
			this.defense = 10 + Math.round(this.defenseGrowth / 100 * (lvl - 1))
			this.skillGrowth = 80
			this.skill = 10 + Math.round(this.skillGrowth / 100 * (lvl - 1))
			this.speedGrowth = 60
			this.speed = 15 + Math.round(this.speedGrowth / 100 * (lvl - 1))
			this.weapon = ['Claws', 'Adamant']
			this.inventory = [this.weapon]
			this.maxHealth = 40 + Math.round(this.healthGrowth / 100 * (lvl - 1))
			this.health = this.maxHealth
			this.weaponRange = 1
			surprises.push(this)
			allEnemies.push(this)
			allObjects.push(allEnemies[allEnemies.length - 1])
			this.num  = allEnemies.length
		}
		getSkill (num) {
			return this.skill
		}
		getArmor (num) {
			return this.armor[num]
		}
		getWeapon (num) {
			return this.weapon[num]
		}
		armorSum () {
			return ARMORBLOCK[this.getArmor(0)] + ARMORBLOCK[this.getArmor(1)] + ARMORBLOCK[this.getArmor(2)] + ARMORBLOCK[this.getArmor(3)]
		}
		armorWeightSum () {
			return ARMORWEIGHT[this.getArmor(0)] + ARMORWEIGHT[this.getArmor(1)] + ARMORWEIGHT[this.getArmor(2)] + ARMORWEIGHT[this.getArmor(3)]
		}
		getActiveSkill () {
			return this.skill
		}
		paint () {
			ctx.fillStyle = '#400060'
			ctx.fillRect(this.x * pSize, this.y * pSize, pSize, pSize)
			ctx.fillStyle = '#c00020'
			ctx.fillText(this.letter, (this.x + 1 / 5) * pSize, (this.y + 3 / 4) * pSize)
		}
		getWeight () {
			let mass = this.con + this.armorWeightSum()
			if (this.weapon) mass += weight[WEAPON[this.getWeapon(0)] - 1][MATERIAL[this.getWeapon(1)] - 1]
			if (this.shield) mass += weight[1][MATERIAL[this.shield] - 1]
			return mass
		}
		recover () {
			this.health += this.maxHealth / 4
			this.health = Math.round(this.health)
			if (this.health > this.maxHealth) this.health = this.maxHealth
		}
		attacking () {
			const range = this.move + this.weaponRange
			let inRange = []
			for (const p of attackables) {
				if (Math.abs(this.x - p.x) + Math.abs(this.y - p.y) <= range) inRange.push(p)
			}
			for (let i = 0; i < attackables.length; ++i) {
				if (!attackables[i].player && !attackables[i].neutral) attackables.splice(i, 1)
			}
			if (inRange.length) {
				
				// go for the weakest enemy
				inRange.sort((a, b) => (a.defense + a.armorSum() - b.defense - b.armorSum()))
			}
			
			return inRange
		}
		targetting () {
			let itself = this
			
			// figure out if a player is in range of the enemy
			const range = this.move + this.weaponRange
			let inRange = []
			for (const p of attackables) {
				if ((Math.abs(this.x - p.x) + Math.abs(this.y - p.y) <= range) && p.health > 0) inRange.push(p)
			}
			for (let i = attackables.length - 1; i >= 0; --i) {
				if (!attackables[i].player && !attackables[i].neutral) attackables.splice(i, 1)
			}
			if (inRange.length) {
				
				// go for the weakest enemy
				inRange.sort((a, b) => (a.defense - b.defense))
				for (let i = inRange.length - 1; i >= 0; --i) {
					if (this.weaponRange >= 1 && this.strength + might[WEAPON[this.weapon[0]] - 1][MATERIAL[this.weapon[1]] - 1] - inRange[i].defense - inRange[i].armorSum() <= 0) inRange.splice(i, 1)
				}
			}
			
			// go for the closest enemy
			let enemies = attackables.slice()
			for (let i = enemies.length - 1; i > 0; --i) {
				if ((!enemies[i].player && !enemies[i].neutral) || enemies[i].health <=0) enemies.splice(i, 1)
				if (this.weaponRange > 1 && this.strength + might[WEAPON[this.weapon[0]] - 1][MATERIAL[this.weapon[1]] - 1] - enemies[i].defense - enemies[i].armorSum() <= 0) enemies.splice(i, 1)
			}
			enemies.sort((a, b) => Math.abs(itself.x - a.x) + Math.abs(itself.y - a.y) - Math.abs(itself.x - b.x) - Math.round(itself.y - b.y))
			let stableWalls = breakableWalls.slice()
			for (let i = stableWalls.length - 1; i >= 0; --i) {
				if (stableWalls[i].health <= 0) stableWalls.splice(i, 1)
			}
			let stableRespawners = playerRespawners.slice()
			for (let i = 0; i < stableRespawners.length; ++i) {
				if (stableRespawners[i].health <= 0) stableRespawners.splice(i, 1)
			}
			return [stableRespawners, stableWalls, [inRange, enemies]]
		}
		pathFinding (map) {
			let start = map.grid[this.x][this.y]
			let picked = 0
			let pickedPath
			const range = this.move + this.weaponRange
			
			// check each target
			let targets = this.targetting()
			let possiblePaths = Array(targets.length).fill([])
			possiblePaths[2] = Array(targets[2].length).fill([])
			
			targets[0].forEach(target => {
				
				// check target priority 1
				map.grid[target.x][target.y].weight = 1
				let pathValid = false
				while (!pathValid) {
					const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
					pathValid = true
					for (const enemy of allEnemies) {
						if (possiblePath.length !== 0 && enemy !== this) {
							/* case 1: within range and weaponRange === 1, check 1 away
							   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
							   case 3: longer than 2
							*/
							
							if (possiblePath.length < range && this.weaponRange === 1 && possiblePath.length > 1) {
								if (possiblePath[possiblePath.length - 2].x === enemy.x && possiblePath[possiblePath.length - 2].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (this.weaponRange > 1 && possiblePath.length > 2 && possiblePath.length < this.move + 2) {
								if (possiblePath[possiblePath.length - 3].x === enemy.x && possiblePath[possiblePath.length - 3].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (possiblePath.length > 2 && possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
								map.grid[enemy.x][enemy.y].weight = 0
								pathValid = false
							}
						}
					}
				}
				const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
				for (const enemy of allEnemies) {
					map.grid[enemy.x][enemy.y].weight = 1
				}
				if (possiblePath.length !== 0) {
					if (possiblePath.length - 1 <= range) {
						pickedPath = possiblePath
						picked = target
					} else possiblePaths[0].push(possiblePath)
				}
				map.grid[target.x][target.y].weight = 0
			})
			
			targets[1].forEach(target => {
				
				// check target priority 1
				map.grid[target.x][target.y].weight = 1
				let pathValid = false
				while (!pathValid) {
					const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
					pathValid = true
					for (const enemy of allEnemies) {
						if (possiblePath.length !== 0 && enemy !== this) {
							/* case 1: within range and weaponRange === 1, check 1 away
							   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
							   case 3: longer than 2
							*/
							
							if (possiblePath.length < range && this.weaponRange === 1 && possiblePath.length > 1) {
								if (possiblePath[possiblePath.length - 2].x === enemy.x && possiblePath[possiblePath.length - 2].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (this.weaponRange > 1 && possiblePath.length > 2 && possiblePath.length < this.move + 2) {
								if (possiblePath[possiblePath.length - 3].x === enemy.x && possiblePath[possiblePath.length - 3].y === enemy.y) {
									map.grid[enemy.x][enemy.y].weight = 0
									pathValid = false
								}
							} else if (possiblePath.length > 2 && possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
								map.grid[enemy.x][enemy.y].weight = 0
								pathValid = false
							}
						}
					}
				}
				const possiblePath = astar.search(map, start, map.grid[target.x][target.y])
				for (const enemy of allEnemies) {
					map.grid[enemy.x][enemy.y].weight = 1
				}
				if (possiblePath.length !== 0) {
					if (possiblePath.length - 1 <= range) {
						pickedPath = possiblePath
						picked = target
					} else possiblePaths[1].push(possiblePath)
				}
				map.grid[target.x][target.y].weight = 0
			})
			
			targets[2].forEach((targetList, j) => {
				for (let i = 0; i < targetList.length && !picked; ++i) {
					
					// check target priority 0
					map.grid[targetList[i].x][targetList[i].y].weight = 1
					let pathValid = false
					while (!pathValid) {
						const possiblePath = astar.search(map, start, map.grid[targetList[i].x][targetList[i].y])
						pathValid = true
						for (const enemy of allEnemies) {
							if (possiblePath.length !== 0 && enemy !== this) {
								/* case 1: within range and weaponRange === 1, check 1 away
								   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
								   case 3: longer than 2
								*/
								
								if (targetList[i].player || targetList[i].neutral) {
									if (possiblePath.length <= range && possiblePath.length > 1 && this.weaponRange === 1) {
										if (possiblePath[possiblePath.length - 2].x === enemy.x && possiblePath[possiblePath.length - 2].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									} else if (this.weaponRange > 1 && possiblePath.length > 2 && possiblePath.length <= this.move + 2) {
										if (possiblePath[possiblePath.length - 3].x === enemy.x && possiblePath[possiblePath.length - 3].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									} else if (possiblePath.length > 2) {
										if (possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									}
								} else {
									if (possiblePath.length <= this.move) {
										if (possiblePath[possiblePath.length - 1].x === enemy.x && possiblePath[possiblePath.length - 1].y === enemy.y) {
											map.grid[enemy.x][enemy.y].weight = 0
											pathValid = false
										}
									} else if (possiblePath[this.move - 1].x === enemy.x && possiblePath[this.move - 1].y === enemy.y) {
										map.grid[enemy.x][enemy.y].weight = 0
										pathValid = false
									}
								}
							}
						}
					}
					
					const possiblePath = astar.search(map, start, map.grid[targetList[i].x][targetList[i].y])
					for (const enemy of allEnemies) {
						map.grid[enemy.x][enemy.y].weight = 1
					}
					if (possiblePath.length !== 0) {
						if (possiblePath.length - 1 <= range) {
							pickedPath = possiblePath
							picked = targetList[i]
						} else possiblePaths[2][j][i] = possiblePath
					}
					map.grid[targetList[i].x][targetList[i].y].weight = 0
				}
			})
			
			if (!pickedPath) {
				pickedPath = possiblePaths[0][0]
				if (!pickedPath) {
					pickedPath = possiblePaths[1][0]
				}
				if (!pickedPath) {
					possiblePaths[2].forEach(pathGroup => {
						pathGroup.sort((a, b) => a.length - b.length)
					})
					for (let i = 0; i < possiblePaths[2].length && !pickedPath; ++i) {
						pickedPath = possiblePaths[2][i][0]
					}
				}
			}
			
			if (pickedPath && pickedPath.length <= range && (picked.player || picked.neutral || picked.ids[0] === 'wall' || picked.ids[0] === 'respawner')) {
				/* case 1: within range and weaponRange === 1, check 1 away
				   case 2: longer than 2 && within move + 2 and weaponRange > 1, check 2 away
				   case 3: longer than 2
				*/
				if (this.weaponRange === 1 && pickedPath.length > 1) {
					this.x = pickedPath[pickedPath.length - 2].x
					this.y = pickedPath[pickedPath.length - 2].y
				} else if (this.weaponRange === 3 && pickedPath.length > 2 && pickedPath.length <= range - 1) {
					this.x = pickedPath[pickedPath.length - 3].x
					this.y = pickedPath[pickedPath.length - 3].y
				} else if (this.weaponRange === 3 && pickedPath.length > 3 && pickedPath.length <= range) {
					this.x = pickedPath[pickedPath.length - 4].x
					this.y = pickedPath[pickedPath.length - 4].y
				} else if (this.weaponRange === 4 && pickedPath.length > 2 && pickedPath.length <= range - 2) {
					this.x = pickedPath[pickedPath.length - 3].x
					this.y = pickedPath[pickedPath.length - 3].y
				} else if (this.weaponRange === 4 && pickedPath.length > 3 && pickedPath.length <= range - 1) {
					this.x = pickedPath[pickedPath.length - 4].x
					this.y = pickedPath[pickedPath.length - 4].y
				} else if (this.weaponRange === 4 && pickedPath.length > 4 && pickedPath.length <= range) {
					this.x = pickedPath[pickedPath.length - 5].x
					this.y = pickedPath[pickedPath.length - 5].y
				} else if (this.weaponRange === 4 && pickedPath.length >= this.move) {
					this.x = pickedPath[this.move - 1].x
					this.y = pickedPath[this.move - 1].y
				}
			} else if (pickedPath && pickedPath.length - 1 <= range && !(picked.player || picked.neutral) && picked.ids[0] !== 'wall' && picked.ids[0] !== 'respawner') {
				this.x = pickedPath[pickedPath.length - 1].x
				this.y = pickedPath[pickedPath.length - 1].y
			} else if (pickedPath) {
				this.x = pickedPath[this.move - 1].x
				this.y = pickedPath[this.move - 1].y
			}
		}
		updateStats () {
			this.healthGrowth = 90
			this.strengthGrowth = 100
			this.strength = 10 + Math.round(this.strengthGrowth / 100 * (this.level - 1))
			this.defenseGrowth = 80
			this.defense = 10 + Math.round(this.defenseGrowth / 100 * (this.level - 1))
			this.skillGrowth = 80
			this.skill = 10 + Math.round(this.skillGrowth / 100 * (this.level - 1))
			this.speedGrowth = 60
			this.speed = 15 + Math.round(this.speedGrowth / 100 * (this.level - 1))
			this.weapon = ['Claws', 'Adamant']
			this.inventory = [this.weapon]
			this.maxHealth = 40 + Math.round(this.healthGrowth / 100 * (this.level - 1))
			this.health = this.maxHealth
		}
	}
	
	let goblin1 = new Hostile(1, 1)
	let goblin2 = new Hostile(1, 1)
	
	let allNeutrals = []
	allNeutrals.push(new Neutral('Merchant'))
	allObjects.push(allNeutrals[0])
	allNeutrals.push(new Neutral('Merchant'))
	allObjects.push(allNeutrals[1])
	allObjects.push(breakableWalls)
	allObjects.push(playerRespawners)
	allObjects = allObjects.flat()
	
	let attackables = []
	allPlayers.forEach(e => {
		attackables.push(e)
	})
	allNeutrals.forEach(e => {
		attackables.push(e)
	})
	breakableWalls.forEach(e => {
		attackables.push(e)
	})
	playerRespawners.forEach(respawner => {
		attackables.push(respawner)
	})
	
	let inRange = []
	
	let selected = 0
	let battleSelect = 0
	let healSelect = 0
	let tradeSelect = 0
	let battling = false
	let healing
	let enemyLevel = 1
	let enemyCountDown = Array(enemyLatency).fill(0)
	let raidCountDown = Array(enemyLatency).fill(0)
	let siegeCountDown = Array(enemyLatency).fill(0)
	let enemyChance = 5
	let raidChance = 2
	let siegeChance = 1 / 2
	let enemyDifficulty = 1
	let autoEnemyDifficulty = 0
	let enemyMaterial = 1
	let newWeaponLevel = 50
	
	let beganSurprise = false
	let surprised = false
	
	// armor indice - armor part
	const armorPart = ['Helmet', 'Chestplate', 'Leggings', 'Boots']
	
	// weapon stats: [[bronze, iron, steel, adamant]sword, [bronze, iron, steel, adamant]lance, [bronze, iron, steel, adamant]axe, [bronze, iron, steel, adamant]bow]
	// weapon data
	
	const might = {
		0: {0: 3, 1: 5, 2: 7, 3: 9},
		1: {0: 4, 1: 6, 2: 9, 3: 12},
		2: {0: 6, 1: 9, 2: 12, 3: 15},
		3: {0: 3, 1: 5, 2: 8, 3: 11, 5: 12},
		4: {4: 0},
		5: {5: 0},
		9: {3: 20}
	}
	const hit = {
		0: {0: 90, 1: 85, 2: 85, 3: 95},
		1: {0: 80, 1: 80, 2: 85, 3: 90},
		2: {0: 75, 1: 70, 2: 75, 3: 85},
		3: {0: 85, 1: 75, 2: 85, 3: 90, 5: 110},
		4: {4: 0},
		5: {5: 0},
		9: {3: 120}
	}
	const Crit = [[5, 10, 15, 30], [0, 5, 10, 20], [0, 5, 5, 10], [0, 5, 10, 20, 0, 10], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]
	const crit = {
		0: {0: 5, 1: 10, 2: 15, 3: 30},
		1: {0: 0, 1: 5, 2: 10, 3: 20},
		2: {0: 0, 1: 5, 2: 5, 3: 10},
		3: {0: 0, 1: 5, 2: 10, 3: 20, 5: 10},
		4: {4: 0},
		5: {5: 0},
		9: {3: -10}
	}
	const Weight = [[1, 2, 3, 2], [4, 6, 6, 5], [6, 8, 10, 8], [3, 4, 5, 3, 0, 10], [0, 4, 4, 4, 4], [0, 0, 0, 0, 0, 0]]
	const weight = {
		0: {0: 1, 1: 2, 2: 3, 3: 2},
		1: {0: 4, 1: 6, 2: 6, 3: 5},
		2: {0: 6, 1: 8, 2: 10, 3: 8},
		3: {0: 3, 1: 4, 2: 5, 3: 3, 5: 10},
		4: {4: 4},
		5: {5: 0},
		9: {3: 10}
	}
	const weaponEffective = {
		0: {0: '', 1: '', 2: '', 3: ''},
		1: {0: '', 1: '', 2: '', 3: ''},
		2: {0: '', 1: '', 2: '', 3: ''},
		3: {0: 'Flying', 1: 'Flying', 2: 'Flying', 3: 'Flying', 5: 'Flying'},
		4: {4: ''},
		5: {5: ''},
		9: {3: ''}
	}
	const weaponValue = {
		0: 100,
		1: 300,
		2: 900,
		3: 2250,
		4: 100,
		5: 0,
		'-': 'unsellable'
	}
	
	const armorValue = {
		0: 160,
		1: 480,
		2: 1000,
		3: 2700,
		4: 0,
		5: 0,
		'-': 'unsellable'
	}
	
	// stockpiles
	class Stockpile {
		constructor (X, Y, OWNER) {
			this.x = X
			this.y = Y
			this.ids = ['stockpile']
			this.name = OWNER.name
			this.letter = OWNER.letter
			this.gold = 0
			this.inventory = []
			this.shieldInv = 0
			this.armorInv = ['No', 'No', 'No', 'No']
			this.playerOwned = OWNER.player
			OWNER.stockpile = this
		}
		getArmor (num) {
			return this.armorInv[num]
		}
		paint () {
			ctx.fillStyle = '#804020'
			ctx.fillRect(this.x * pSize, this.y * pSize, pSize, pSize)
			ctx.fillStyle = '#f0f000'
			ctx.fillText(this.letter, (this.x + 1 / 4) * pSize, (this.y + 3 / 4) * pSize)
		}
	}
	
	const getOwnerByName = (name) => {
		
	}
	
	let stockpiles = []
	stockpiles.push(new Stockpile (5, 8, playerCC))
	stockpiles.push(new Stockpile (4, 15, playerCL))
	stockpiles.push(new Stockpile (5, 14, playerTG))
	stockpiles.push(new Stockpile (5, 10, playerTT))
	stockpiles.push(new Stockpile (4, 12, playerNS))
	stockpiles.push(new Stockpile (27, 2, allNeutrals[0]))
	
	const getTotalWealth = () => {
		let wealth = 0
		for (const p of allPlayers) {
			wealth += p.gold
			wealth += weaponValue[MATERIAL[p.shieldInv] - 1]
			for (const i of p.inventory) {
				wealth += weaponValue[MATERIAL[i[1]] - 1]
			}
			for (const a of p.armor) {
				wealth += armorValue[MATERIAL[a] - 1]
			}
		}
		for (const s of stockpiles) {
			if (s.playerOwned) {
				wealth += s.gold * 0.8
				for (const i of s.inventory) {
					wealth += weaponValue[MATERIAL[i[1]] - 1] / 2
				}
				wealth += weaponValue[MATERIAL[s.shieldInv] - 1] / 2
			}
		}
		return wealth
	}
	const getHighestWealth = () => {
		let wealth = 0
		for (const p of allPlayers) {
			playerWealth = 0
			playerWealth += p.gold
			playerWealth += weaponValue[MATERIAL[p.shieldInv] - 1]
			for (const i of p.inventory) {
				playerWealth += weaponValue[MATERIAL[i[1]] - 1]
			}
			for (const a of p.armor) {
				playerWealth += armorValue[MATERIAL[a] - 1]
			}
			if (p.stockpile !== undefined) {
				playerWealth += p.stockpile.gold * 0.8
				for (const i of p.stockpile.inventory) {
					playerWealth += weaponValue[MATERIAL[i[1]] - 1] / 2
				}
				playerWealth += weaponValue[MATERIAL[p.stockpile.shieldInv] - 1] / 2
			}
			if (playerWealth > wealth) {
				wealth = playerWealth
			}
		}
		return wealth
	}
	const getWealthOrder = () => {
		let wealthOrder = []
		for (const p of allPlayers) {
			playerWealth = 0
			playerWealth += p.gold
			playerWealth += weaponValue[MATERIAL[p.shieldInv] - 1]
			for (const i of p.inventory) {
				playerWealth += weaponValue[MATERIAL[i[1]] - 1]
			}
			for (const a of p.armor) {
				playerWealth += armorValue[MATERIAL[a] - 1]
			}
			if (p.stockpile !== undefined) {
				playerWealth += p.stockpile.gold * 0.8
				for (const i of p.stockpile.inventory) {
					playerWealth += weaponValue[MATERIAL[i[1]] - 1] / 2
				}
				playerWealth += weaponValue[MATERIAL[p.stockpile.shieldInv] - 1] / 2
			}
			wealthOrder.push(playerWealth)
		}
		wealthOrder.sort((a, b) => b - a)
		return wealthOrder
	}
	const getEnemyMaterial = () => {
		const wealth = getHighestWealth()
		if (wealth < 150) return 1
		else if (wealth < 980) return Math.log(wealth / 150) / Math.log(980 / 150) + 1
		else if  (wealth < 2580) return Math.log(wealth / 980) / Math.log(2580 / 980) + 2
		else if (wealth < 7630) return Math.log(wealth / 2580) / Math.log(7630 / 2580) + 3
		else return 4
	}
	class Colliseum {
		constructor (X, Y) {
			this.x = X
			this.y = Y
		}
		spawnEnemy (player) {
			bowChance += 4
			sword2Chance = 12.5
			mercChance = 25
			lance2Chance = 37.5
			cavalierChance = 50
			warriorChance = 62.5
			armorChance = 75
			sniperChance = 87.5
			nomadChance = 100
			
			let hostile = new Hostile (player.level, enemyMaterial)
			hostile.y = this.y - 1
			hostile.x = this.x - 1
			hostile.gold *= 3
			hostile.arena = true
			bowChance -= 4
			sword2Chance = 11.5
			mercChance = 23
			lance2Chance = 34.5
			cavalierChance = 46
			warriorChance = 57.5
			armorChance = 69
			sniperChance = 80.5
			nomadChance = 92
			mountedTrollChance = 96
		}
		paint () {
			ctx.fillStyle = '#ffff00'
			ctx.fillRect(this.x * pSize, this.y * pSize, pSize, pSize)
			ctx.fillStyle = '#ff0000'
			ctx.fillText('A', (this.x + 1 / 6) * pSize, (this.y + 3 / 4) * pSize)
		}
	}
	let colliseum = new Colliseum (17, 26)
	
	const buildBoard = () => {
		let board = Array(900 / pSize).fill().map(() => Array(450 / pSize).fill(1))
		walls.forEach(e => {
			e.points().forEach(c => {
				board[c[0]][c[1]] = 0
			})
		})
		breakableWalls.forEach(e => {
			if (e.health > 0) board[e.x][e.y] = 0
		})
		doors.forEach(e => {
			if (e.points()) {
				e.points().forEach(c => {
					board[c[0]][c[1]] = 0
				})
			}
		})
		board[colliseum.x][colliseum.y] = 0
		allPlayers.forEach(e => {
			if (board[e.x] !== undefined) board[e.x][e.y] = 0
		})
		allNeutrals.forEach(e => {
			if (board[e.x] !== undefined) board[e.x][e.y] = 0
		})
		return board
	}
	
	// inputs
	let keys = {'w': false, 's': false, 'a': false, 'd': false, ' ': false, 'l': false, 'k': false, 'i': false, 'j': false, 'u': false, 'o': false, 'p': false, 'q': false, '!': false, '<': false, '>': false, '+': false, '-': false}
	let keyWentDown = {'l': false, 'k': false, 'i': false, 'j': false, 'u': false, 'o': false, 'p': false, 'q': false, ' ': false, '<': false, '>': false, '+': false}
	let numKeys = {1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 0: false}
	document.addEventListener('keypress', e => {
		const key = e.key
		if (keys.hasOwnProperty(key)) {
			const keyPast = keys[key]
			keys[key] = true
			if (keyWentDown.hasOwnProperty(key)) {
				keyWentDown[key] = 1 - keyPast
			}
		}
		if (numKeys.hasOwnProperty(key)) numKeys[key] = true
	})
	document.addEventListener('keyup', e => {
		const key = e.key
		if (keys.hasOwnProperty(key)) keys[key] = false
		if (keyWentDown.hasOwnProperty(key)) keyWentDown[key] = false
		if(numKeys.hasOwnProperty(key)) numKeys[key] = false
	})
	const getDPad = () => {
		return [(keys['d'] - keys['a']) * 0.9, (keys['s'] - keys['w']) * 0.9]
	}
	const getButtons = () => {
		return [keyWentDown['l'], keyWentDown['k'], keyWentDown['i'] - keyWentDown['j'], keyWentDown['u'], keyWentDown['o'], keyWentDown['>'] - keyWentDown['<'], keyWentDown['+'], keys['+'], -keys['-']]
	}
	
	window.writeAlerts = (content) => {
		alerts.textContent += content
	}
	
	const selecter = (objects) => {
		for (let i = 0; i < objects.length; i++) {
			// if (rounded mouse coordinates === object coordinates)
			if (!selected) previousSelected = {'x': Math.round(mouseX - 0.5), 'y': Math.round(mouseY - 0.5)}
			if (Math.round(mouseX - 0.5) === objects[i]['x'] && Math.round(mouseY - 0.5) === objects[i]['y'] && selected !== objects[i]) {
				if (keyWentDown['l'] && !objects[i].ids.includes('wall') && !objects[i].ids.includes('respawner')) {
					if (enemyPhase && objects[i].player) {
						cheatCount.movingWrongPhase += 1
						cheatCount.cheatAlert('movingWrongPhase')
					}
					if (objects[i].hostile) {
						cheatCount.tampering += 1
						cheatCount.cheatAlert('tampering')
					}
					if (objects[i].health <= 0) {
						cheatCount.controllingDead += 1
						cheatCount.cheatAlert('controllingDead')
					}
					if (!objects[i].uninvitedGuest) {
						selected = objects[i]
						keyWentDown['l'] = 0
					}
				}
				ctx.fillStyle = '#ffffff'
				ctx.fillText(objects[i]['name'], 370, 550)
				if (objects[i].ids[0] !== 'wall' && objects[i].ids[0] !== 'respawner') {
					if (objects[i].level) ctx.fillText('Level: ' + objects[i].level, 50, 575)
					ctx.fillText('Health: ' + objects[i].health + ' / ' + objects[i].maxHealth, 50, 600)
					if (objects[i].magic === undefined) ctx.fillText('Strength: ' + objects[i].strength, 50, 625)
					else ctx.fillText('Magic: ' + objects[i].magic, 50, 625)
					ctx.fillText('Defense: ' + objects[i].defense, 50, 650)
					ctx.fillText('Speed: ' + objects[i].speed, 50, 825)
					ctx.fillText('Skill Total: ' + objects[i].getSkill(0), 50, 675)
					ctx.fillText('Sword Skill: ' + objects[i].getSkill(1), 50, 700)
					ctx.fillText('Lance Skill: ' + objects[i].getSkill(2), 50, 725)
					ctx.fillText('Axe Skill: ' + objects[i].getSkill(3), 50, 750)
					ctx.fillText('Bow Skill: ' + objects[i].getSkill(4), 50, 775)
					ctx.fillText('Shield Skill: ' + objects[i].getSkill(5), 50, 800)
					if (objects[i].exp) ctx.fillText('Exp: ' + objects[i].exp + ' / 100', 50, 850)
					ctx.fillText('Weapons', 360, 575)
					if (objects[i].weapon && WEAPON[objects[i].getWeapon(0)]) ctx.fillText(objects[i].getWeapon(1) + ' ' + objects[i].getWeapon(0), 335, 600)
					if (objects[i].shield !== 0) ctx.fillText(objects[i].shield + ' Shield', 335, 600 + 25 * (objects[i].getWeapon(0) !== 0))
					ctx.fillText('Inventory', 350 - 5, 650)
					ctx.fillText('Gold: ' + objects[i].gold, 350, 675)
					for (let j = 0; j < objects[i].inventory.length; j++) {
						ctx.fillText(objects[i].inventory[j][1] + ' ' + objects[i].inventory[j][0], 335, 700 + 25 * j)
					}
					if(objects[i].shieldInv) ctx.fillText(objects[i].shieldInv + ' Shield', 335, 700 + 25 * objects[i].inventory.length)
					if (objects[i].prfWeapon && objects[i].level < newWeaponLevel) {
						ctx.fillText('Unlock at ' + newWeaponLevel + ':', 335, 700 + 25 * (objects[i].inventory.length + !!objects[i].shieldInv))
						ctx.fillText(objects[i].prfWeapon[1], 335, 700 + 25 * (objects[i].inventory.length + !!objects[i].shieldInv + 1))
					} else if (objects[i].prfWeapon) ctx.fillText(objects[i].prfWeapon[1], 335, 700 + 25 * (objects[i].inventory.length + !!objects[i].shieldInv))
					ctx.fillText('Armor', 650, 575)
					for (let j = 0; j < 4; j++) {
						ctx.fillText(objects[i].getArmor(j) + ' ' + armorPart[j], 635, 600 + 25 * j)
					}
				} else if (objects[i].health > 0) {
					ctx.fillText('Health: ' + objects[i].health + ' / ' + objects[i].maxHealth, 360, 600)
				}
			}
			if (selected === objects[i]) {
				// inventory manager
				if (objects[i].player && !trading) {
					for (let j = 1; j <= objects[i].inventory.length; j++) {
						if (numKeys[j]) objects[i].weapon = objects[i].inventory[j - 1]
					}
					if (numKeys[0] && objects[i].shieldInv) {
						if (!objects[i].shield) objects[i].shield = objects[i].shieldInv
						else objects[i].shield = 0
					}
					if (keys['!'] && objects[i].level >= newWeaponLevel) objects[i].weapon = objects[i].prfWeapon
					if (objects[i].weapon[0] !== 'Bow') objects[i].weaponRange = 1
					else if (objects[i].ids.includes('Range')) objects[i].weaponRange = 4
					else objects[i].weaponRange = 3
				}
				
				// promotions manager
				if (objects[i].player && objects[i].level >= 20 && !objects[i].promoted && promotions) objects[i].promoting()
				
				// deselecter
				
				// walls, doors and breakable walls interactions
				let traversible = 1
				for (let k = 0; k < walls.length; k++) {
					if (Math.round(mouseX - 0.5) * pSize >= walls[k].x && Math.round(mouseX - 0.5) * pSize <= walls[k].x + walls[k].length - pSize) {
						if (Math.round(mouseY - 0.5) * pSize >= walls[k].y && Math.round(mouseY - 0.5) * pSize <= walls[k].y + walls[k].width - pSize) traversible = 0
					}
				}
				doors.forEach(e => {
					if (!e.isOpen) {
						if (e.axis === 'x') {
							if (Math.round(mouseX - 0.5) * pSize >= e.x && Math.round(mouseX - 0.5) * pSize <= e.x + e.length && Math.round(mouseY - 0.5) * pSize === e.y) traversible = 0
						} else if (Math.round(mouseY - 0.5) * pSize >= e.y && Math.round(mouseY - 0.5) * pSize <= e.y + e.length && Math.round(mouseX - 0.5) * pSize === e.x) traversible = 0
					}
				})
				breakableWalls.forEach(e => {
					if (e.health > 0) {
						if (e.x === Math.round(mouseX - 0.5) && e.y === Math.round(mouseY - 0.5)) traversible = 0
					}
				})
				if (colliseum.x === Math.round(mouseX - 0.5) && colliseum.y === Math.round(mouseY - 0.5)) traversible = 0
				
				if (traversible !== 0) {
					[objects[i].x, objects[i].y] = [Math.round(mouseX - 0.5), Math.round(mouseY - 0.5)]
					if (keyWentDown['l']) {
						selected = 0
						keyWentDown['l'] = 0
					}
				}
			}
		}
	}
	const battleCheck = (object, adversaries) => {
		
		// preparing for tile induced weapon modifiers
		const weapon = object.weapon
		ballistas.forEach(e => {
			if (e.x === object.x && e.y === object.y) {
				object.weapon = ['Ballista', 'Wooden']
				object.weaponRange = 12
			}
		})
		
		// determine who is in range
		const length = inRange.length
		for (let i = 0; i < length; i++) inRange.shift()
		for (let i = 0; i < adversaries.length; i++) {
			if ((Math.abs(object.x - adversaries[i].x) + Math.abs(object.y - adversaries[i].y)) <= object.weaponRange) {
				inRange[inRange.length] = adversaries[i]
				inRange[inRange.length - 1].index = i
				inRange[inRange.length - 1].dist = Math.abs(object.x - adversaries[i].x) + Math.abs(object.y - adversaries[i].y)
			}
		}
		if (inRange.length) {
			battling = true
			
			// preparing for tile induced weapon and stat modifiers
			const defense1 = object.defense
			forts.forEach(e => {
				if (e.x === object.x && e.y === object.y) object.defense += 2
			})
			for (const e of pillars) {
				if (e.x === object.x && e.y === object.y) object.defense += 1
			}
			let opponent = inRange[battleSelect % inRange.length]
			
			// figure out if it's an arena battle
			const isArenaBattle = object.arena || opponent.arena
			
			const defense2 = opponent.defense
			forts.forEach(e => {
				if (e.x === opponent.x && e.y === opponent.y) opponent.defense += 2
			})
			for (const e of pillars) {
				if (e.x === opponent.x && e.y === opponent.y) object.defense += 1
			}
			
			// initialize battle variables
			let objectEffective = 1
			let objectWeaponEffective = 1
			for (const id of opponent.ids) {
				if (object.effective === id) objectEffective *= Math.sqrt(2)
				if (weaponEffective[WEAPON[object.weapon[0]] - 1][MATERIAL[object.weapon[1] - 1]] === id) objectWeaponEffective *= Math.sqrt(2)
			}
			const objectAttack = Math.round(object.strength + might[WEAPON[object.weapon[0]] - 1][MATERIAL[object.weapon[1]] - 1] * objectEffective * objectWeaponEffective) - opponent.defense - opponent.armorSum()
			let objectHit
			let objectShieldChance
			let objectShieldStrength
			let opponentAttack
			if (opponent.weapon) opponentAttack = opponent.strength + might[WEAPON[opponent.weapon[0]] - 1][MATERIAL[opponent.weapon[1]] - 1] - object.defense - object.armorSum()
			else opponentAttack = 0
			let opponentHit
			let opponentShieldChance
			let opponentShieldStrength
			const objectCrit = object.getActiveSkill() + crit[WEAPON[object.getWeapon(0)] - 1][MATERIAL[object.getWeapon(1)] - 1] - opponent.armorSum()
			let opponentCrit
			if (opponent.weapon) opponentCrit = opponent.getActiveSkill() + crit[WEAPON[opponent.getWeapon(0)] - 1][MATERIAL[opponent.getWeapon(1)] - 1] - object.armorSum() * 2
			else opponentCrit = 0
			
			// print (also modify a few) object battle variables
			ctx.fillStyle = '#ffffff'
			ctx.fillText(object.name, 250, 550)
			ctx.fillText('Health: ' + object.health + ' / ' + object.maxHealth, 200, 575)
			if (object.speed * object.con / object.getWeight() - opponent.speed * opponent.con / opponent.getWeight() < 4 || object.weapon[0] === 'Ballista') ctx.fillText('Attack: ' + objectAttack, 200, 600)
			else ctx.fillText('Attack: ' + objectAttack + ' x 2', 200, 600)
			if (object.weaponRange === 1) {
				objectHit = Math.round(10 * (hit[WEAPON[object.getWeapon(0)] - 1][MATERIAL[object.getWeapon(1)] - 1] + object.getSkill(0) + object.getActiveSkill() - opponent.speed * opponent.con / (opponent.getWeight()))) / 10
			} else if (object.weaponRange === 3 || object.weaponRange === 4) {
				objectHit = 2 * Math.round(10 / opponent.dist * (hit[WEAPON[object.getWeapon(0)] - 1][MATERIAL[object.getWeapon(1)] - 1] + object.getSkill(0) + object.getActiveSkill() - opponent.speed * opponent.con / (opponent.getWeight()))) / 10
			} else {
				objectHit = Math.round(10 * (hit[WEAPON[object.getWeapon(0)] - 1][MATERIAL[object.getWeapon(1)] - 1] + object.getSkill(0) + object.getActiveSkill() - opponent.speed * opponent.con / (opponent.getWeight()) - opponent.dist * 5)) / 10
			}
			
			// avoid modifier
			for (const e of pillars) {
				if (e.x === opponent.x && e.y === opponent.y) objectHit -= 20
			}
			ctx.fillText('Hit: ' + Math.round(10 * objectHit) / 10, 200, 625)
			if (object.shield) {
				objectShieldStrength = might[0][MATERIAL[object.shield] - 1] + 1
				objectShieldChance = Math.round(10 * (3 * object.getSkill(5) - opponent.getActiveSkill() / 3)) / 10
				ctx.fillText('Shield Strength: ' + objectShieldStrength, 200, 650)
				ctx.fillText('Shield Chance: ' + objectShieldChance, 200, 675)
			}
			ctx.fillText('Critical: ' + (object.getActiveSkill() + crit[WEAPON[object.getWeapon(0)] - 1][MATERIAL[object.getWeapon(1)] - 1] - opponent.armorSum()), 200, 700)
			
			// print (and modify a few) opponent battle variables
			ctx.fillText(inRange[battleSelect % inRange.length].name, 550, 550)
			ctx.fillText('Health: ' + opponent.health + ' / ' + opponent.maxHealth, 500, 575)
			if (opponent.dist <= opponent.weaponRange) {
				if (opponent.speed * opponent.con / opponent.getWeight() - object.speed * object.con / object.getWeight() < 4) ctx.fillText('Attack: ' + opponentAttack, 500, 600)
					else ctx.fillText('Attack: ' + opponentAttack + ' x 2', 500, 600)
				if (opponent.weaponRange === 1) {
					opponentHit = Math.round(10 * (hit[WEAPON[opponent.getWeapon(0)] - 1][MATERIAL[opponent.getWeapon(1)] - 1] + opponent.getSkill(0) + opponent.getActiveSkill() - object.speed * object.con / (object.getWeight()))) / 10
				} else {
					opponentHit = 2 * Math.round(10 / opponent.dist * (hit[WEAPON[opponent.getWeapon(0)] - 1][MATERIAL[opponent.getWeapon(1)] - 1] + opponent.getSkill(0) + opponent.getActiveSkill() - object.speed * object.con / (object.getWeight()))) / 10
				}
				
				// avoid modifier
				for (const e of pillars) {
					if (e.x === object.x && e.y === object.y) opponentHit -= 20
				}
				ctx.fillText('Hit: ' + Math.round(10 * opponentHit) / 10, 500, 625)
				if (opponent.shield) {
					opponentShieldStrength = might[0][MATERIAL[opponent.shield] - 1] + 1
					opponentShieldChance = Math.round(10 * (3 * opponent.getSkill(5) - object.getActiveSkill() / 3)) / 10
					ctx.fillText('Shield Strength: ' + opponentShieldStrength, 500, 650)
					ctx.fillText('Shield Chance: ' + opponentShieldChance, 500, 675)
				}
				if (opponent.weapon) ctx.fillText('Critical: ' + opponentCrit, 500, 700)
			}
			
			// initiate battle
			if (keyWentDown['k'] || enemyAttacking) {
				
				// clear text
				alerts.textContent = ''
				
				// anti-cheat
				if (object.player && object.attacked) {
					cheatCount.overMoving += 1
					cheatCount.cheatAlert('overMoving')
				} else if (object.player && !opponent.arena) {
					object.attacked = true
				}
				
				if (!opponent.ids.includes('wall') && !opponent.ids.includes('respawner')) {
					// object first attack
					let objectDamage = objectAttack
					let opponentDamage = opponentAttack
					if (Math.random() * 100 <= objectHit) {
						if (opponent.shield && Math.random() * 100 <= opponentShieldChance) {
							objectDamage -= opponentShieldStrength
							writeAlerts(opponent.name + ' shielded! ')
						}
						if (Math.random() * 100 <= objectCrit) {
							objectDamage *= 3
							writeAlerts(object.name + ' landed a crit! ')
						}
						if (objectDamage >= 0) opponent.health -= objectDamage
						else writeAlerts(object.name + ' did no damage! ')
					} else writeAlerts(object.name + ' missed! ')
				
					// oppponent first attack
					if (opponent.weaponRange >= opponent.dist && opponent.health > 0) {
						if (Math.random() * 100 <= opponentHit ) {
							if (object.shield && Math.random() * 100 <= objectShieldChance) {
								opponentDamage -= objectShieldStrength
								writeAlerts(object.name + ' shielded! ')
							}
							if (Math.random() * 100 <= opponentCrit) {
								opponentDamage *= 3
								writeAlerts(opponent.name + ' landed a crit! ')
							}
							if (opponentDamage >= 0) object.health -= opponentDamage
							else writeAlerts(opponent.name  + ' did no damage! ')
						} else writeAlerts(opponent.name + ' missed! ')
					}
					// object second attack
					if (object.health > 0 && object.weapon[0] !== 'Ballista') {
						if (object.speed * object.con / object.getWeight() - opponent.speed * opponent.con / opponent.getWeight() >= 4) {
							writeAlerts(object.name + ' doubled! ')
							if (Math.random() * 100 <= objectHit) {
								objectDamage = objectAttack
								if (opponent.shield && Math.random() * 100 <= opponentShieldChance) {
									objectDamage -= opponentShieldStrength
									writeAlerts(opponent.name + ' shielded! ')
								}
								if (Math.random() * 100 <= objectCrit) {
									objectDamage *= 3
									writeAlerts(object.name + ' landed a crit! ')
								}
								if (objectDamage >= 0) opponent.health -= objectDamage
								else writeAlerts(object.name + ' did no damage! ')
							} else writeAlerts(object.name + ' missed! ')
						}
					}
				
					// opponent second attack
					if (opponent.weaponRange >= opponent.dist) {
						if (opponent.health > 0) {
							if (opponent.speed * opponent.con / opponent.getWeight() - object.speed * object.con / object.getWeight() >= 4) {
								if (Math.random() * 100 <= opponentHit) {
									opponentDamage = opponentAttack
									writeAlerts(opponent.name + ' doubled! ')
									if (object.shield && Math.random() * 100 <= objectShieldChance) {
										opponentDamage -= objectShieldStrength
										writeAlerts(opponent.name + ' shielded! ')
									}
									if (Math.random() * 100 <= opponentCrit) {
										opponentDamage *= 3
										writeAlerts(opponent.name + ' landed a crit! ')
									}
									if (opponentDamage >= 0) object.health -= opponentDamage
									else writeAlerts(opponent.name + ' did no damage! ')
								} else writeAlerts(opponent.name + ' missed! ')
							}
						}
					}
				// reset stat buffs
				object.defense = defense1
				opponent.defense = defense2
				
				// set up player respawning
				if (object.player && object.health <= 0) object.respawning = true
				else if (opponent.player && opponent.health <= 0) opponent.respawning = true
				
				// experience
					if (object.player) {
						object.exp += Math.round((20 + 30 * (opponent.health <= 0)) * (1 + (opponent.ids.includes('Monster'))) * opponent.level / object.level / (1 + isArenaBattle))
						if (object.exp >= 100) {
							object.levelUp()
							object.exp -= 100
							writeAlerts(object.name + ' leveled up! ')
						}
					} else {
						opponent.exp += Math.round((20 + 30 * (object.health <= 0)) * (1 + (object.ids.includes('Monster'))) * object.level / opponent.level / (1 + isArenaBattle))
						if (opponent.exp >= 100) {
							opponent.levelUp()
							opponent.exp -= 100
							writeAlerts(opponent.name + ' leveled up! ')
						}
					}
					if (opponent.health <= 0) {
						object.gold += Math.round((1 + 3 * object.player) / 4 * opponent.gold)
						opponent.gold = Math.round(3 / 4 * opponent.gold)
					} else if (object.health <= 0) {
						opponent.gold += Math.round((1 + 3 * opponent.player) / 4 * object.gold)
						object.gold = Math.round(3 / 4 * object.gold)
					}
				} else {
					if (objectAttack > 0) {
						opponent.health -= objectAttack
						if (Math.random() * 100 <= objectCrit) {
							opponent.health -= 2 * objectAttack
							writeAlerts(object.name + ' landed a crit')
						}
					} else {
						writeAlerts(object.name + ' dealt no damage')
					}
				}
			} else {
				// reset buffs without combat
				opponent.defense = defense2
				object.defense = defense1
			}
			adversaries[opponent.index] = opponent
		}
		
		// reset tile weapon
		object.weapon = weapon
		
		if (object.getWeapon(0) !== 'Bow') object.weaponRange = 1
		else {
			object.weaponRange = 3
			if (object.ids.includes('Range')) ++object.weaponRange
		}
	}
	const leverCheck = object => {
		levers.forEach(e => {
			if (object.x === e.x && object.y === e.y && keyWentDown['k']) e.pull()
		})
	}
	const healCheck = object => {
		let inRange = []
		allPlayers.forEach(e => {
			if (Math.abs(object.x - e.x) + Math.abs(object.y - e.y) <= 1 && e.name !== object.name) inRange.push(e)
		})
		ctx.fillStyle = '#ffffff'
		if (inRange.length) {
			healing = true
			let target = inRange[healSelect % inRange.length]
			ctx.fillText(target.name, 250, 550)
			ctx.fillText('Health: ' + target.health + ' / ' + target.maxHealth, 200, 575)
			if (getButtons()[1] && target.health < target.maxHealth) {
				if (object.didHeal) {
					cheatCount.overMoving += 1
					cheatCount.cheatAlert('overMoving')
				} else object.didHeal = true
				
				object.heal(target)
			}
		}
		if (healer.exp >= 100) {
			// clear text
			alerts.textContent = ''
			
			healer.levelUp()
			healer.exp -= 100
			writeAlerts(healer.name + ' leveled up!')
		}
	}
	const colliseumCheck = (object) => {
		if (Math.abs(colliseum.x - object.x) + Math.abs(colliseum.y - object.y) <= 1) {
			if (!battling) {
				ctx.fillStyle = '#ffffa0'
				ctx.fillText('The Colliseum', 370, 600)
				ctx.fillStyle = '#ffb090'
				ctx.fillText('Press + to fight!', 350, 700)
				if (getButtons()[6]) colliseum.spawnEnemy(selected)
			}
		}
	}
	const tradeCheck = (object) => {
		let inRange = []
		allNeutrals.forEach(e => {
			if (Math.abs(e.x - selected.x) + Math.abs(e.y - selected.y) <= 1) inRange.push(e)
			if (inRange.length) {
				trading = true
				let trader = inRange[tradeSelect % inRange.length]
				let slotSelected
				for (let i = 0; i < 9; i++) {
					if (numKeys[i]) slotSelected = i
				}
				if (slotSelected !== 0) {
					
					// buying weapons
					if (getButtons()[3] && slotSelected - 1 < trader.inventory.length && object.gold >= weaponValue[MATERIAL[trader.inventory[slotSelected - 1][1]] - 1]) {
						keyWentDown['u'] = 0
						object.gold -= weaponValue[MATERIAL[trader.inventory[slotSelected - 1][1]] - 1]
						trader.gold += weaponValue[MATERIAL[trader.inventory[slotSelected - 1][1]] - 1]
						object.inventory.push(trader.inventory[slotSelected - 1])
						trader.inventory.splice(slotSelected - 1, 1)
					}
					
					// selling weapons
					if (getButtons()[4] && slotSelected - 1 < object.inventory.length && trader.gold >= weaponValue[MATERIAL[object.inventory[slotSelected - 1][1]] - 1] / 4) {
						keyWentDown['o'] = 0
						trader.gold -= weaponValue[MATERIAL[object.inventory[slotSelected - 1][1]] - 1] / 4
						object.gold += weaponValue[MATERIAL[object.inventory[slotSelected - 1][1]] - 1] / 4
						trader.inventory.push(object.inventory[slotSelected - 1])
						object.inventory.splice(slotSelected - 1, 1)
					}
					
					// trading armor
					if (slotSelected - 1 < trader.inventory.length + 4 && slotSelected - 1 >= trader.inventory.length && getButtons()[3]) {
						
						// merchant-side indices
						keyWentDown['u'] = 0
						const index = slotSelected - trader.inventory.length - 1
						if (object.gold >= armorValue[MATERIAL[trader.armorInv[index]] - 1] - armorValue[MATERIAL[object.getArmor(index)] - 1] / 4 && trader.gold >= -armorValue[MATERIAL[trader.armorInv[index]] - 1] + armorValue[MATERIAL[object.getArmor(index)] - 1] / 4) {
							if (trader.armorInv[index] !== 'No') trader.gold += armorValue[MATERIAL[trader.armorInv[index]] - 1] 
							if (object.getArmor(index) !== 'No') trader.gold -= armorValue[MATERIAL[object.getArmor(index)] - 1] / 4
							if (trader.armorInv[index] !== 'No') object.gold -= armorValue[MATERIAL[trader.armorInv[index]] - 1] 
							if (object.getArmor(index) !== 'No') object.gold += armorValue[MATERIAL[object.getArmor(index)] - 1] / 4
							;[object.armor[index], trader.armorInv[index]] = [trader.armorInv[index], object.armor[index]]
						}
					} else if (slotSelected - 1 < object.inventory.length + 4 && slotSelected - 1 >= object.inventory.length && getButtons()[4]) {
						
						// player-side indices
						keyWentDown['o'] = 0
						const index = slotSelected - object.inventory.length - 1
						if (object.gold >= armorValue[MATERIAL[trader.armorInv[index]] - 1] - armorValue[MATERIAL[object.getArmor(index)] - 1] / 4 && trader.gold >= -armorValue[MATERIAL[trader.armorInv[index]] - 1] + armorValue[MATERIAL[object.getArmor(index)] - 1] / 4) {
							if (trader.armorInv[index] !== 'No') trader.gold += armorValue[MATERIAL[trader.armorInv[index]] - 1] 
							if (object.getArmor(index) !== 'No') trader.gold -= armorValue[MATERIAL[object.getArmor(index)] - 1] / 4
							if (trader.armorInv[index] !== 'No') object.gold -= armorValue[MATERIAL[trader.armorInv[index]] - 1] 
							if (object.getArmor(index) !== 'No') object.gold += armorValue[MATERIAL[object.getArmor(index)] - 1] / 4
							;[object.armor[index], trader.armorInv[index]] = [trader.armorInv[index], object.armor[index]]
						}
					}
				} else if (slotSelected === 0 && object.gold >= weaponValue[MATERIAL[trader.shieldInv] - 1] - weaponValue[MATERIAL[object.shieldInv] - 1] / 4) {
					
					// trading shields
					if ((getButtons()[3] + getButtons()[4]) && trader.gold >= -weaponValue[MATERIAL[trader.shieldInv] - 1] + weaponValue[MATERIAL[object.shieldInv] - 1] / 4) {
						keyWentDown['u'] = 0
						keyWentDown['o'] = 0
						if (trader.shieldInv) trader.gold += weaponValue[MATERIAL[trader.shieldInv] - 1] 
						if (object.shieldInv) trader.gold -= weaponValue[MATERIAL[object.shieldInv] - 1] / 4
						if (trader.shieldInv) object.gold -= weaponValue[MATERIAL[trader.shieldInv] - 1] 
						if (object.shieldInv) object.gold += weaponValue[MATERIAL[object.shieldInv] - 1] / 4
						;[object.shieldInv, trader.shieldInv] = [trader.shieldInv, object.shieldInv]
					}
				}
				ctx.fillStyle = '#ffffff'
				
				// printing player trading information
				ctx.fillText(selected.name, 225, 550)
				ctx.fillText('Inventory', 205, 580)
				ctx.fillText('Gold: ' + object.gold, 210, 610)
				for (let i = 0; i < object.inventory.length; i++) {
					ctx.fillText(object.inventory[i][1] + ' ' + object.inventory[i][0] + ': ' + weaponValue[MATERIAL[object.inventory[i][1]] - 1] / 4, 175, 640 + 30 * i)
				}
				for (let i = 0; i < 4; i++) {
					if (object.getArmor(i) !== 'No') ctx.fillText(object.getArmor(i) + ' ' + armorPart[i] + ': ' + armorValue[MATERIAL[object.getArmor(i)] - 1], 175, 640 + 30 * i + 30 * object.inventory.length)
					else ctx.fillText(object.getArmor(i) + ' ' + armorPart[i], 175, 640 + 30 * i + 30 * object.inventory.length)
				}
				if (object.shieldInv) ctx.fillText(object.shieldInv + ' Shield: ' + weaponValue[MATERIAL[object.shieldInv] - 1] / 4, 175, 640 + 30 * (object.inventory.length + 4))
				
				// printing merchant trading information
				ctx.fillText('Merchant', 625, 550)
				ctx.fillText('Inventory', 615, 580)
				ctx.fillText('Gold: ' + trader.gold, 620, 610)
				for (let i = 0; i < trader.inventory.length; i++) {
					ctx.fillText(trader.inventory[i][1] + ' ' + trader.inventory[i][0] + ': ' + weaponValue[MATERIAL[trader.inventory[i][1]] - 1], 585, 640 + 30 * i)
				}
				for (let i = 0; i < 4; i++) {
					if (trader.armorInv[i] !== 'No') ctx.fillText(trader.armorInv[i] + ' ' + armorPart[i] + ': ' + armorValue[MATERIAL[trader.armorInv[i]] - 1], 585, 640 + 30 * i + 30 * trader.inventory.length)
					else ctx.fillText(trader.armorInv[i] + ' ' + armorPart[i], 585, 640 + 30 * i + 30 * trader.inventory.length)
				}
				if (trader.shieldInv) ctx.fillText(trader.shieldInv + ' Shield: ' + weaponValue[MATERIAL[trader.shieldInv] - 1], 585, 640 + 30 * (trader.inventory.length + 4))
			}
		})
	}
	const stockpileCheck = (object) => {
		let storageTile = 0
		for (const s of stockpiles) {
			if (s.x === object.x && s.y === object.y && (s.name === object.name || (object.player + object.neutral === 0))) storageTile = s
		}
		if (storageTile) {
			
			// manage inventory
			let slotSelected
			for (let i = 0; i < 9; i++) {
				if (numKeys[i]) slotSelected = i
			}
			if (slotSelected - 1 < storageTile.inventory.length && getButtons()[3] && object.inventory.length < 5 && slotSelected !== 0) {
				object.inventory.push(storageTile.inventory[slotSelected - 1])
				storageTile.inventory.splice(slotSelected - 1, 1)
				keyWentDown['u'] = 0
			} else if (slotSelected - 1 < object.inventory.length && getButtons()[4] && storageTile.inventory.length < 5 && slotSelected !== 0 && object.inventory.length !== 1) {
				storageTile.inventory.push(object.inventory[slotSelected - 1])
				object.inventory.splice(slotSelected - 1, 1)
				keyWentDown['o'] = 0
			} else if (slotSelected - 1 < storageTile.inventory.length + 4 && slotSelected - 1 >= storageTile.inventory.length && getButtons()[3]) {
				
				// storage-side indices
				keyWentDown['u'] = 0
				const index = slotSelected - storageTile.inventory.length - 1
				;[object.armor[index], storageTile.armorInv[index]] = [storageTile.armorInv[index], object.armor[index]]
			} else if (slotSelected - 1 < object.inventory.length + 4 && slotSelected - 1 >= object.inventory.length && getButtons()[4]) {
				
				// player-side indices
				keyWentDown['o'] = 0
				const index = slotSelected - object.inventory.length - 1
				;[object.armor[index], storageTile.armorInv[index]] = [storageTile.armorInv[index], object.armor[index]]
			} else if (slotSelected === 0) {
				
				// storing shields
					if (getButtons()[3] + getButtons()[4]) {
						keyWentDown['u'] = 0
						keyWentDown['o'] = 0
						;[object.shieldInv, storageTile.shieldInv] = [storageTile.shieldInv, object.shieldInv]
					}
			}
			
			// manage gold
			if (object.gold > 0) {
				object.gold -= getButtons()[7]
				storageTile.gold += getButtons()[7]
			}
			if (storageTile.gold > 0) {
				object.gold -= getButtons()[8]
				storageTile.gold += getButtons()[8]
			}
			if (object.player + object.neutral === 0) {
				if (storageTile.gold !== 0) {
					object.gold += storageTile.gold
					storageTile.gold = 0
					object.fleeing = true
				}
			}
			
			ctx.fillStyle = '#ffffff'
			
			// print player inventory
			ctx.fillText(object.name, 225, 550)
			ctx.fillText('Inventory', 205, 580)
			ctx.fillText('Gold: ' + object.gold, 210, 610)
			for (let i = 0; i < object.inventory.length; i++) {
				ctx.fillText(object.inventory[i][1] + ' ' + object.inventory[i][0], 175, 640 + 30 * i)
			}
			for (let i = 0; i < 4; i++) {
				ctx.fillText(object.getArmor(i) + ' ' + armorPart[i], 175, 640 + 30 * i + 30 * object.inventory.length )
			}
			if (object.shieldInv) ctx.fillText(object.shieldInv + ' Shield', 175, 640 + 30 * (object.inventory.length + 4))
			
			// print stockpile contents
			ctx.fillText(storageTile.name + '\'s' + ' Stockpile', 580, 550)
			ctx.fillText('Contents', 615, 580)
			ctx.fillText('Gold: ' + storageTile.gold, 620, 610)
			for (let i = 0; i < storageTile.inventory.length; i++) {
				ctx.fillText(storageTile.inventory[i][1] + ' ' + storageTile.inventory[i][0], 600, 640 + 30 * i)
			}
			for (let i = 0; i < 4; i++) {
				ctx.fillText(storageTile.getArmor(i) + ' ' + armorPart[i], 600, 640 + 30 * i + 30 * storageTile.inventory.length )
			}
			if (storageTile.shieldInv) ctx.fillText(storageTile.shieldInv + ' Shield', 600, 640 + 30 * (storageTile.inventory.length + 4))
		}
	}
	const displayAllHealth = () => {
		ctx.fillStyle = '#000000'
		ctx.fillRect(0, 500, 900, 400)
		allPlayers.forEach((player, i) => {
			ctx.fillStyle = '#ffffff'
			ctx.fillText(player.name, 80, 575 + i * 50)
			ctx.fillText(player.health + ' / ' + player.maxHealth, 275, 575 + i * 50)
			if (player.health / player.maxHealth <= 1 / 10) ctx.fillStyle = '#f00000'
			else if (player.health / player.maxHealth < 1 / 2) ctx.fillStyle = '#f0f000'
			else ctx.fillStyle = '#00f000'
			ctx.fillRect(155, 575 + i * 50 - ctx.font.slice(0, 2), player.health / player.maxHealth * 100, pSize)
		})
		ctx.font = '10px Courier New, monospace'
		allEnemies.forEach((enemy, i) => {
			ctx.fillStyle = '#ffffff'
			ctx.fillText(enemy.name, 400 + Math.round(i / 19 - 0.5) * 170, 525 + (i % 19) * 20)
			if (enemy.health / enemy.maxHealth <= 1 / 10) ctx.fillStyle = '#f00000'
			else if (enemy.health / enemy.maxHealth < 1 / 2) ctx.fillStyle = '#f0f000'
			else ctx.fillStyle = '#00f000'
			ctx.fillRect(500 + Math.round(i / 19 - 0.5) * 170, 525 + (i % 19) * 20 - ctx.font.slice(0, 2), enemy.health / enemy.maxHealth * 50, ctx.font.slice(0, 2))
		})
		ctx.font = "15px Courier New, monospace"
	}
	const addEnemy = () => {
		const hostile = new Hostile (Math.round(enemyDifficulty + Math.random() * 2 - 1), enemyMaterial)
		writeAlerts('An enemy has wandered in! ')
	}
	const addRaid = () => {
		for (let i = 0; i < Math.round(Math.random() * 5) + 5; i++) {
			const hostile = new Hostile (Math.round(enemyDifficulty + Math.random() * 2 - 1), enemyMaterial)
		}
		enemyCountDown = enemyCountDown.map(enemy => {
			if (enemy === 1 || Math.random() <= 0.7) return 1
			else return 0
		})
		writeAlerts('A raid has arrived! ')
	}
	const addSiege = () => {
		for (let i = 0; i < Math.round(Math.random() * (enemySiegeMax - enemySiegeMin)) + enemySiegeMin; i++) {
			const hostile = new Hostile (Math.round(enemyDifficulty + Math.random() * 2 - 1), enemyMaterial)
		}
		enemyCountDown = enemyCountDown.map(enemy => {
			if (enemy === 1 || Math.random() <= 0.8) return 1
			else return 0
		})
		raidCountDown = raidCountDown.map(raid => {
			if (raid === 1 || Math.random() <= 0.5) return 1
			else return 0
		})
		writeAlerts('A siege has arrived! ')
	}
	
	const getData = () => {
		const data = {
			"allPlayers": allPlayers,
			"allNeutrals": allNeutrals,
			"allEnemies": allEnemies,
			"stockpiles": stockpiles,
			"breakableWalls": breakableWalls,
			"enemyDifficulty": enemyDifficulty,
			"autoEnemyDifficulty": autoEnemyDifficulty,
			"enemyMaterial": enemyMaterial,
			"respawners": playerRespawners
		}
		return JSON.stringify(data)
	}
	
	const loadData = (data, user) => {
		const userData = JSON.parse(data)["data"][user]
		userData.allPlayers.forEach((playerData, i) => {
			allPlayers[i].x = playerData.x
			allPlayers[i].y = playerData.y
			allPlayers[i].name = playerData.name
			allPlayers[i].con = playerData.con
			allPlayers[i].ids = playerData.ids
			allPlayers[i].promoted = playerData.promoted
			allPlayers[i].maxHealth = playerData.maxHealth
			allPlayers[i].health = playerData.health
			allPlayers[i].strength = playerData.strength
			allPlayers[i].magic = playerData.magic
			allPlayers[i].defense = playerData.defense
			allPlayers[i].skill = playerData.skill
			allPlayers[i].speed = playerData.speed
			allPlayers[i].armor = playerData.armor
			allPlayers[i].weapon = playerData.weapon
			allPlayers[i].inventory = playerData.inventory
			allPlayers[i].shield = playerData.shield
			allPlayers[i].healthGrowth = playerData.healthGrowth
			allPlayers[i].strengthGrowth = playerData.strengthGrowth
			allPlayers[i].magicGrowth = playerData.magicGrowth
			allPlayers[i].defenseGrowth = playerData.defenseGrowth
			allPlayers[i].skillGrowth = playerData.skillGrowth
			allPlayers[i].speedGrowth = playerData.speedGrowth
			allPlayers[i].option1 = playerData.option1
			allPlayers[i].option2 = playerData.option2
			allPlayers[i].prfWeapon = playerData.prfWeapon
			allPlayers[i].shieldInv = playerData.shieldInv
			allPlayers[i].exp = playerData.exp
			allPlayers[i].level = playerData.level
			allPlayers[i].gold = playerData.gold
			allPlayers[i].deaths = playerData.deaths
			allPlayers[i].weaponRange = playerData.weaponRange
		})
		userData.allNeutrals.forEach((neutralData, i) => {
			allNeutrals[i].health = neutralData.health
			allNeutrals[i].gold = neutralData.gold
			allNeutrals[i].inventory = neutralData.inventory
			allNeutrals[i].shieldInv = neutralData.shieldInv
			allNeutrals[i].armorInv = neutralData.armorInv
		})
		userData.stockpiles.forEach((stockpileData, i) => {
			stockpiles[i].name = stockpileData.name
			stockpiles[i].letter = stockpileData.letter
			stockpiles[i].gold = stockpileData.gold
			stockpiles[i].inventory = stockpileData.inventory
			stockpiles[i].shieldInv = stockpileData.shieldInv
			stockpiles[i].armorInv = stockpileData.armorInv
		})
		userData.breakableWalls.forEach((wallData, i) => {
			breakableWalls[i].health = wallData.health
		})
		enemyDifficulty = userData.enemyDifficulty
		autoEnemyDifficulty = userData.autoEnemyDifficulty
		enemyMaterial = userData.enemyMaterial
		/*
		userData.allEnemies.forEach((enemyData, i) => {
			if (allEnemies[i] === undefined) new Hostile(Math.round(enemyDifficulty + Math.random() * 2 - 1), enemyMaterial)
			allEnemies[i].level = enemyData.level
			allEnemies[i].fleeing = enemyData.fleeing
			allEnemies[i].fled = enemyData.fled
			allEnemies[i].gold = enemyData.gold
			allEnemies[i].name = enemyData.name
			allEnemies[i].ids = enemyData.ids
			allEnemies[i].letter = enemyData.letter
			allEnemies[i].con = enemyData.con
			allEnemies[i].move = enemyData.move
			allEnemies[i].weapon = enemyData.weapon
			allEnemies[i].shield = enemyData.shield
			allEnemies[i].inventory = enemyData.inventory
			allEnemies[i].armor = enemyData.armor
			allEnemies[i].weaponRange = enemyData.weaponRange
			allEnemies[i].maxHealth = enemyData.maxHealth
			allEnemies[i].health = enemyData.health
			allEnemies[i].strength = enemyData.strength
			allEnemies[i].defense = enemyData.defense
			allEnemies[i].skill = enemyData.skill
			allEnemies[i].speed = enemyData.speed
			allEnemies[i].num = enemyData.num
			
		})
		*/
	}
	
	setInterval(() => {
		ctx.fillStyle = '#000000'
		ctx.fillRect(0, 0, 900, 900)
		
		// cursor
		mouseX += getDPad()[0] / 2
		mouseY += getDPad()[1] / 2
		
		// player interaction
		selecter(allObjects)
		battleSelect += getButtons()[2]
		if (battleSelect < 0) battleSelect = 0
		healSelect += getButtons()[2]
		if (healSelect < 0) healSelect = 0
		tradeSelect += getButtons()[2]
		if (tradeSelect < 0) tradeSelect = 0
		if (selected && keyWentDown['k']) leverCheck(selected)
		healing = false
		trading = false
		if (selected.name === 'Healer') healCheck(selected)
		if (selected && selected.player) {
			battling = false
			battleCheck(selected, allEnemies)
			if (!battling) {
				colliseumCheck(selected)
				if (!healing) {
					if (keyWentDown['k']) {
						selected.x = previousSelected.x
						selected.y = previousSelected.y
						selected = 0
				}
					tradeCheck(selected)
					if (!trading) stockpileCheck(selected)
				}
			}
		}
		else if (!selected.neutral && selected) {
			battling = false
			battleCheck(selected, attackables)
			if (!battling) stockpileCheck(selected)
		} else if (selected && selected.neutral) {
			stockpileCheck(selected)
			if (keyWentDown['k'] && !battling) {
				selected.x = previousSelected.x
				selected.y = previousSelected.y
				selected = 0
			}
		}
		if (enemyPhase) {
			if (!(iTime % enemyInterval)) {
				const enemyIndex = iTime % (enemyInterval * (allEnemies.length + 1)) / enemyInterval - 1
				if (enemyIndex !== -1) {
					if (!allEnemies[enemyIndex].fleeing) allEnemies[enemyIndex].pathFinding(new Graph (buildBoard()))
					else allEnemies[enemyIndex].flee(new Graph (buildBoard()))
					enemyAttacking = true
					if (allEnemies.length) battleCheck(allEnemies[enemyIndex], [allEnemies[enemyIndex].attacking(), breakableWalls, playerRespawners].flat())
					enemyAttacking = false
				if (allEnemies[enemyIndex].health <= 0) iTime -= enemyInterval
					stockpileCheck(allEnemies[enemyIndex])
				} else {
					enemyPhase = false
					
					// end enemy music	
					enemyMusic.pause()
					
					// announce player phase
					alerts.textContent = 'Player Phase!'
					
					// play player music
					if (allEnemies.length <= 20) {
						playerMusic.currentTime = 0
						setTimeout(() => {
							playerMusic.play()
						}, 500)
					} else {
						playerSiegeMusic.currentTime = 0
						setTimeout(() => {
							playerSiegeMusic.play()
						}, 500)
					}
				}
			}
		}
		
		if (keyWentDown['k'] || (enemyPhase && !(iTime % 12))) {
			
			// various mechanisms to deal with hp <= 0 and fleeing
			for (let i = 0; i < allEnemies.length; i++) {
				if (allEnemies[i].health <= 0 || allEnemies[i].fled) {
					allEnemies[i].x = -5
					allEnemies.splice(i, 1)
				}
			}
			for (let i = 0; i < allObjects.length; i++) {
				if (allObjects[i].health <= 0 && !allObjects[i].player) {
					allObjects[i].x = -5
					allObjects.splice(i, 1)
				}
			}
			for (let i = 0; i < breakableWalls.length; i++) {
				if (breakableWalls[i].health <= 0) {
					breakableWalls[i].x = -5
					breakableWalls.splice(i, 1)
				}
			}
			playerRespawners.forEach(playerRespawner => {
				playerRespawner.tiles.forEach((tile, i) => {
					playerRespawner.tileIsOccupied[i] = false
				})
			})
			allPlayers.forEach(player => {
				playerRespawners.forEach(playerRespawner => {
					playerRespawner.tiles.forEach((tile, i) => {
						if (player.x === playerRespawner.x + tile[0] && player.y === playerRespawner.y + tile[1]) {
							playerRespawner.tileIsOccupied[i] = true
						}
					})
				})
			})
			allPlayers.forEach(player => {
				if (player.respawning) {
					player.x = 15 + Math.round(Math.random() * 4 - 0.5)
					player.y = 10 + Math.round(Math.random() * 4 - 0.5)
					player.exp -= 50
					++player.deaths
					if (player === selected) selected = 0
					playerRespawners.forEach(playerRespawner => {
						if (playerRespawner.health > 0) {
							playerRespawner.tiles.forEach((tile, i) => {
								if (!playerRespawner.tileIsOccupied[i] && player.respawning) {
									player.x = playerRespawner.x + tile[0]
									player.y = playerRespawner.y + tile[1]
									playerRespawner.tileIsOccupied[i] = true
									player.respawning = false
								}
							})
						}
					})
					player.respawning = false
				}
			})
		}
		
		if (keyWentDown[' ']) {
			
			allPlayers.forEach(player => {
				player.attacked = false
				if (player.didHeal) player.didHeal = false
			})
			
			// turn advancement
			// enemy spawning
			if (allEnemies.length >= 20) {
				enemyChance = 40
				raidChance = 15
			} else {
				enemyChance = 5
				raidChance = 2
			}
			
			alerts.textContent = ''
			if (enemyCountDown.shift() === 1) addEnemy()
			if (raidCountDown.shift() === 1) addRaid()
			if (siegeCountDown.shift() === 1) addSiege()
			if (Math.random() * 100 < enemyChance) {
				enemyCountDown.push(1)
				writeAlerts('An enemy is nearby!')
			} else enemyCountDown.push(0)
			if (Math.random() * 100 < raidChance) {
				raidCountDown.push(1)
				writeAlerts('A raid is nearby! ')
			} else raidCountDown.push(0)
			if (Math.random() * 100 < siegeChance) {
				siegeCountDown.push(1)
				writeAlerts('A siege is nearby! ')
			} else siegeCountDown.push(0)
			
			// enemy phase
			if (enemyPhase) {
				cheatCount.turnSkipping += 1
				cheatCount.cheatAlert('turnSkipping')
			}
			if (!enemyPhase && allEnemies.length) {
				
				cheatResetRands = [Math.random(), Math.random(), Math.random(), Math.random()]
				if (cheatResetRands[0] < cheatDecrementChance && cheatCount.overMoving > 0) cheatCount.overMoving -= 1
				if (cheatResetRands[1] < cheatDecrementChance && cheatCount.tampering > 0) cheatCount.tampering -= 1
				if (cheatResetRands[2] < cheatDecrementChance && cheatCount.turnSkipping > 0) cheatCount.turnSkipping -= 1
				if (cheatResetRands[3] < cheatDecrementChance && cheatCount.movingWrongPhase > 0) cheatCount.movingWrongPhase -= 1
				
				// announce enemy phase
				writeAlerts('Enemy Phase!')
				
				// start enemy phase
				setTimeout(() => {
					enemyPhase = true
					iTime = 1
				}, 1500)
				
				// stop player music
				playerMusic.pause()
				playerSiegeMusic.pause()
				
				// play enemy music
				enemyMusic.currentTime = 0
				enemyMusic.play()
			}
			
			// fort healing
			for (const object of allObjects) {
				forts.forEach(e => {
					if (e.x === object.x && e.y === object.y) object.recover()
				})
			}
			
			// respawner healing
			for (const respawner of playerRespawners) {
				respawner.tiles.forEach(tile => {
					allPlayers.forEach(player => {
						if (player.x === respawner.x + tile[0] && player.y === respawner.y + tile[1]) {
							player.health += respawner.regenRate
							if (player.health > player.maxHealth) player.health = player.maxHealth
						}
					})
				})
			}
			
			// merchant items
			let chanceOfItem = 0.15
			let chanceOfArmor = 0.1
			let chanceOfShield = 0.03
			if (getAverageMaterial() >= MATERIAL['Steel']) {
				chanceOfItem /= 2
				chanceOfArmor /= 2
			}
			
			for (const n of allNeutrals) {
				n.getNewItem(getAverageMaterial(), chanceOfItem, chanceOfArmor, chanceOfShield)
			}
			
			// enemy level-wealth calculation
			const wealthOrder = getWealthOrder()
			const fastLevelUp = ((wealthOrder[0] + 200) / (wealthOrder[2] + 200) > 3)
			const intervalFactor = 1 - fastLevelUp / 2
			if ((getHighestWealth() - 150) / (wealthInterval * intervalFactor) >= autoEnemyDifficulty) {
				autoEnemyDifficulty += 1
				enemyDifficulty += 1
			}
			
			// enemy resources calculation
			if (getEnemyMaterial() >= enemyMaterial + enemyMaterialLag) {
				enemyMaterial += 0.05
			}
		}
		
		// enemy level and equipment
		if (enemyDifficulty + getButtons()[5] >= autoEnemyDifficulty) enemyDifficulty += getButtons()[5]
		
		// lever-door relation
		for (let i = 0; i < levers.length; i++) {
			doors[i].isOpen = !levers[i].isPulled
		}
		
		// paint
		ballistas.forEach(e => {
			ctx.fillStyle = '#804020'
			ctx.fillRect(e.x * pSize, e.y * pSize, pSize, pSize)
			ctx.fillStyle = '#1010f0'
			ctx.fillText('C', (e.x + 1 / 7) * pSize, (e.y + 4 / 5) * pSize)
		})
		forts.forEach(e => {
			ctx.fillStyle = '#102020'
			ctx.fillRect(e.x * pSize, e.y * pSize, pSize, pSize)
			ctx.fillStyle = '#a05028'
			ctx.fillText('╬', (e.x + 1 / 7) * pSize, (e.y + 4 / 5) * pSize)
		})
		pillars.forEach(e => {
			ctx.fillStyle = '#b0b0a0'
			ctx.fillRect(e.x * pSize, e.y * pSize, pSize, pSize)
			ctx.fillStyle = '#006060'
			ctx.fillText('O', (e.x + 1 / 5) * pSize, (e.y + 3 / 4) * pSize)
		})
		colliseum.paint()
		for (const e of stockpiles) {
			e.paint()
		}
		
		// paint repawners
		playerRespawners.forEach(respawner => {
			ctx.fillStyle = '#0000ff'
			ctx.fillRect(respawner.x * pSize, respawner.y * pSize, pSize, pSize)
			ctx.fillStyle = '#ffff00'
			ctx.fillText('*', (respawner.x + 1 / 5) * pSize, (respawner.y + 4 / 5) * pSize)
			respawner.tiles.forEach(tile => {
				ctx.fillStyle = '#ffffff'
				ctx.fillRect((respawner.x + tile[0]) * pSize, (respawner.y + tile[1]) * pSize, pSize, pSize)
				ctx.fillStyle = '#ff0000'
				ctx.fillText('+', (respawner.x + tile[0] + 1 / 5) * pSize, (respawner.y + tile[1] + 4 / 5) * pSize)
			})
		})
		
		// paint players and enemies
		ctx.fillStyle = '#ffffff'
		ctx.fillRect(0, 450, 900, 50)
		ctx.fillRect(playerCC.x * pSize, playerCC.y * pSize, pSize, pSize)
		ctx.fillRect(playerCL.x * pSize, playerCL.y * pSize, pSize, pSize)
		ctx.fillRect(playerTG.x * pSize, playerTG.y * pSize, pSize, pSize)
		ctx.fillRect(playerTT.x * pSize, playerTT.y * pSize, pSize, pSize)
		ctx.fillRect(playerNS.x * pSize, playerNS.y * pSize, pSize, pSize)
		ctx.fillRect(healer.x * pSize, healer.y * pSize, pSize, pSize)
		ctx.font = '15px Courier New, Monospace'
		ctx.fillStyle = '#0000ff'
		ctx.fillText('C', (playerCC.x + 1 / 5) * pSize, (playerCC.y + 3 / 4) * pSize)
		ctx.fillText('L', (playerCL.x + 1 / 5) * pSize, (playerCL.y + 3 / 4) * pSize)
		ctx.fillText('G', (playerTG.x + 1 / 5) * pSize, (playerTG.y + 3 / 4) * pSize)
		ctx.fillText('T', (playerTT.x + 1 / 5) * pSize, (playerTT.y + 3 / 4) * pSize)
		ctx.fillText('S', (playerNS.x + 1 / 5) * pSize, (playerNS.y + 3 / 4) * pSize)
		ctx.fillText('H', (healer.x + 1 / 5) * pSize, (healer.y + 3 / 4) * pSize)
		ctx.fillStyle = '#808000'
		ctx.fillRect(goblin1.x * pSize, goblin1.y * pSize, pSize, pSize)
		ctx.fillStyle = '#e000e0'
		ctx.fillText('g', (goblin1.x + 1 / 5) * pSize, (goblin1.y + 3/ 4) * pSize)
		allEnemies.forEach(enemy => {
			enemy.paint()
		})
		if (selected && inRange.length) {
			let targetted = inRange[battleSelect % inRange.length]
			ctx.strokeStyle = '#ffff00'
			ctx.strokeRect(targetted.x * pSize, targetted.y * pSize, pSize, pSize)
		}
		for (let i = 0; i < allNeutrals.length; i++) {
		// allNeutrals.forEach(e => {
			ctx.fillStyle = '#00dfdf'
			ctx.fillRect(allNeutrals[i].x * pSize, allNeutrals[i].y * pSize, pSize, pSize)
			ctx.fillStyle = '#ff3030'
			ctx.fillText('N', (allNeutrals[i].x + 1 / 5) * pSize, (allNeutrals[i].y + 4 / 5) * pSize)
		// })
		}
		
		// paint walls and doors
		ctx.fillStyle = '#906040'
		walls.forEach(e => {
			ctx.fillRect(e.x, e.y, e.length, e.width)
		})
		
		doors.forEach (e => {
			if (!e.isOpen) {
				if (e.axis === 'x') ctx.fillRect(e.x, e.y + pSize / 2, e.length, 2)
				else ctx.fillRect(e.x + pSize / 2, e.y, 2, e.length)
			}
		})
		
		levers.forEach(e => {
			if (e.isPulled) ctx.fillText('|', (e.x + 1 / 3) * pSize, (e.y + 4 / 5) * pSize)
			else ctx.fillText('/', (e.x + 1 / 3) * pSize, (e.y + 4 / 5) * pSize)
		})
		
		breakableWalls.forEach(e => {
			if (e.health > 0) {
				ctx.fillStyle = '#986848'
				ctx.fillRect(e.x * pSize, e.y * pSize, pSize, pSize)
				ctx.fillStyle = '#000000'
				ctx.fillText('X', (e.x + 1 / 6) * pSize, (e.y + 4 / 5) * pSize)
			}
		})
		
		if (enemyPhase) displayAllHealth()
		
		// paint mouse
		/* ctx.fillStyle = '#00df00'
		ctx.fillRect(Math.round(mouseX - 0.5) * pSize, Math.round(mouseY - 0.5) * pSize, pSize, pSize)
		*/
		ctx.strokeStyle = '#00df00'
		ctx.strokeRect(Math.round(mouseX - 0.5) * pSize, Math.round(mouseY - 0.5) * pSize, pSize, pSize)
		
		// paint previousSelected
		ctx.fillStyle = '#ffff00'
		if (selected) ctx.fillText('X', (previousSelected.x + 1 / 5) * pSize, (previousSelected.y + 4 / 5) * pSize)
		
		if (false) getData()
		
		// reset keyWentDown
		keyWentDown['l'] = 0
		keyWentDown['k'] = 0
		keyWentDown['i'] = 0
		keyWentDown['j'] = 0
		keyWentDown['u'] = 0
		keyWentDown['o'] = 0
		keyWentDown[' '] = 0
		keyWentDown['>'] = 0
		keyWentDown['<'] = 0
		keyWentDown['+'] = 0
		
		++iTime
	}, timeInterval)
}
if (document.readyState !== 'loading') main()
else document.addEventListener('DOMContentLoaded', main)