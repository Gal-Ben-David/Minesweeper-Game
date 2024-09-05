'use strict'

const BOMB = '💣'
const FLAG = '🚩'
const HEART = '🧡'
const WIN = '😎'
const LOSE = '🤯'
const NORMAL = '🙂'


var gBoard
var gLifeCount
var gIsFirstClick

var gHintBtnIsOn
var gSelectedHintBtn

var gSafeClickCount

var gMegaHintIsOn
var gClickCountInMegaMode
var gSelectedCells

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


const gTimerDisplay = document.getElementById('timer');


function onInit() {
    gBoard = buildBoard()
    initializeMinesNum()
    renderBoard(gBoard)
    initializeParameters()
    stopTimer()
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
                isMarked: false
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

            strHtml += `<td id="${tdId}" onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="onCellMarked(event, this, ${i}, ${j})" 
            class="cover"></td>`
        }
        strHtml += '</tr>'
    }
    const elMat = document.querySelector('.game-board')
    elMat.innerHTML = strHtml
}



function createBoardPerDifficulty(size) {
    stopTimer()
    gBoard = buildBoard(size)
    initializeMinesNum(size)
    renderBoard(gBoard)
    initializeParameters()
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

    const clickedCell = gBoard[i][j]
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

    const clickedCell = gBoard[cellI][cellJ]
    var coord = { i: cellI, j: cellJ }


    if (gIsFirstClick) {
        startTimer()
        setMinesInRandCell(cellI, cellJ)
        setMinesNegsCount()
        gIsFirstClick = false
    }

    if (clickedCell.isMarked || clickedCell.isShown) return

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
        expandShown(gBoard, elCell, cellI, cellJ)
    }

    isVictory()
}



function updateLifeCounter() {
    gLifeCount.pop()
    const elLifeCount = document.querySelector('.life span')
    elLifeCount.innerText = gLifeCount.join().replaceAll(',', '')
}



function getSelector(coord) {
    return `#cell-${coord.i}-${coord.j}`
}



function expandShown(board, elCell, cellI, cellJ) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue

            const currCell = gBoard[i][j]

            if (!currCell.isMarked) {

                if (!gHintBtnIsOn) {
                    if (!currCell.isShown) gGame.shownCount++
                    currCell.isShown = true
                }

                const coord = { i, j }
                renderCell(currCell, coord)
            }
        }
    }
}



function renderCell(cell, coord) {
    var cellValue
    const selector = getSelector(coord)
    const elTd = document.querySelector(selector)

    elTd.classList.add('mark')
    if (gBoard[coord.i][coord.j].isMine) cellValue = BOMB
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



function setMinesNegsCount() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var minesNegsCount = countNegs(i, j, gBoard)
            gBoard[i][j].minesAroundCount = minesNegsCount
        }
    }
}



function countNegs(cellI, cellJ, mat) {
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

    if (gSafeClickCount < 0) return

    document.querySelector('h4 span').innerText = gSafeClickCount


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

    for (var i = rowIdxStart; i <= rowIdxEnd; i++) {
        for (var j = colIdxStart; j <= colIdxEnd; j++) {
            if (!gBoard[i][j].isMarked) {
                var coord = { i, j }
                renderCell(gBoard[i][j], coord)
            }
        }
    }

    setTimeout(() => coverSelectedArea(rowIdxStart, rowIdxEnd, colIdxStart, colIdxEnd), 1500)
}

function coverSelectedArea(rowIdxStart, rowIdxEnd, colIdxStart, colIdxEnd) {

    for (var i = rowIdxStart; i <= rowIdxEnd; i++) {
        for (var j = colIdxStart; j <= colIdxEnd; j++) {
            if (!gBoard[i][j].isShown) {
                var coord = { i, j }
                removeMarkedCell(coord)
            }
        }
    }

}


