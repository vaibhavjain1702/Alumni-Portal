document.addEventListener('DOMContentLoaded', () => {
    const jobGrid = document.getElementById('job-grid');
    const jobModal = document.getElementById('jobModal');
    const closeModal = document.querySelector('.modal .close');
    const jobForm = document.getElementById('jobForm');
    const jobIdInput = document.getElementById('jobId');
    const recentApplications = document.getElementById('recentApplications');

    function fetchJobs() {
        fetch('/jobs')
            .then(response => response.json())
            .then(jobs => {
                jobs.forEach(job => {
                    const card = document.createElement('div');
                    card.className = 'job-card';
                    card.innerHTML = `
                        <h3>${job.title}</h3>
                        <p>${job.company}</p>
                        <p>${job.location}</p>
                        <button data-id="${job.id}">Apply</button>
                    `;
                    jobGrid.appendChild(card);
                });

                document.querySelectorAll('.job-card button').forEach(button => {
                    button.addEventListener('click', () => {
                        jobIdInput.value = button.getAttribute('data-id');
                        jobModal.style.display = 'block';
                    });
                });
            })
            .catch(error => console.error('Error fetching job data:', error));
    }

    function fetchRecentApplications() {
        fetch('/applications')
            .then(response => response.json())
            .then(applications => {
                recentApplications.innerHTML = '';
                if (applications.length === 0) {
                    recentApplications.innerHTML = '<p>No recent applications.</p>';
                    return;
                }
                applications.forEach(app => {
                    const applicationCard = document.createElement('div');
                    applicationCard.className = 'application-card';
                    applicationCard.innerHTML = `
                        <p><strong>For:</strong> Job ID ${app.jobId}</p>
                        <p><strong>Name:</strong> ${app.applicantName}</p>
                        <p><strong>Email:</strong> ${app.applicantEmail}</p>
                        <p><strong>Cover Letter:</strong> ${app.coverLetter}</p>
                        <p><small>${new Date(app.timestamp).toLocaleString()}</small></p>
                        <p><a href="${app.resume}" download>Download Resume</a></p>
                    `;
                    recentApplications.appendChild(applicationCard);
                });
            })
            .catch(error => console.error('Error fetching applications:', error));
    }

    closeModal.addEventListener('click', () => {
        jobModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == jobModal) {
            jobModal.style.display = 'none';
        }
    });

    jobForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(jobForm);
        
        fetch('/apply', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  console.log('Application submitted:', data);
                  jobModal.style.display = 'none';
                  jobForm.reset();
                  fetchRecentApplications(); // Fetch recent applications after submitting a new one
              } else {
                  console.error('Failed to submit application');
              }
          })
          .catch(error => console.error('Error submitting application:', error));
    });

    fetchJobs();
    fetchRecentApplications(); // Fetch recent applications on page load
});