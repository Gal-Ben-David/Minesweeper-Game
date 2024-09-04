'use strict'

const BOMB = '💣'
const FLAG = '🚩'


var gBoard
var gLifeCount
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


function onInit() {
    gBoard = buildBoard()
    initializeMinesNum()
    setMinesInRandCell()
    setMinesNegsCount()
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
            // if (i === 2 && j === 2) board[i][j].isMine = true
            // if (i === 3 && j === 1) board[i][j].isMine = true
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

            // if (cell.isMine) var cellValue = BOMB
            // else if (cell.minesAroundCount === 0) cellValue = ''
            // else cellValue = cell.minesAroundCount

            const className = (cell.isMine) ? ' bomb' : ''
            const tdId = `cell-${i}-${j}`

            strHtml += `<td id="${tdId}" onclick="cellClicked(this, ${i}, ${j})" 
            oncontextmenu="onCellMarked(event, this, ${i}, ${j})" 
            class="cover ${className}"></td>`
        }
        strHtml += '</tr>'
    }
    const elMat = document.querySelector('.game-board')
    elMat.innerHTML = strHtml
}



function createBoardPerDifficulty(size) {
    gBoard = buildBoard(size)
    initializeMinesNum(size)
    setMinesInRandCell()
    renderBoard(gBoard)
    setMinesNegsCount()
    initializeParameters()
}


function setMinesInRandCell() {
    for (var i = 0; i < gLevel.MINES; i++) {
        var cell = randCell()
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

    isVictory()
    const clickedCell = gBoard[cellI][cellJ]

    if (clickedCell.isMarked) return
    clickedCell.isShown = true

    elCell.classList.add('mark')
    elCell.innerText = (clickedCell.minesAroundCount === 0) ? '' : clickedCell.minesAroundCount

    if (clickedCell.isMine) {
        elCell.innerText = BOMB
        gLifeCount--
        const elLifeCount = document.querySelector('.life span')
        elLifeCount.innerText = gLifeCount
        checkGameOver()

    } else gGame.shownCount++

    if (!clickedCell.isMine && clickedCell.minesAroundCount === 0) {
        expandShown(gBoard, elCell, cellI, cellJ)
    }
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
                currCell.isShown = true
                gGame.shownCount++


                const coord = { i, j }
                const selector = getSelector(coord)
                const elTd = document.querySelector(selector)
                elTd.classList.add('mark')
                elTd.innerText = (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount
            }
        }
    }
}


//function for future
function removeMarkedNegs(elCell, cellI, cellJ) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= gBoard[i].length) continue

            const coord = { i, j }
            const selector = getSelector(coord)
            const elTd = document.querySelector(selector)
            elTd.classList.remove('mark')
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
    renderBoard(gBoard)
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


function checkGameOver() {
    if (gLifeCount === 0) {
        revealMines()
        gGame.isOn = false

        document.querySelector('.modal').style.display = 'block'
        document.querySelector('.modal h2').innerText = 'Game 0ver!'
    }
}

function isVictory() {
    const optCellsToReveal = gBoard.length * gBoard[0].length
    if (gGame.shownCount === optCellsToReveal - gLevel.MINES) {
        gGame.isOn = false

        document.querySelector('.modal').style.display = 'block'
        document.querySelector('.modal h2').innerText = 'Victorious! 💪'
    }
}


function initializeParameters() {
    gGame.isOn = true
    gGame.markedCount = gLevel.MINES
    gGame.shownCount = 0
    gLifeCount = 3

    const elLifeCount = document.querySelector('.life span')
    elLifeCount.innerText = gLifeCount

    const elFlagsNum = document.querySelector('.flag span')
    elFlagsNum.innerText = gLevel.MINES

    document.querySelector('.modal').style.display = 'none'
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

