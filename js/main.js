'use strict'

const BOMB = '💣'
const FLAG = '🚩'
const WIN = '😎'
const LOSE = '🤯'
const NORMAL = '🙂'
const HEART = '<img src="img/heart.png">'

var gBoard
var gLifeCount
var gIsFirstClickForPlay
var gIsVictory
var gTimerInterval

var gHintBtnIsOn
var gSelectedHintBtn

var gSafeClickCount

var gMegaHintIsOn
var gClickCountInMegaMode
var gSelectedCells

var gHiddenMines
var gExterminator

var gGameStates
var gStepsOnBoard

var gDIYisON
var gClicksCountOnBoard
var gClickedCellsInDIY

var gCurrLevel


var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

var gHintBtnClicksCount = {
    btn1: 0, btn2: 0, btn3: 0
}

const gDifficultyLevels = ['beginner', 'medium', 'expert'];

const gTimerDisplay = document.getElementById('timer');


function onInit() {
    initializeBestScores()
    gBoard = buildBoard()
    initializeMinesNum()
    initializeParameters()
    stopTimer()
    renderBoard(gBoard)
    displayBestScores()

}


function buildBoard(size = 4) {
    const board = []
    gLevel.SIZE = size

    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
        }
    }

    return board
}



function renderBoard(board) {
    var strHtml = ''
    for (var i = 0; i < board.length; i++) {
        const row = board[i]
        strHtml += '<tr>'
        for (var j = 0; j < row.length; j++) {
            const cell = board[i][j]

            const tdId = `cell-${i}-${j}`

            const className = (gDIYisON) ? 'mark' : 'cover'

            strHtml += `<td id="${tdId}" onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="onCellMarked(event, this, ${i}, ${j})" 
            class="${className}"></td>`
        }
        strHtml += '</tr>'
    }
    const elMat = document.querySelector('.game-board')
    elMat.innerHTML = strHtml
}



function createBoardPerDifficulty(size) {
    stopTimer()
    initializeBestScores()
    gBoard = buildBoard(size)
    initializeMinesNum(size)
    initializeParameters()
    renderBoard(gBoard)
    displayBestScores()
}


function setMinesInRandCell(cellI, cellJ) {
    var minesNum = gLevel.MINES

    for (var i = 0; i < minesNum; i++) {
        var cell = randCell()

        while ((cellI === cell.i && cellJ === cell.j) || gBoard[cell.i][cell.j].isMine) {
            cell = randCell()
        }

        gBoard[cell.i][cell.j].isMine = true
    }
}


function randCell() {
    var randIdxI = getRandomInt(0, gBoard.length)
    var randIdxJ = getRandomInt(0, gBoard[0].length)

    return { i: randIdxI, j: randIdxJ }

}


function onCellMarked(event, elCell, i, j) {
    event.preventDefault();

    saveStep()

    const clickedCell = gBoard[i][j]
    var coord = { i, j }
    gStepsOnBoard.push([[clickedCell, coord], []])

    clickedCell.isMarked = !clickedCell.isMarked

    elCell.innerText = (clickedCell.isMarked && gGame.markedCount > 0) ? FLAG : ''
    var diff = (clickedCell.isMarked) ? -1 : 1
    gGame.markedCount += diff

    if (gGame.markedCount < 0) {
        gGame.markedCount = 0
        clickedCell.isMarked = false
    }

    const elFlags = document.querySelector('.flag span')
    elFlags.innerText = gGame.markedCount
}



