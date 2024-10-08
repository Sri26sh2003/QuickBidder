const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Auction state
let auction = {
  itemName: 'Vintage Camera',
  itemImage: '/images/vintage-camera.jpg', // New property for the image
  currentBid: 100,
  highestBidder: 'No bids yet',
  auctionEndTime: Date.now() + 300000, // Auction ends in 5 minutes
};

let auctionEnded = false;

// Function to restart the auction
function restartAuction() {
  auctionEnded = false;
  auction.currentBid = 100; // Or set this to the desired initial value
  auction.highestBidder = 'No bids yet';
  auction.auctionEndTime = Date.now() + 300000; // Restart auction duration (5 minutes)

  io.emit('auctionUpdate', auction); // Notify all clients about the auction restart
  io.emit('timerUpdate', auction.auctionEndTime - Date.now()); // Update the timer on all clients
}

// Function to check and update auction time
function checkAuctionTime() {
  const timeLeft = auction.auctionEndTime - Date.now();
  if (timeLeft <= 0 && !auctionEnded) {
    auctionEnded = true;
    io.emit('auctionEnded', auction.highestBidder);
    setTimeout(restartAuction, 3000); // Wait 3 seconds before restarting the auction
  }
}

// Broadcast auction updates every second
setInterval(() => {
  checkAuctionTime();
  if (!auctionEnded) {
    io.emit('timerUpdate', auction.auctionEndTime - Date.now());
  }
}, 1000);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send current auction state to the new user
  socket.emit('auctionUpdate', auction);

  // Handle new bids
  socket.on('newBid', (data) => {
    if (auctionEnded) {
      socket.emit('bidRejected', 'Auction has ended!');
      return;
    }

    if (data.bidAmount > auction.currentBid) {
      auction.currentBid = data.bidAmount;
      auction.highestBidder = data.userName;

      // Broadcast updated auction state to all clients
      io.emit('auctionUpdate', auction);

      // Extend auction by 1 minute if bid is placed within the last minute
      const timeLeft = auction.auctionEndTime - Date.now();
      if (timeLeft < 60000) {
        auction.auctionEndTime += 60000; // Extend auction by 1 minute
        io.emit('timerExtended', 'Auction extended by 1 minute!');
      }
    } else {
      socket.emit('bidRejected', 'Your bid must be higher than the current bid!');
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
