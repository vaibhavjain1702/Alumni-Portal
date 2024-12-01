document.addEventListener('DOMContentLoaded', () => {
    const alumniGrid = document.getElementById('alumni-grid');
    const messageModal = document.getElementById('messageModal');
    const closeModal = document.querySelector('.modal .close');
    const messageForm = document.getElementById('messageForm');
    const recipientInput = document.getElementById('recipient');
    const recentMessages = document.getElementById('recentMessages');

    function fetchAlumni() {
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
            .catch(error => console.error('Error fetching alumni data:', error));
    }

    function fetchRecentMessages() {
        fetch('/messages')
            .then(response => response.json())
            .then(messages => {
                recentMessages.innerHTML = '';
                if (messages.length === 0) {
                    recentMessages.innerHTML = '<p>No recent messages.</p>';
                    return;
                }
                messages.forEach(msg => {
                    const messageCard = document.createElement('div');
                    messageCard.className = 'message-card';
                    messageCard.innerHTML = `
                        <p><strong>To:</strong> ${msg.recipient}</p>
                        <p>${msg.message}</p>
                        <p><small>${new Date(msg.timestamp).toLocaleString()}</small></p>
                        <span class="message-status">${msg.status === 'sent' ? '✔' : ''}</span>
                    `;
                    recentMessages.appendChild(messageCard);
                });
            })
            .catch(error => console.error('Error fetching messages:', error));
    }

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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipient, message })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  console.log('Message sent:', data);
                  messageModal.style.display = 'none';
                  messageForm.reset();
                  fetchRecentMessages(); // Fetch recent messages after sending new one
              } else {
                  console.error('Failed to send message');
              }
          })
          .catch(error => console.error('Error sending message:', error));
    });

    fetchAlumni();
    fetchRecentMessages(); // Fetch recent messages on page load
});