function cellClicked(elCell, cellI, cellJ) {
    if (!gGame.isOn) return

    gClicksCountOnBoard++

    saveStep()

    const clickedCell = gBoard[cellI][cellJ]
    var coord = { i: cellI, j: cellJ }

    if (gDIYisON && gClicksCountOnBoard <= gLevel.MINES) {
        const exists = gClickedCellsInDIY.some(item => item.i === coord.i && item.j === coord.j);
        if (!exists) {
            gClickedCellsInDIY.push(coord)
            setMinesByUser(clickedCell, coord)
        }
        else {
            gClicksCountOnBoard--
        }
        showMinesNumToLocate()
        if (gClicksCountOnBoard === gLevel.MINES) {
            gDIYisON = false
            gIsFirstClickForPlay = true
            document.querySelector('.mines-count').hidden = true
            renderBoard(gBoard)

        }
        return
    }


    const expandedCells = []
    gStepsOnBoard.push([[clickedCell, coord], expandedCells])


    if (gIsFirstClickForPlay) {
        startTimer()
        if (gClicksCountOnBoard === 1) setMinesInRandCell(cellI, cellJ)
        setMineNegsCount()
        gIsFirstClickForPlay = false

    }

    if (clickedCell.isMarked || (clickedCell.isShown && !gMegaHintIsOn)) return



    if (gHintBtnClicksCount[gSelectedHintBtn] === 1 && gHintBtnIsOn) {
        renderCell(clickedCell, coord)
        expandShown(gBoard, elCell, cellI, cellJ)

        setTimeout(() => {
            removeMarkedNegs(elCell, cellI, cellJ)
            removeMarkedCell(coord)
            gHintBtnIsOn = false

        }, 1000);
        return
    }


    if (gMegaHintIsOn && gClickCountInMegaMode < 2) {
        gClickCountInMegaMode++
        gSelectedCells.push(coord)

        if (gClickCountInMegaMode === 2) {
            revealSelectedArea(gSelectedCells)
        }
        return
    }


    clickedCell.isShown = true
    renderCell(clickedCell, coord)


    if (clickedCell.isMine) {
        elCell.innerText = BOMB
        updateLifeCounter()
        checkGameOver()

    } else {
        gGame.shownCount++
    }

    if (!clickedCell.isMine && clickedCell.minesAroundCount === 0) {
        const expandedCells = expandShown(gBoard, elCell, cellI, cellJ)
        gStepsOnBoard[gStepsOnBoard.length - 1] = ([[clickedCell, coord], expandedCells])

    }

    isVictory()
}



function updateLifeCounter() {
    gLifeCount.pop()
    renderLives()
}



function getSelector(coord) {
    return `#cell-${coord.i}-${coord.j}`
}


function expandShown(board, elCell, cellI, cellJ) {
    var expandedCells = [] //for UNDO

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue

            const currCell = gBoard[i][j]

            if (currCell.isShown) continue

            if (!currCell.isMarked) {

                if (!gHintBtnIsOn) {
                    if (!currCell.isShown) gGame.shownCount++
                    currCell.isShown = true
                }

                const coord = { i, j }
                expandedCells.push([currCell, coord])
                renderCell(currCell, coord)
            }
        }
    }
    return expandedCells
}



function renderCell(cell, coord) {
    var cellValue
    const selector = getSelector(coord)
    const elTd = document.querySelector(selector)

    elTd.classList.add('mark')
    if (gBoard[coord.i][coord.j].isMine) {
        cellValue = BOMB
        gHiddenMines--
    }
    else cellValue = (cell.minesAroundCount === 0) ? '' : cell.minesAroundCount

    elTd.innerText = cellValue
}



function removeMarkedNegs(elCell, cellI, cellJ) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue

            if (!gBoard[i][j].isShown) {
                const coord = { i, j }
                removeMarkedCell(coord)
            }
        }
    }
}



function revealMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {

                gBoard[i][j].isShown = true
                const coord = { i, j }
                renderCell(gBoard[i][j], coord)
            }
        }
    }
}



function setMineNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var minesNegsCount = countMineNegs(i, j, gBoard)
            gBoard[i][j].minesAroundCount = minesNegsCount
        }
    }
}



function countMineNegs(cellI, cellJ, mat) {
    var negsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= mat[i].length) continue
            if (mat[i][j].isMine) negsCount++
        }
    }
    return negsCount
}


