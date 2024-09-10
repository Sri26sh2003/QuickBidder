const socket = io();

// Get references to UI elements
const itemNameEl = document.getElementById('item-name');
const currentBidEl = document.getElementById('current-bid');
const highestBidderEl = document.getElementById('highest-bidder');
const timeRemainingEl = document.getElementById('time-remaining');
const itemImageEl = document.getElementById('item-image'); // Image element
const userNameEl = document.getElementById('user-name');
const bidAmountEl = document.getElementById('bid-amount');
const placeBidBtn = document.getElementById('place-bid');
const feedbackMessageEl = document.getElementById('feedback-message');

// Handle auction update
socket.on('auctionUpdate', (auction) => {
  itemNameEl.textContent = auction.itemName;
  currentBidEl.textContent = auction.currentBid;
  highestBidderEl.textContent = auction.highestBidder;
  itemImageEl.src = auction.itemImage; // Set the image source
  feedbackMessageEl.textContent = ''; // Clear feedback on update
});

// Handle timer updates
socket.on('timerUpdate', (timeLeft) => {
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  timeRemainingEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});

// Handle bid rejection
socket.on('bidRejected', (message) => {
  feedbackMessageEl.textContent = message;
});

// Handle auction end
socket.on('auctionEnded', (winner) => {
  feedbackMessageEl.textContent = `Auction has ended! Winner: ${winner}`;
  placeBidBtn.disabled = true;
  bidAmountEl.disabled = true;
  userNameEl.disabled = true;
});

// Place a new bid
placeBidBtn.addEventListener('click', () => {
  const userName = userNameEl.value;
  const bidAmount = Number(bidAmountEl.value);

  if (userName && bidAmount) {
    socket.emit('newBid', { userName, bidAmount });
  } else {
    feedbackMessageEl.textContent = 'Please enter your name and bid amount!';
  }
});

// Handle auction timer extension
socket.on('timerExtended', (message) => {
  feedbackMessageEl.textContent = message;
});