function turnOnMegaMode() {
    if (gMegaHintIsOn) return
    gMegaHintIsOn = true

    const elMegaHintModal = document.querySelector('.modal-hint-instruction')
    elMegaHintModal.style.display = 'block'
    elMegaHintModal.innerText = `instructions: 👇
    1. click the area's top-left corner
    2. click the area's bottom-right corner`

    setTimeout(() => {
        document.querySelector('.modal-hint-instruction').style.display = 'none'
    }, 3000);
}

function turnOnDarkMode() {
    document.querySelector('.game-zone').classList.toggle('dark-mode')
    document.querySelector('.game-details').classList.toString('dark-mode')
}

function findMineCells() {
    const mineCells = []

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
    var countRemovedMineCell = 0

    for (var i = 0; i < 3; i++) {
        var randMineCell = selectRandCell(mineCells)

        gBoard[randMineCell[1].i][randMineCell[1].j].isMine = false
        countRemovedMineCell++
    }

    gLevel.MINES -= countRemovedMineCell
    document.querySelector('.flag span').innerText = gLevel.MINES

    setMinesNegsCount()
}


function checkGameOver() {
    if (gLifeCount.length === 0) {
        stopTimer()
        revealMines()
        gGame.isOn = false

        const elEmojiBtn = document.querySelector('.emoji-status button')
        elEmojiBtn.innerText = LOSE

        document.querySelector('.modal').style.display = 'block'
        document.querySelector('.status-msg').innerText = 'Blew up! 😵'

        setTimeout(() => {
            document.querySelector('.modal').style.display = 'none'
        }, 2000);
    }
}


function isVictory() {
    const optCellsToReveal = gBoard.length * gBoard[0].length

    if (gGame.shownCount === optCellsToReveal - gLevel.MINES) {
        gGame.isOn = false
        stopTimer()

        const elEmojiBtn = document.querySelector('.emoji-status button')
        elEmojiBtn.innerText = WIN

        document.querySelector('.modal').style.display = 'block'
        document.querySelector('.status-msg').innerText = 'Amazing job!'

        setTimeout(() => {
            document.querySelector('.modal').style.display = 'none'
        }, 2000);

    }
}



function initializeParameters() {
    gIsFirstClick = true
    gGame.isOn = true
    gGame.markedCount = gLevel.MINES
    gGame.shownCount = 0
    gLifeCount = [HEART, HEART, HEART]

    gHintBtnIsOn = false

    gSafeClickCount = 3

    gMegaHintIsOn = false
    gClickCountInMegaMode = 0
    gSelectedCells = []

    gHintBtnClicksCount.btn1 = 0
    gHintBtnClicksCount.btn2 = 0
    gHintBtnClicksCount.btn3 = 0


    const elLifeCount = document.querySelector('.life span')
    elLifeCount.innerText = gLifeCount.join().replaceAll(',', '')

    const elFlagsNum = document.querySelector('.flag span')
    elFlagsNum.innerText = gLevel.MINES

    gTimerDisplay.innerText = '000';

    const elEmojiBtn = document.querySelector('.emoji-status button')
    elEmojiBtn.innerText = NORMAL

    document.querySelector('h4 span').innerText = gSafeClickCount

    const elHintBtn = document.querySelectorAll('.hint-btn')
    for (var i = 0; i < elHintBtn.length; i++) {
        elHintBtn[i].style.textShadow = ''
    }

}



function initializeMinesNum(size = 4) {
    switch (size) {
        case 4:
            gLevel.MINES = 4
            break
        case 8:
            gLevel.MINES = 15
            break
        case 12:
            gLevel.MINES = 30
            break
    }

}


function startTimer() {
    var startTime = Date.now();

    gGame.secsPassed = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const seconds = Math.floor(elapsedTime / 1000);

        gTimerDisplay.innerText = seconds.toString().padStart(3, '0');
    }, 1);
}

function stopTimer() {
    clearInterval(gGame.secsPassed);
}