function lightHintBtn(elBtn, i) {
    if (!gGame.isOn || gDIYisON) return

    elBtn.style.textShadow = '0px 0px 13px red'
    gHintBtnIsOn = true

    switch (i) {
        case 1:
            gHintBtnClicksCount.btn1 += 1
            gSelectedHintBtn = 'btn1'
            break
        case 2:
            gHintBtnClicksCount.btn2 += 1
            gSelectedHintBtn = 'btn2'
            break
        case 3:
            gHintBtnClicksCount.btn3 += 1
            gSelectedHintBtn = 'btn3'
            break
    }

}

function findSafeCell() {
    const safeCells = []
    gSafeClickCount--

    if (gSafeClickCount < 0 || !gGame.isOn || gDIYisON) return

    document.querySelector('.safe-clicks-count span').innerText = gSafeClickCount


    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]

            if (!currCell.isMine && currCell.minesAroundCount === 0 && !currCell.isShown) {
                var coord = { i, j }
                safeCells.push([currCell, coord])
            }
        }
    }

    if (safeCells.length === 0) {
        alert('No safe cell was found 😬')
        return
    }

    var randSafeCell = selectRandCell(safeCells)
    renderCell(randSafeCell[0], randSafeCell[1])

    setTimeout(() => removeMarkedCell(randSafeCell[1]), 2000)

}

function selectRandCell(cells) {
    var randIdx = getRandomInt(0, cells.length)

    if (cells.length >= 3) {
        return cells.splice(randIdx, 1)[0]
    }

    return cells[randIdx]
}

function removeMarkedCell(coord) {
    const selector = getSelector(coord)
    const elTd = document.querySelector(selector)

    if (!gBoard[coord.i][coord.j].isMarked) {
        elTd.classList.remove('mark')
        elTd.innerText = ''
    }
}


function revealSelectedArea(coords) {
    const rowIdxStart = coords[0].i
    const rowIdxEnd = coords[1].i
    const colIdxStart = coords[0].j
    const colIdxEnd = coords[1].j

    const isReverse = colIdxStart > colIdxEnd;
    const jCondition = isReverse ? (j) => j >= colIdxEnd : (j) => j <= colIdxEnd;
    const jStep = isReverse ? -1 : 1;

    for (let i = rowIdxStart; i <= rowIdxEnd; i++) {
        for (let j = colIdxStart; jCondition(j); j += jStep) {
            if (!gBoard[i][j].isMarked) {
                const coord = { i, j };
                renderCell(gBoard[i][j], coord);
            }
        }
    }

    setTimeout(() => coverSelectedArea(rowIdxStart, rowIdxEnd, colIdxStart, colIdxEnd), 1500)
}


function coverSelectedArea(rowIdxStart, rowIdxEnd, colIdxStart, colIdxEnd) {
    const isReverse = colIdxStart > colIdxEnd;
    const jCondition = isReverse ? (j) => j >= colIdxEnd : (j) => j <= colIdxEnd;
    const jStep = isReverse ? -1 : 1;

    for (let i = rowIdxStart; i <= rowIdxEnd; i++) {
        for (let j = colIdxStart; jCondition(j); j += jStep) {
            if (!gBoard[i][j].isShown) {
                var coord = { i, j }
                removeMarkedCell(coord)
            }
        }
    }
}



function turnOnMegaMode() {
    if (gMegaHintIsOn || !gGame.isOn || gDIYisON) return
    gMegaHintIsOn = true

    const elMegaHintModal = document.querySelector('.modal-hint-instruction')
    elMegaHintModal.style.display = 'block'
    elMegaHintModal.innerHTML = `<b> Instruction: 👇 </b><br>
    Select two corners of the <br>
    area you want to reveal`

    setTimeout(() => {
        document.querySelector('.modal-hint-instruction').style.display = 'none'
    }, 2000);
}



function turnOnDarkMode() {
    document.querySelector('body').classList.toggle('dark-mode')
}



function findMineCells() {

    if (gExterminator || !gGame.isOn || gDIYisON) return

    gExterminator = true
    const mineCells = []

    if (gIsFirstClickForPlay) {
        startTimer()
        setMinesInRandCell(2, 2)
        setMineNegsCount()
        gIsFirstClickForPlay = false
    }

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const currCell = gBoard[i][j]

            if (currCell.isMine && !currCell.isShown) {
                var coord = { i, j }
                mineCells.push([currCell, coord])
            }
        }
    }
    changeStatusIsMine(mineCells)
}


