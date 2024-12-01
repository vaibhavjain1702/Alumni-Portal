const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');

// const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
// Serve Registration Page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registeration.html'));
});

// Handle Registration
app.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validate passwords
    if (password !== confirmPassword) {
        return res.send(`
            <h1>Registration Failed</h1>
            <p>Passwords do not match.</p>
            <p><a href="/register">Try Again</a></p>
        `);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data in a file
    const userEntry = `
Username: ${username}
Email: ${email}
Password: ${hashedPassword}
------------------------------
`;

    fs.appendFileSync('users.txt', userEntry, (err) => {
        if (err) {
            console.error('Failed to write to file', err);
            return res.status(500).send('Internal Server Error');
        }
    });

    res.send(`
        <h1>Registration Successful</h1>
        <p>Thank you, <strong>${username}</strong>, for registering.</p>
        <p><a href="/login">Go to Login</a></p>
    `);
});

// Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/dashboard-alumni', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-alumni.html'));
});
app.get('/events-students', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'events-students.html'));
});

// Handle Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile('users.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read users file', err);
            return res.status(500).send('Internal Server Error');
        }

        const users = data.split('------------------------------\n').filter(entry => entry.trim());

        let loginSuccess = false;
        users.forEach(user => {
            const [storedUsername, storedEmail, storedHashedPassword] = user.trim().split('\n').map(line => line.split(': ')[1]);

            if (storedEmail === email && bcrypt.compareSync(password, storedHashedPassword)) {
                loginSuccess = true;
            }
        });

        if (loginSuccess) {
            res.send(`
                <h1>Login Successful</h1>
                <p>Welcome, <strong>${email}</strong>!</p>
                <p><a href="/dashboard">Go to Dashboard</a></p>
            `);
        } else {
            res.send(`
                <h1>Login Failed</h1>
                <p>Invalid email or password.</p>
                <p><a href="/login">Try Again</a></p>
            `);
        }
    });
});

// Serve Forgot Password Page
app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Handle Forgot Password
const otps = {};
app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    fs.readFile('users.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read users file', err);
            return res.status(500).send('Internal Server Error');
        }

        if (data.includes(`Email: ${email}`)) {
            const otp = crypto.randomInt(100000, 999999); // Generate 6-digit OTP
            otps[email] = otp;

            // Send OTP via email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'worldwidemaster4@gmail.com', // Your Gmail address
                    pass: 'gxbvkunsuvexuyko' // Your Gmail app password
                }
            });
             

            const mailOptions = {
                from: 'worldwidemaster4@gmail.com',
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP is: ${otp}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email', error);
                    return res.status(500).send('Error sending email');
                }

                res.redirect(`/otp-verification?email=${encodeURIComponent(email)}`);
            });
        } else {
            res.send(`
                <h1>Email Not Found</h1>
                <p>No account found with the email <strong>${email}</strong>.</p>
                <p><a href="/forgot-password">Try Again</a></p>
            `);
        }
    });
});

// Serve OTP Verification Page
app.get('/otp-verification', (req, res) => {
    const email = req.query.email;

    res.send(`
        <h1>OTP Sent</h1>
        <p>An OTP has been sent to <strong>${email}</strong>. Please check your email.</p>
        <form action="/verify-otp" method="POST">
            <label for="otp">Enter OTP:</label>
            <input type="text" id="otp" name="otp" required>
            <input type="hidden" name="email" value="${email}">
            <button type="submit">Verify OTP</button>
        </form>
    `);
});

// Handle OTP Verification
app.post('/verify-otp', (req, res) => {
    const { otp, email } = req.body;

    if (otps[email] && otps[email] == otp) {
        delete otps[email]; // Invalidate OTP after use
        res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
    } else {
        res.send(`
            <h1>Invalid OTP</h1>
            <p>The OTP you entered is incorrect.</p>
            <p><a href="/forgot-password">Request a new OTP</a></p>
        `);
    }
});

// Serve Reset Password Page
app.get('/reset-password', (req, res) => {
    const email = req.query.email;

    res.send(`
        <h1>Reset Password</h1>
        <form action="/reset-password" method="POST">
            <label for="password">New Password:</label>
            <input type="password" id="password" name="password" required>
            <input type="hidden" name="email" value="${email}">
            <button type="submit">Reset Password</button>
        </form>
    `);
});

// Handle Password Reset
app.post('/reset-password', async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    fs.readFile('users.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read users file', err);
            return res.status(500).send('Internal Server Error');
        }

        const updatedData = data.replace(new RegExp(`(Email: ${email}\\nPassword: ).*`, 'g'), `$1${hashedPassword}`);

        fs.writeFile('users.txt', updatedData, (err) => {
            if (err) {
                console.error('Failed to update users file', err);
                return res.status(500).send('Internal Server Error');
            }

            res.send(`
                <h1>Password Reset Successful</h1>
                <p>Your password has been reset successfully.</p>
                <p><a href="/login">Go to Login</a></p>
            `);
        });
    });
});


