// --- Firebase Initialization ---
async function initializeApp() {
    try {
        const response = await fetch('/api/firebase-config');
        const firebaseConfig = await response.json();

        if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
            firebase.initializeApp(firebaseConfig);
            const db = firebase.firestore();

            // --- Rooms & Availability Logic ---
            const updateAvailabilityDisplay = async () => {
                const hotelDoc = await db.collection('hotel').doc('details').get();
                if (hotelDoc.exists) {
                    const data = hotelDoc.data();
                    const availableCount = document.getElementById('availableRoomsCount');
                    const adminCount = document.getElementById('currentRoomCount');
                    if (availableCount) availableCount.innerText = data.availableRooms;
                    if (adminCount) adminCount.innerText = data.totalRooms;
                } else {
                    // Seed initial data if not exists
                    await db.collection('hotel').doc('details').set({
                        totalRooms: 50,
                        availableRooms: 50,
                        pricePerDay: 500
                    });
                }
            };

            if (document.getElementById('availableRoomsCount') || document.getElementById('currentRoomCount')) {
                updateAvailabilityDisplay();
            }

            // --- Contact Form Logic ---
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const contactData = {
                        name: document.getElementById('name').value,
                        mobile: document.getElementById('mobile').value,
                        comment: document.getElementById('comment').value,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    try {
                        await db.collection('contacts').add(contactData);
                        alert("Message sent successfully!");
                        contactForm.reset();
                    } catch (err) {
                        console.error("Error sending message:", err);
                    }
                });
            }

            // --- Booking Logic ---
            const bookingForm = document.getElementById('bookingForm');
            const bRooms = document.getElementById('bRooms');
            const bDays = document.getElementById('bDays');
            const totalPriceDisplay = document.getElementById('totalPriceDisplay');

            if (bRooms && bDays) {
                const calculateTotal = () => {
                    const total = bRooms.value * bDays.value * 500;
                    totalPriceDisplay.innerText = `Total Price: ₹${total}`;
                };
                bRooms.addEventListener('input', calculateTotal);
                bDays.addEventListener('input', calculateTotal);
            }

            if (bookingForm) {
                bookingForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const roomsRequested = parseInt(document.getElementById('bRooms').value);
                    const daysRequested = parseInt(document.getElementById('bDays').value);

                    const hotelRef = db.collection('hotel').doc('details');

                    try {
                        await db.runTransaction(async (transaction) => {
                            const hotelDoc = await transaction.get(hotelRef);
                            if (!hotelDoc.exists) throw "Hotel data not found";

                            const available = hotelDoc.data().availableRooms;
                            if (available < roomsRequested) {
                                throw "Not enough rooms available!";
                            }

                            const bookingData = {
                                name: document.getElementById('bName').value,
                                mobile: document.getElementById('bMobile').value,
                                rooms: roomsRequested,
                                days: daysRequested,
                                totalPrice: roomsRequested * daysRequested * 500,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            transaction.update(hotelRef, {
                                availableRooms: available - roomsRequested
                            });

                            const bookingRef = db.collection('bookings').doc();
                            transaction.set(bookingRef, bookingData);
                        });

                        alert("Booking Successful!");
                        bookingForm.reset();
                        updateAvailabilityDisplay();
                    } catch (err) {
                        alert("Booking failed: " + err);
                    }
                });
            }

            // --- Admin Dashboard Logic ---
            if (document.getElementById('bookingsList')) {
                // Load Bookings
                db.collection('bookings').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                    const list = document.getElementById('bookingsList');
                    list.innerHTML = "";
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        list.innerHTML += `
                            <tr>
                                <td>${data.name}</td>
                                <td>${data.mobile}</td>
                                <td>${data.rooms}</td>
                                <td>${data.days}</td>
                                <td>₹${data.totalPrice}</td>
                            </tr>
                        `;
                    });
                });

                // Load Messages
                db.collection('contacts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
                    const list = document.getElementById('messagesList');
                    list.innerHTML = "";
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        list.innerHTML += `
                            <tr>
                                <td>${data.name}</td>
                                <td>${data.mobile}</td>
                                <td>${data.comment}</td>
                            </tr>
                        `;
                    });
                });

                // Update Room Count
                const updateBtn = document.getElementById('updateRoomsBtn');
                if (updateBtn) {
                    updateBtn.addEventListener('click', async () => {
                        const newCount = parseInt(document.getElementById('newRoomCount').value);
                        try {
                            await db.collection('hotel').doc('details').update({
                                totalRooms: newCount,
                                availableRooms: newCount // Resetting availability for demo purposes
                            });
                            alert("Room count updated!");
                        } catch (err) {
                            console.error(err);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
    }
}

initializeApp();
// --- UI Enhancement Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Nav Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;
        revealElements.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // Smooth Scroll Offset for sticky header
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });
});