function changeStatusIsMine(mineCells) {

    var cellToRemove = (gHiddenMines < 3) ? gHiddenMines : 3

    if (gLevel.MINES === 4) cellToRemove = 1

    for (var i = 0; i < cellToRemove; i++) {
        var randMineCell = selectRandCell(mineCells)

        var coord = { i: randMineCell[1].i, j: randMineCell[1].j }

        gBoard[coord.i][coord.j].isMine = false
        gBoard[coord.i][coord.j].isShown = true
        gGame.shownCount++

        var selector = getSelector(coord)
        var elCell = document.querySelector(selector)
        elCell.classList.add('mark')
        elCell.innerText = ''
    }

    gHiddenMines -= cellToRemove
    gLevel.MINES -= cellToRemove
    gGame.markedCount = gLevel.MINES

    document.querySelector('.flag span').innerText = gLevel.MINES

    setMineNegsCount()
    isVictory()

}


function checkGameOver() {
    if (gLifeCount.length === 0) {
        stopTimer()
        revealMines()
        gGame.isOn = false
        showMsg()
    }
}



function isVictory() {
    const optCellsToReveal = gBoard.length * gBoard[0].length

    if (gGame.shownCount === optCellsToReveal - gLevel.MINES) {
        gIsVictory = true
        gGame.isOn = false
        stopTimer()
        showMsg()

        updateBestScore(gCurrLevel, gGame.secsPassed)
    }

}


function showMsg() {
    const elEmojiBtn = document.querySelector('.emoji-status button')
    elEmojiBtn.innerText = (gIsVictory) ? WIN : LOSE

    document.querySelector('.modal').style.display = 'block'
    const elStatusMsg = document.querySelector('.status-msg')
    elStatusMsg.innerText = (gIsVictory) ? 'Amazing job!' : 'Blew up! 😵'

    setTimeout(() => {
        document.querySelector('.modal').style.display = 'none'
    }, 2000);

}

function getGameState() {
    return {
        board: copyMat(gBoard),
        steps: gStepsOnBoard,
        shownCount: gGame.shownCount,
        markedCount: gGame.markedCount,
        lifeCount: gLifeCount.slice(),
    }
}

function restoreGameState(state) {
    gBoard = state.board
    gStepsOnBoard = state.steps
    gGame.shownCount = state.shownCount
    gGame.markedCount = state.markedCount
    gLifeCount = state.lifeCount

    renderLives()


    if (gStepsOnBoard.length > 0) {
        var prevStep = gStepsOnBoard.pop()
        var coord = prevStep[0][1]

        if (gBoard[coord.i][coord.j].isMarked) {
            gBoard[coord.i][coord.j].isMarked = false

            removeMarkedCell(coord)

            const elFlags = document.querySelector('.flag span')
            elFlags.innerText = gGame.markedCount

        } else {
            if (prevStep) {

                gBoard[coord.i][coord.j].isShown = false
                removeMarkedCell(coord)
            }

            if (prevStep[1].length > 0) {
                for (var i = 0; i < prevStep[1].length; i++) {
                    coord = prevStep[1][i][1]

                    gBoard[coord.i][coord.j].isShown = false
                    removeMarkedCell(coord)
                }
            }
        }
    }
}



function saveStep() {
    gGameStates.push(getGameState())
}


function undoStep() {
    console.log('hi')
    if (!gGame.isOn) return

    if (gGameStates.length > 0) {
        const state = gGameStates.pop()
        restoreGameState(state)
    }
    else return
}

function turnOnManualMode() {
    if (!gIsFirstClickForPlay) return

    gDIYisON = true
    gIsFirstClickForPlay = false

    document.querySelector('.mines-count').hidden = false
    showMinesNumToLocate()
    renderBoard(gBoard)
}

function showMinesNumToLocate() {
    document.querySelector('.located-mines').innerHTML = gClicksCountOnBoard
    document.querySelector('.all-mines').innerHTML = gLevel.MINES
}

