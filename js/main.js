'use strict'

const BOMB = '💣'
const FLAG = '🚩'


var gBoard
var gLifeCount
var gFirstClick
var gHintBtnIsOn

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

const gTimerDisplay = document.getElementById('timer');

function onInit() {
    gBoard = buildBoard()
    initializeMinesNum()
    renderBoard(gBoard)
    initializeParameters()
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
        while (cellI === cell.i && cellJ === cell.j) {
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


    if (gFirstClick) {
        setMinesInRandCell(cellI, cellJ)
        setMinesNegsCount()
        gFirstClick = false
    }

    if (clickedCell.isMarked || clickedCell.isShown) return

    // if (gHintBtnIsOn) {
    //     renderCell(clickedCell, coord)
    //     expandShown(gBoard, elCell, cellI, cellJ)

    //     setTimeout(() => {
    //         removeMarkedNegs(elCell, cellI, cellJ)
    //         elCell.classList.remove('mark')
    //         elCell.innerText = ''
    //         gHintBtnIsOn = false

    //     }, 1000);
    //     return
    // }


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
    gLifeCount--
    const elLifeCount = document.querySelector('.life span')
    elLifeCount.innerText = gLifeCount
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

                if (!currCell.isShown) gGame.shownCount++
                currCell.isShown = true

                const coord = { i, j }
                renderCell(currCell, coord)
            }
        }
    }
}



function renderCell(cell, coord) {
    const selector = getSelector(coord)
    const elTd = document.querySelector(selector)
    elTd.classList.add('mark')
    elTd.innerText = (cell.minesAroundCount === 0) ? '' : cell.minesAroundCount
}



function removeMarkedNegs(elCell, cellI, cellJ) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue

            const coord = { i, j }
            const selector = getSelector(coord)
            const elTd = document.querySelector(selector)
            elTd.classList.toggle('mark')
            elTd.innerText = ''
        }
    }
}



function revealMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {

                gBoard[i][j].isShown = true
                const coord = { i, j }
                const selector = getSelector(coord)
                const elTd = document.querySelector(selector)
                elTd.innerText = BOMB
                elTd.classList.add('mark')
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


function lightHintBtn(elBtn) {
    elBtn.style.backgroundColor = 'white'
    gHintBtnIsOn = true
}


function checkGameOver() {
    if (gLifeCount === 0) {
        stopTimer()
        revealMines()
        gGame.isOn = false

        const elEmojiBtn = document.querySelector('.emoji-status button')
        elEmojiBtn.innerText = '🤯'
    }
}



function isVictory() {
    const optCellsToReveal = gBoard.length * gBoard[0].length

    if (gGame.shownCount === optCellsToReveal - gLevel.MINES) {
        gGame.isOn = false
        stopTimer()

        const elEmojiBtn = document.querySelector('.emoji-status button')
        elEmojiBtn.innerText = '😎'
    }
}



function initializeParameters() {
    gFirstClick = true
    gGame.isOn = true
    gHintBtnIsOn = false
    gGame.markedCount = gLevel.MINES
    gGame.shownCount = 0
    gLifeCount = 3

    const elLifeCount = document.querySelector('.life span')
    elLifeCount.innerText = gLifeCount

    const elFlagsNum = document.querySelector('.flag span')
    elFlagsNum.innerText = gLevel.MINES

    gTimerDisplay.innerText = '000';

    const elEmojiBtn = document.querySelector('.emoji-status button')
    elEmojiBtn.innerText = '🙂'

    const elHintBtn = document.querySelectorAll('.hint-btn')
    for (var i = 0; i < elHintBtn.length; i++) {
        elHintBtn[i].style.backgroundColor = 'none'
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