// Handle the donation POST request
app.post('/donate', (req, res) => {
    const { name, email, amount } = req.body;

    // Simple validation
    if (!name || !email || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid donation data' });
    }

    // Format the donation data
    const donationEntry = `
Name: ${name}
Email: ${email}
Amount: $${amount}
------------------------------
`;

    // Append the donation data to donations.txt file
    fs.appendFile('donations.txt', donationEntry, (err) => {
        if (err) {
            console.error('Failed to write to donations file', err);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        // Send a success response
        res.json({ success: true });
    });
});



app.get('/Connect', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// Alumni data
const alumni = [
    { name: "Alice Johnson", photo: "https://randomuser.me/api/portraits/women/1.jpg", interests: "Software Engineering, AI", location: "San Francisco, CA" },
    { name: "Bob Smith", photo: "https://randomuser.me/api/portraits/men/1.jpg", interests: "Data Science, Mathematics", location: "New York, NY" },
    { name: "Carol White", photo: "https://randomuser.me/api/portraits/women/2.jpg", interests: "Cybersecurity, Network Engineering", location: "Austin, TX" },
    { name: "Dave Brown", photo: "https://randomuser.me/api/portraits/men/2.jpg", interests: "Project Management, Agile", location: "Chicago, IL" },
    { name: "Eve Black", photo: "https://randomuser.me/api/portraits/women/3.jpg", interests: "Marketing, Digital Strategies", location: "Los Angeles, CA" },
    { name: "Frank Green", photo: "https://randomuser.me/api/portraits/men/3.jpg", interests: "HR, Talent Acquisition", location: "Seattle, WA" },
    { name: "Grace Blue", photo: "https://randomuser.me/api/portraits/women/4.jpg", interests: "Content Creation, Media", location: "Miami, FL" },
    { name: "Hank Yellow", photo: "https://randomuser.me/api/portraits/men/4.jpg", interests: "Finance, Investments", location: "Boston, MA" },
    { name: "Ivy Orange", photo: "https://randomuser.me/api/portraits/women/5.jpg", interests: "Healthcare Management", location: "Houston, TX" },
    { name: "Jack Purple", photo: "https://randomuser.me/api/portraits/men/5.jpg", interests: "Education, E-Learning", location: "San Diego, CA" },
    { name: "Kaitlyn Red", photo: "https://randomuser.me/api/portraits/women/6.jpg", interests: "Software Development, Backend Systems", location: "Denver, CO" },
    { name: "Leo Cyan", photo: "https://randomuser.me/api/portraits/men/6.jpg", interests: "Entrepreneurship, Startups", location: "Brooklyn, NY" },
    { name: "Mia Pink", photo: "https://randomuser.me/api/portraits/women/7.jpg", interests: "AI, Machine Learning", location: "San Jose, CA" },
    { name: "Nate Gold", photo: "https://randomuser.me/api/portraits/men/7.jpg", interests: "Data Analytics, Statistics", location: "Philadelphia, PA" },
    { name: "Olive Silver", photo: "https://randomuser.me/api/portraits/women/8.jpg", interests: "UI/UX Design, User Research", location: "Portland, OR" },
    { name: "Pete Bronze", photo: "https://randomuser.me/api/portraits/men/8.jpg", interests: "Product Management", location: "Minneapolis, MN" },
    { name: "Quinn White", photo: "https://randomuser.me/api/portraits/women/9.jpg", interests: "Supply Chain Logistics", location: "Atlanta, GA" },
    { name: "Rick Brown", photo: "https://randomuser.me/api/portraits/men/9.jpg", interests: "Business Development, Sales", location: "Phoenix, AZ" },
    { name: "Sophia Grey", photo: "https://randomuser.me/api/portraits/women/10.jpg", interests: "Operations Management", location: "Charlotte, NC" },
    { name: "Tommy Black", photo: "https://randomuser.me/api/portraits/men/10.jpg", interests: "Network Security", location: "Orlando, FL" },
    { name: "Ursula Green", photo: "https://randomuser.me/api/portraits/women/11.jpg", interests: "Legal Consulting", location: "San Antonio, TX" },
    { name: "Victor Blue", photo: "https://randomuser.me/api/portraits/men/11.jpg", interests: "Risk Management", location: "Columbus, OH" },
    { name: "Wendy Yellow", photo: "https://randomuser.me/api/portraits/women/12.jpg", interests: "Public Relations", location: "Salt Lake City, UT" },
    { name: "Xander Orange", photo: "https://randomuser.me/api/portraits/men/12.jpg", interests: "Corporate Strategy", location: "Las Vegas, NV" },
    { name: "Yasmin Red", photo: "https://randomuser.me/api/portraits/women/13.jpg", interests: "Talent Management", location: "Newark, NJ" },
    { name: "Zach Black", photo: "https://randomuser.me/api/portraits/men/13.jpg", interests: "Cloud Computing", location: "Nashville, TN" }
];

// In-memory message storage for alumni
let alumniMessages = [];

app.get('/alumni', (req, res) => {
    res.json(alumni);
});

// API to send a message to an alumni
app.post('/message', (req, res) => {
    const { recipient, message } = req.body;
    
    // Validate input
    if (!recipient || !message) {
        return res.status(400).json({ message: 'Recipient and message are required' });
    }

    const newMessage = { recipient, message, timestamp: new Date(), status: "sent" };
    alumniMessages.push(newMessage);
    res.json({ success: true, message: 'Message sent successfully!' });
});

// Retrieve all messages
app.get('/alumniMessages', (req, res) => {
    res.json(alumniMessages);
});


// Temporary in-memory event storage
let events = [];

// Route to handle event creation (POST request)
app.post('/create-event', (req, res) => {
    const { name, date, type, description } = req.body;

    // Validate the required fields
    if (!name || !date || !description) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    // Add the new event to the events array
    const newEvent = { name, date, type, description, registered: false };
    events.push(newEvent);

    // Respond with success message
    res.json({ message: 'Event created successfully!' });
});

// Route to get all events (GET request)
app.get('/events', (req, res) => {
    res.json(events); // Return the array of events as JSON
});

// Route to handle event registration (POST request)
app.post('/register-event', (req, res) => {
    const { index } = req.body;

    // Check if event exists
    if (events[index]) {
        events[index].registered = true; // Mark the event as registered
        res.json({ message: `You have successfully registered for ${events[index].name}.` });
    } else {
        res.status(404).json({ message: 'Event not found.' });
    }
});


// API to register for an event
app.post('/register-event', (req, res) => {
    const { index } = req.body;

    if (index >= 0 && index < events.length) {
        events[index].registered = true;
        res.status(200).json({ message: 'Successfully registered for the event' });
    } else {
        res.status(400).json({ message: 'Event not found' });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

const jobs = [
    { id: 1, title: "Software Engineer", company: "Google", location: "Mountain View, CA", description: "Develop innovative software solutions." },
    { id: 2, title: "Product Manager", company: "Apple", location: "Cupertino, CA", description: "Lead product development projects." },
    // Add more jobs (up to 25) as needed
];

let applications = [];

app.get('/jobs', (req, res) => {
    res.json(jobs);
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


app.post('/apply', upload.single('resume'), (req, res) => {
    const { jobId, applicantName, applicantEmail, coverLetter } = req.body;
    const resume = req.file ? req.file.path : null;
    const newApplication = { jobId, applicantName, applicantEmail, coverLetter, resume, timestamp: new Date() };
    applications.push(newApplication);
    res.json({ success: true, message: 'Application submitted successfully!' });
});
app.get('/applications', (req, res) => {
    res.json(applications);
});


// Serve Alumni Registration Page
app.get('/registerAlmuni', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'alumni-register.html'));
});

 // Handle Alumni Registration
 app.post('/registerAlmuni', async (req, res) => {
    const { name, email, password, interests, location, jobTitle, company, experience } = req.body;

    // Validate password length, etc.
    if (!name || !email || !password || !interests || !location || !jobTitle || !company || !experience) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store alumni data in a file
    const alumniEntry = `
Name: ${name}
Email: ${email}
Password: ${hashedPassword}
Interests: ${interests}
Location: ${location}
Job Title: ${jobTitle}
Company: ${company}
Experience: ${experience}
------------------------------
`;

    fs.appendFile('alumni.txt', alumniEntry, (err) => {
        if (err) {
            console.error('Failed to write to alumni file', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    res.json({ message: 'Registration successful' });
});




app.get('/alumni-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'alumni-login.html'));
});

// Handle Alumni Login
app.post('/alumni-login', (req, res) => {
    const { email, password } = req.body;

    fs.readFile('alumni.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read alumni file', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        const alumniUsers = data.split('------------------------------\n').filter(entry => entry.trim());

        let loginSuccess = false;
        let alumniName = '';

        alumniUsers.forEach(alumni => {
            const [storedName, storedEmail, storedHashedPassword] = alumni.trim().split('\n').map(line => line.split(': ')[1]);

            if (storedEmail === email && bcrypt.compareSync(password, storedHashedPassword)) {
                loginSuccess = true;
                alumniName = storedName;
            }
        });

        if (loginSuccess) {
            res.json({ message: 'Login successful', alumniName });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
