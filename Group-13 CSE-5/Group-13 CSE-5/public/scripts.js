document.addEventListener('DOMContentLoaded', () => {
    const alumniGrid = document.getElementById('alumni-grid');
    const messageModal = document.getElementById('messageModal');
    const closeModal = document.querySelector('.modal .close');
    const messageForm = document.getElementById('messageForm');
    const recipientInput = document.getElementById('recipient');
    const messageList = document.getElementById('message-list');

    fetch('/alumni')
        .then(response => response.json())
        .then(alumni => {
            alumni.forEach(alum => {
                const card = document.createElement('div');
                card.className = 'alumni-card';
                card.innerHTML = `
                    <img src="${alum.photo}" alt="${alum.name}">
                    <h3>${alum.name}</h3>
                    <p>${alum.interests}</p>
                    <p>${alum.location}</p>
                    <button data-name="${alum.name}">Connect</button>
                `;
                alumniGrid.appendChild(card);
            });

            document.querySelectorAll('.alumni-card button').forEach(button => {
                button.addEventListener('click', () => {
                    recipientInput.value = button.getAttribute('data-name');
                    messageModal.style.display = 'block';
                });
            });
        })
        .catch(error => {
            console.error('Error fetching alumni data:', error);
        });

    fetch('/messages')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(msg => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${msg.recipient}</strong>: ${msg.message} <em>(${new Date(msg.timestamp).toLocaleString()})</em>
                `;
                messageList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
        });

    closeModal.addEventListener('click', () => {
        messageModal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target == messageModal) {
            messageModal.style.display = 'none';
        }
    });

    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const recipient = recipientInput.value;
        const message = document.getElementById('message').value;

        fetch('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, message })
        }).then(response => response.json())
          .then(data => {
              console.log('Message sent:', data);
              messageModal.style.display = 'none';
              messageForm.reset();
              
              // Update recent messages list
              const newListItem = document.createElement('li');
              newListItem.innerHTML = `
                  <strong>${recipient}</strong>: ${message} <em>(${new Date().toLocaleString()})</em>
              `;
              messageList.insertBefore(newListItem, messageList.firstChild);
              if (messageList.children.length > 10) { // Keep only the 10 most recent messages
                  messageList.removeChild(messageList.lastChild);
              }
          })
          .catch(error => console.error('Error sending message:', error));
    });
});