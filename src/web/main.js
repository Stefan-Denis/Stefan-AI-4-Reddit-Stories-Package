// Draggable windows
let dragElement, shiftX, shiftY

document.querySelectorAll('.move-window').forEach(circle => {
    circle.addEventListener('mousedown', function (event) {
        dragElement = this.parentNode.parentNode
        let rect = dragElement.getBoundingClientRect()
        shiftX = event.clientX - (rect.left + window.scrollX) // subtract the left margin of the red dot
        shiftY = event.clientY - (rect.top + window.scrollY) // subtract the top margin of the red dot
        event.preventDefault()
    })
})

document.addEventListener('mousemove', function (event) {
    if (dragElement) {
        dragElement.style.left = event.clientX - shiftX + 'px'
        dragElement.style.top = event.clientY - shiftY + 'px'
    }
})

document.addEventListener('mouseup', function () {
    dragElement = null
})

let imageWindow = document.querySelector('.input:nth-of-type(1)')
let startWindow = document.querySelector('.input:nth-of-type(2)')
let editorWindow = document.querySelector('.input:nth-of-type(3)')

window.addEventListener('resize', function () {
    [imageWindow, editorWindow, startWindow].forEach(element => {
        let rect = element.getBoundingClientRect()

        if (rect.right > window.innerWidth) {
            element.style.left = window.innerWidth - rect.width + 'px'
        }

        if (rect.bottom > window.innerHeight) {
            element.style.top = window.innerHeight - rect.height + 'px'
        }
    })
})

let highestZIndex = 0

document.querySelectorAll('.input').forEach(window => {
    window.addEventListener('mousedown', function () {
        // Increase the highest z-index and set it on the clicked window
        highestZIndex++
        this.style.zIndex = highestZIndex
    })
})

function resetWindows() {
    imageWindow.style.left = '150px'
    imageWindow.style.top = '100px'

    startWindow.style.left = '150px'
    startWindow.style.top = '380px'

    editorWindow.style.left = '150px'
    editorWindow.style.top = '700px'
}

document.querySelectorAll('.reset-position').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.input').forEach(window => {
            if (window instanceof HTMLDivElement) window.style.transition = 'all 0.7s ease-in-out', window.style.width = '500px'
        })
        resetWindows()
        setTimeout(() => {
            document.querySelectorAll('.input').forEach(window => {
                if (window instanceof HTMLDivElement) window.style.transition = 'none'
            })
        }, 700)
    })
})

// Startup positioning
resetWindows()

/**
 * Creates a notification for the application
 * @param {string} message 
 */
function createNotification(message) {
    // Remove all previous notifications
    document.querySelectorAll('.notification').forEach(notification => notification.remove())

    // Create and insert the notification
    const HTML = `<div class='notification glass'>${message}</div>`
    document.body.insertAdjacentHTML('beforeend', HTML)

    // Play the notification sound
    new Audio('static/notification.mp3').play()

    // Remove the notification
    const notification = document.querySelector('.notification')
    setTimeout(() => {
        notification.classList.add('remove')
        notification.addEventListener('animationend', () => {
            notification.remove()
        })
    }, 2000 * (message.length / 20))
}

// Titlebar green button actions
document.querySelectorAll('.image-green-titlebar-button').forEach(button => button.addEventListener('click', () => createNotification(`What a beautiful image! Use the buttons below to perform image changes.`)))
document.querySelector('.submit-story').addEventListener('click', () => createNotification(`Don't worry, the story auto saves!`))

// Start production
document.querySelectorAll('.start-production').forEach(button => button.addEventListener('click', handleClick))

function handleClick() {
    // Send Notification
    createNotification(`Starting Video Creation Now. A new window should pop up.`)

    // Disable all the buttons
    document.querySelectorAll('.start-production').forEach(button => {
        button.disabled = true
        button.classList.add('disabled')
        button.removeEventListener('click', handleClick)
    })

    // Send the request to the server
    fetch('/start-production')
        .then(() => {
            createNotification(`Video creation Finished!`)
            document.querySelectorAll('.start-production').forEach(button => {
                button.disabled = false
                button.classList.remove('disabled')
                button.addEventListener('click', handleClick)
            })
        })
        .catch(() => createNotification(`Video creation failed!`))
}

// HTTP Requests
/**
 * Send the story to the server on keystroke
 */
document.getElementById('textarea').addEventListener('input', (event) => {
    const story = event.target.value
    fetch('/story/change', {
        headers: { 'Content-Type': 'text/plain' },
        method: 'POST',
        body: story
    })
})

/**
 * Retrieve the story from the server on page load
 */
fetch('/story/retrieve')
    .then(response => response.text())
    .then(story => document.getElementById('textarea').value = story)

/**
 * Send Image to the server
 */
document.getElementById('submit-image').addEventListener('click', () => {
    document.getElementById('image').click()
})

document.getElementById('image').addEventListener('change', () => {
    const image = document.getElementById('image').files[0]
    const formData = new FormData()
    formData.append('image', image)
    fetch('/image/add', {
        method: 'POST',
        body: formData
    })
        .then(() => createNotification(`Image successfully uploaded!`))
        .then(() => setTimeout(() => window.location.reload(), 2000))
        .catch(() => createNotification(`Image upload failed!`))
})

/**
 * Retrieve the image on initial page load
 */
fetch('/image/retrieve')
    .then(response => response.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob)

        // Create a new img element
        const img = document.createElement('img')
        img.src = url

        // Append the img element to the image-container
        const container = document.getElementById('image-container')
        container.appendChild(img)
    })

/**
 * Remove the image from the server
 */
document.getElementById('remove-image').addEventListener('click', () => {
    fetch('/image/remove', { method: 'get' })
        .then(() => createNotification(`Image successfully removed!`))
        .then(() => setTimeout(() => window.location.reload(), 2000))
        .catch(() => createNotification(`Image removal failed!`))
})

/**
 * Send the image title to the server
 */
document.getElementById('image-title').addEventListener('input', (event) => {
    const title = event.target.value
    fetch('/image/title/set', {
        headers: { 'Content-Type': 'text/plain' },
        method: 'POST',
        body: title
    })
})

/**
 * Get the title and add it to the input field on page load
 */
fetch('/image/title/get')
    .then(response => response.text())
    .then(title => document.getElementById('image-title').value = title)