function setMinesByUser(cell, coord) {
    gBoard[coord.i][coord.j].isMine = true
    renderCell(cell, coord)


}


function getBestScore(level) {
    return localStorage.getItem(`bestScore-${level}`) || Infinity
}

function getBestScoreName(level) {
    return localStorage.getItem(`bestScoreName-${level}`) || 'N/A'
}

function updateBestScore(level, newScore) {
    var bestScore = Number(getBestScore(level))

    if (newScore < bestScore) {
        localStorage.setItem(`bestScore-${level}`, newScore)
        var playerName = prompt('New Record! Enter your name');
        localStorage.setItem(`bestScoreName-${level}`, playerName)
    }
}

function initializeBestScores() {
    const names = ['Gal Ben David', 'Yuval Ravid', 'Elior Cohen']
    const bestScore = [13, 94, 175]
    for (var i = 0; i < gDifficultyLevels.length; i++) {
        var level = gDifficultyLevels[i]
        if (!localStorage.getItem(`bestScore-${level}`)) {
            localStorage.setItem(`bestScore-${level}`, bestScore[i]);
            localStorage.setItem(`bestScoreName-${level}`, names[i]);
        }

    }
}

function displayBestScores() {
    for (var i = 0; i < gDifficultyLevels.length; i++) {
        const bestScore = getBestScore(gDifficultyLevels[i])

        const bestScoreName = getBestScoreName(gDifficultyLevels[i]);
        document.getElementById(`${gDifficultyLevels[i]}-best-score`).innerText = `${bestScoreName}, ${bestScore} sec`;
    }
}


function closeModal() {
    const modal = document.getElementById('first-modal')
    modal.style.display = 'none'
}



function initializeParameters() {
    gGame.isOn = true
    gDIYisON = false
    gIsFirstClickForPlay = true
    gClicksCountOnBoard = 0
    gIsVictory = false

    gGame.markedCount = gLevel.MINES
    gGame.shownCount = 0
    gLifeCount = [HEART, HEART, HEART]

    gHintBtnIsOn = false

    gExterminator = false

    gSafeClickCount = 3

    gHiddenMines = gLevel.MINES

    gGameStates = []
    gStepsOnBoard = []

    gClickedCellsInDIY = []

    gMegaHintIsOn = false
    gClickCountInMegaMode = 0
    gSelectedCells = []

    gHintBtnClicksCount.btn1 = 0
    gHintBtnClicksCount.btn2 = 0
    gHintBtnClicksCount.btn3 = 0


    renderLives()

    const elFlagsNum = document.querySelector('.flag span')
    elFlagsNum.innerText = gLevel.MINES

    gTimerDisplay.innerText = '000';

    const elEmojiBtn = document.querySelector('.emoji-status button')
    elEmojiBtn.innerText = NORMAL

    document.querySelector('.safe-clicks-count span').innerText = gSafeClickCount

    document.querySelector('.mines-count').hidden = true

    const elHintBtn = document.querySelectorAll('.hint-btn')
    for (var i = 0; i < elHintBtn.length; i++) {
        elHintBtn[i].style.textShadow = ''
    }

}


function renderLives() {
    const elLifeCount = document.querySelector('.life span')
    elLifeCount.innerHTML = gLifeCount.join().replaceAll(',', '')
}


function initializeMinesNum(size = 4) {
    switch (size) {
        case 4:
            gLevel.MINES = 4
            gCurrLevel = gDifficultyLevels[0]
            break
        case 8:
            gLevel.MINES = 10
            gCurrLevel = gDifficultyLevels[1]
            break
        case 12:
            gLevel.MINES = 15
            gCurrLevel = gDifficultyLevels[2]
            break
    }

}


function startTimer() {
    var startTime = Date.now();

    gTimerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const seconds = Math.floor(elapsedTime / 1000);

        gGame.secsPassed = seconds

        gTimerDisplay.innerText = gGame.secsPassed.toString().padStart(3, '0');
    }, 1);
}

function stopTimer() {
    clearInterval(gTimerInterval);
}
