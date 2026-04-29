/* ═══════════════════════════════════════════════════════════════
   RESORT BOOKING — MAIN APPLICATION JAVASCRIPT
══════════════════════════════════════════════════════════════ */

// ─── Property Photos (loaded from /api/gallery) ────────────────
let PHOTOS = [];

// ─── State ─────────────────────────────────────────────────────
let property = null;
let guests = { adults: 2, children: 0 };
let selectedCheckin = null;
let selectedCheckout = null;
let lightboxIndex = 0;
let checkinPicker = null;
let checkoutPicker = null;
let descriptionExpanded = false;
let razorpayKeyId = null; // Razorpay key ID (loaded from server)
let currentRoomRates = {};
let currentRoomAvailability = {};
let selectedRoomPrice = null;
let selectedRoomId = null;

// ─── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadProperty();
  await loadPhotosFromApi();
  await loadRoomPhotosFromApi();
  loadPhotos();
  if (document.getElementById('checkin-input')) initDatePickers();
  initScrollEffect();
  initScrollReveal();
  initTabs();
  initAvailability();
  loadReviews();
  loadTeamSection();
  await initRazorpay();
  checkPaymentReturn(); // handle redirect back from Razorpay
});

// ─── Load Property (dummy data — template mode) ────────────────
async function loadProperty() {
  property = window.CLIENT_CONFIG?.property || {
    name: 'Horizon Resort & Café',
    tagline: 'Your riverside escape awaits',
    location: 'Riverside District, Karnataka, India',
    phone: '+91 98765 43210',
    email: 'hello@horizonresort.in',
    currency: 'INR',
    price_per_night: 3500,
    max_guests: 10,
    description: 'A unique riverside retreat set on 5 acres of lush grounds along the river in Coastal Karnataka. King rooms, queen rooms, riverside tents, on-site café, kayaking, archery, and campfire experiences.',
    contact_widget: {
      whatsapp_enabled: true,
      whatsapp_number: '919876543210',
      call_enabled: true,
      call_number: '+91 98765 43210'
    }
  };
  if (window.CLIENT_CONFIG?.rooms) ROOMS = window.CLIENT_CONFIG.rooms;
  populatePage(property);
}

function populatePage(p) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
  const setAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };
  const setHref = (id, val) => { const el = document.getElementById(id); if (el) el.href = val; };

  const currency = p.currency === 'INR' ? '₹' : p.currency;
  const price = Number(p.price_per_night).toLocaleString('en-IN');

  // Page meta
  const location = p.location ? p.location.split(',').slice(-2).join(',').trim() : 'Karnataka';
  set('page-title', `${p.name} | Direct Booking | ${location}`);
  const desc = p.description ? p.description.split('\n')[0].slice(0, 160) : `Book directly with ${p.name}. Best rate guaranteed.`;
  setAttr('page-desc', 'content', desc);
  setAttr('og-title', 'content', `${p.name} | ${location}`);
  setAttr('og-desc',  'content', desc);

  // Header
  set('nav-property-name', p.name);
  set('nav-tagline', p.location || 'Luxury Resort & Stays');
  set('logo-initial', p.name.charAt(0).toUpperCase());
  setHref('nav-phone-link', `tel:${p.phone}`);
  set('nav-phone-text', p.phone);

  // Footer
  set('footer-name', p.name);
  set('footer-name-copy', p.name);
  setHref('footer-email-link', `mailto:${p.email}`);
  set('footer-email', p.email);
  setHref('footer-phone-link', `tel:${p.phone}`);
  set('footer-phone', p.phone);

  // Modals
  set('success-prop-name', p.name);

  // Contact widget
  initContactWidget(p);
}

// ─── Load Photos (dummy data — template mode) ─────────────────
async function loadPhotosFromApi() {
  if (window.CLIENT_CONFIG?.photos) { PHOTOS = window.CLIENT_CONFIG.photos; return; }
  PHOTOS = [
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1200&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c4a49d9b?w=1200&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
    'https://images.unsplash.com/photo-1549294413-26f195471c9b?w=1200&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    'https://images.unsplash.com/photo-1519098635131-4c8f806d1e76?w=1200&q=80',
  ];
}

// ─── Load Room Photos (template mode — photos already in ROOMS) ─
async function loadRoomPhotosFromApi() {
  // No API in template mode — ROOMS array already has Unsplash photos
}

// ─── Build & Load Gallery Photos (dynamic, up to 30) ───────────
const MAX_PHOTOS = 30;

function loadPhotos() {
  buildGalleryViewer(PHOTOS);
}

function getPlaceholderGradient(i) {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  return gradients[i % gradients.length];
}

// ─── Gallery Viewer — unified slider + thumbnail strip ─────────
let _gvIndex  = 0;
let _gvPhotos = [];
let _gvTimer  = null;

function buildGalleryViewer(photos) {
  const track  = document.getElementById('gv-track');
  const thumbs = document.getElementById('gallery-thumbs-strip');
  const badge  = document.getElementById('gv-badge');
  if (!track || !thumbs) return;

  _gvPhotos = photos.slice(0, MAX_PHOTOS);
  _gvIndex  = 0;
  track.innerHTML  = '';
  thumbs.innerHTML = '';

  _gvPhotos.forEach((src, i) => {
    // Main slide
    const slide = document.createElement('div');
    slide.className = 'gv-slide';
    const img = document.createElement('img');
    img.alt     = `Resort photo ${i + 1}`;
    img.loading = i === 0 ? 'eager' : 'lazy';
    img.src     = src;
    img.onerror = () => { slide.style.background = getPlaceholderGradient(i); };
    slide.appendChild(img);
    slide.addEventListener('click', () => openLightbox(i));
    track.appendChild(slide);

    // Thumbnail
    const thumb = document.createElement('div');
    thumb.className = 'gv-thumb' + (i === 0 ? ' active' : '');
    const tImg = document.createElement('img');
    tImg.alt     = `Photo ${i + 1}`;
    tImg.loading = 'lazy';
    tImg.src     = src;
    tImg.onerror = () => { thumb.style.background = getPlaceholderGradient(i); };
    thumb.appendChild(tImg);
    thumb.addEventListener('click', () => { gvGoTo(i); _gvRestartAuto(); });
    thumbs.appendChild(thumb);
  });

  if (badge) badge.textContent = `1 / ${_gvPhotos.length}`;
  _gvStartAuto();

  // Touch swipe on main viewer
  let _touchX = 0;
  track.addEventListener('touchstart', e => { _touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = _touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { gvSlide(diff > 0 ? 1 : -1); _gvRestartAuto(); }
  }, { passive: true });

  // Pause auto-advance on hover
  const viewer = document.getElementById('gallery-viewer');
  if (viewer) {
    viewer.addEventListener('mouseenter', _gvStopAuto);
    viewer.addEventListener('mouseleave', _gvStartAuto);
  }
}

function gvGoTo(idx) {
  _gvIndex = ((idx % _gvPhotos.length) + _gvPhotos.length) % _gvPhotos.length;
  const track = document.getElementById('gv-track');
  const badge = document.getElementById('gv-badge');
  if (track) track.style.transform = `translateX(-${_gvIndex * 100}%)`;
  if (badge) badge.textContent = `${_gvIndex + 1} / ${_gvPhotos.length}`;
  const allThumbs = document.querySelectorAll('.gv-thumb');
  allThumbs.forEach((t, i) => t.classList.toggle('active', i === _gvIndex));
  // Scroll active thumbnail into view within the strip only — never scrolls the page
  const strip = document.getElementById('gallery-thumbs-strip');
  const activeThumb = allThumbs[_gvIndex];
  if (strip && activeThumb) {
    const thumbCenter = activeThumb.offsetLeft + activeThumb.offsetWidth / 2;
    strip.scrollLeft = thumbCenter - strip.offsetWidth / 2;
  }
}

function gvSlide(dir) {
  gvGoTo(_gvIndex + dir);
}

function _gvStartAuto() {
  _gvStopAuto();
  _gvTimer = setInterval(() => gvSlide(1), 2500);
}

function _gvStopAuto() {
  if (_gvTimer) { clearInterval(_gvTimer); _gvTimer = null; }
}

function _gvRestartAuto() {
  _gvStopAuto();
  _gvStartAuto();
}

// ─── Date Pickers ──────────────────────────────────────────────
function initDatePickers() {
  const today = new Date();

  checkinPicker = flatpickr('#checkin-input', {
    minDate: 'today',
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'D, M j',
    disableMobile: true,
    onChange: function (dates) {
      if (dates.length) {
        selectedCheckin = dates[0];
        const nextDay = new Date(dates[0]);
        nextDay.setDate(nextDay.getDate() + 1);
        checkoutPicker.set('minDate', nextDay);
        if (selectedCheckout && selectedCheckout <= selectedCheckin) {
          checkoutPicker.clear();
          selectedCheckout = null;
        }
        updatePriceDisplay();
      }
    }
  });

  checkoutPicker = flatpickr('#checkout-input', {
    minDate: new Date(today.getTime() + 86400000),
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'D, M j',
    disableMobile: true,
    onChange: function (dates) {
      if (dates.length) {
        selectedCheckout = dates[0];
        updatePriceDisplay();
        checkAvailability();
      }
    }
  });
}

// ─── Price Calculation ─────────────────────────────────────────
function updatePriceDisplay() {
  if (!selectedCheckin || !selectedCheckout || !property) return;

  const nights = Math.round((selectedCheckout - selectedCheckin) / 86400000);
  if (nights <= 0) return;

  const set = (id, val, prop = 'textContent') => { const el = document.getElementById(id); if (el) el[prop] = val; };

  // Hide price breakdown — pricing is room-specific and shown in room cards
  const el = document.getElementById('price-breakdown');
  if (el) el.style.display = 'none';

  set('summary-checkin',  formatDate(selectedCheckin));
  set('summary-checkout', formatDate(selectedCheckout));
  set('summary-nights',   `${nights} night${nights > 1 ? 's' : ''}`);
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Availability Check ────────────────────────────────────────
async function checkAvailability() {
  if (!selectedCheckin || !selectedCheckout) return;

  const checkIn = selectedCheckin.toISOString().split('T')[0];
  const checkOut = selectedCheckout.toISOString().split('T')[0];
  const msgEl = document.getElementById('availability-msg');

  // Template mode — always show available
  msgEl.style.display = 'block';
  msgEl.className = 'availability-msg available';
  msgEl.innerHTML = '<i class="fas fa-circle-check"></i> Great news — these dates are available!';
}

// ─── Guest Counter ─────────────────────────────────────────────
function updateGuests(type, delta) {
  if (type === 'adults') {
    guests.adults = Math.max(1, Math.min(guests.adults + delta, property?.max_guests || 10));
  } else {
    guests.children = Math.max(0, Math.min(guests.children + delta, 6));
  }
  document.getElementById('adults-count').textContent = guests.adults;
  document.getElementById('children-count').textContent = guests.children;
  updateGuestsSummary();
}

function updateGuestsSummary() {
  const total = guests.adults + guests.children;
  let summary = `${guests.adults} adult${guests.adults > 1 ? 's' : ''}`;
  if (guests.children > 0) summary += `, ${guests.children} child${guests.children > 1 ? 'ren' : ''}`;
  document.getElementById('guests-summary').textContent = summary;
}

function toggleGuestsPanel() {
  const panel = document.getElementById('guests-panel');
  const chevron = document.getElementById('guests-chevron');
  panel.classList.toggle('open');
  chevron.classList.toggle('open');
}

// ─── Description Toggle ────────────────────────────────────────
function toggleDescription() {
  const desc = document.getElementById('prop-description');
  const btn = document.getElementById('show-more-btn');
  descriptionExpanded = !descriptionExpanded;
  desc.classList.toggle('truncated', !descriptionExpanded);
  btn.innerHTML = descriptionExpanded
    ? 'Show less <i class="fas fa-chevron-up"></i>'
    : 'Show more <i class="fas fa-chevron-down"></i>';
}

// ─── Booking Modal ─────────────────────────────────────────────
function openBookingModal() {
  if (!selectedCheckin || !selectedCheckout) {
    document.getElementById('section-5').scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Highlight the date inputs
    ['avail-checkin', 'avail-checkout'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.outline = '2px solid var(--star)';
        setTimeout(() => { el.style.outline = ''; }, 2000);
      }
    });
    return;
  }
  updatePriceDisplay();
  document.getElementById('booking-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

function closeOnOverlay(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// ─── Razorpay Init (disabled in template mode) ─────────────────
async function initRazorpay() {
  razorpayKeyId = null; // Payment disabled in template/demo mode
}

// ─── Payment return handler (no-op in template mode) ───────────
async function checkPaymentReturn() {
  // No-op in template mode
}

// ─── Booking Submission (template/demo mode) ────────────────────
async function submitBooking(e) {
  e.preventDefault();

  const guestName  = document.getElementById('guest-name').value.trim();
  const guestEmail = document.getElementById('guest-email').value.trim();
  const errorEl    = document.getElementById('form-error');
  errorEl.style.display = 'none';

  if (!selectedCheckin || !selectedCheckout) {
    showFormError('Please select your check-in and check-out dates.');
    return;
  }
  if (!guestName || !guestEmail) {
    showFormError('Please enter your name and email address.');
    return;
  }

  // Show a demo success screen
  closeModal('booking-modal');
  document.getElementById('booking-form').reset();

  const nights  = Math.round((selectedCheckout - selectedCheckin) / 86400000);
  const total   = nights * (selectedRoomPrice || 3500);
  const demoRef = 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase();

  showSuccessModal(
    {
      ref: demoRef,
      check_in:  selectedCheckin.toISOString().split('T')[0],
      check_out: selectedCheckout.toISOString().split('T')[0],
      adults:    guests.adults,
      children:  guests.children,
      status:    'confirmed'
    },
    guestEmail,
    total
  );
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ─── Success Modal ─────────────────────────────────────────────
function showSuccessModal(booking, email, total) {
  const currency = property.currency === 'INR' ? '₹' : property.currency;
  document.getElementById('success-ref').textContent = booking.ref;
  document.getElementById('success-checkin').textContent = formatDateStr(booking.check_in);
  document.getElementById('success-checkout').textContent = formatDateStr(booking.check_out);
  document.getElementById('success-guests').textContent = `${booking.adults} adult${booking.adults > 1 ? 's' : ''}${booking.children > 0 ? `, ${booking.children} child` : ''}`;
  document.getElementById('success-total').textContent = currency + Math.round(total).toLocaleString('en-IN');
  document.getElementById('success-email').textContent = email;

  document.getElementById('success-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function formatDateStr(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Gallery Modal (All Photos) ────────────────────────────────
function openGalleryModal() {
  const grid = document.getElementById('gallery-modal-grid');
  grid.innerHTML = '';
  PHOTOS.forEach((src, i) => {
    const tile = document.createElement('div');
    tile.className = 'gm-tile';
    tile.innerHTML = `
      <img src="${src}" alt="Resort photo ${i + 1}" loading="lazy">
      <div class="gm-overlay"><i class="fas fa-expand"></i></div>
    `;
    tile.addEventListener('click', () => {
      closeGalleryModal();
      openLightbox(i);
    });
    grid.appendChild(tile);
  });
  document.getElementById('gallery-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
  document.getElementById('gallery-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeGalleryOverlay(e) {
  if (e.target === document.getElementById('gallery-modal')) closeGalleryModal();
}

// ─── Photo Lightbox — Carousel + Thumbnails ────────────────────
function openLightbox(index) {
  lightboxIndex = index;
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-img').src = PHOTOS[lightboxIndex];
  document.getElementById('lb-current').textContent = lightboxIndex + 1;
  document.getElementById('lb-total').textContent = PHOTOS.length;
  buildLightboxThumbs();
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function buildLightboxThumbs() {
  const container = document.getElementById('lb-thumbs');
  container.innerHTML = '';
  PHOTOS.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'lb-thumb' + (i === lightboxIndex ? ' active' : '');
    thumb.innerHTML = `<img src="${src}" alt="Photo ${i + 1}" loading="lazy">`;
    thumb.addEventListener('click', (e) => {
      e.stopPropagation();
      lightboxIndex = i;
      document.getElementById('lb-img').src = PHOTOS[i];
      document.getElementById('lb-current').textContent = i + 1;
      updateLightboxThumbs();
    });
    container.appendChild(thumb);
  });
}

function updateLightboxThumbs() {
  const thumbs = document.querySelectorAll('.lb-thumb');
  thumbs.forEach((t, i) => {
    t.classList.toggle('active', i === lightboxIndex);
  });
  // Scroll active thumb into view
  const active = document.querySelector('.lb-thumb.active');
  if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function shiftLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + PHOTOS.length) % PHOTOS.length;
  document.getElementById('lb-img').src = PHOTOS[lightboxIndex];
  document.getElementById('lb-current').textContent = lightboxIndex + 1;
  updateLightboxThumbs();
}

// Touch swipe support for lightbox
(function () {
  let touchStartX = 0;
  const lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) shiftLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

// Keyboard support for lightbox
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  const gm = document.getElementById('gallery-modal');
  if (lb.classList.contains('open')) {
    if (e.key === 'ArrowRight') shiftLightbox(1);
    if (e.key === 'ArrowLeft') shiftLightbox(-1);
    if (e.key === 'Escape') closeLightbox();
  } else if (gm.classList.contains('open')) {
    if (e.key === 'Escape') closeGalleryModal();
  }
});

// ─── Property Guide Tabs ───────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + tab).classList.add('active');
      // Scroll active tab into view on mobile
      btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    });
  });

}

// ─── Room Slider State ─────────────────────────────────────────
const roomSliders = {}; // { roomId: { index, interval } }

// On mobile, slide every 3.5s instead of 2s to reduce GPU load
const _roomSliderInterval = window.innerWidth <= 768 ? 3500 : 2000;

function startRoomSlider(roomId, total) {
  if (roomSliders[roomId]) clearInterval(roomSliders[roomId].interval);
  roomSliders[roomId] = { index: roomSliders[roomId]?.index ?? 0 };
  roomSliders[roomId].interval = setInterval(() => {
    const s = roomSliders[roomId];
    s.index = (s.index + 1) % total;
    updateRoomSlide(roomId, s.index, total);
  }, _roomSliderInterval);
}

function updateRoomSlide(roomId, index, total) {
  const wrap = document.getElementById(`slider-${roomId}`);
  if (!wrap) return;
  wrap.querySelectorAll('.rs-slide').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
  wrap.querySelectorAll('.rs-dot').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
}

function stopRoomSlider(roomId) {
  if (roomSliders[roomId]) clearInterval(roomSliders[roomId].interval);
}

// ─── Room Data ─────────────────────────────────────────────────
let ROOMS = [
  {
    id: 'standard-king',
    name: 'Standard King Room',
    bed: 'King Bed',
    size: '19 m²',
    max_guests: 4,
    total: 2,
    price: 3500,
    desc: 'Spacious and comfortable, our Standard King Rooms feature a plush king-size bed, air conditioning, and a private bathroom. Accommodates up to 2 adults and 2 children (infants welcome at no extra charge) — ideal for families or couples.',
    amenities: [
      { icon: 'fa-wifi',      label: 'Free WiFi' },
      { icon: 'fa-snowflake', label: 'Air Conditioning' },
      { icon: 'fa-shower',    label: 'Private Bathroom' },
      { icon: 'fa-tree',      label: 'Garden / River View' },
      { icon: 'fa-mug-hot',   label: 'Tea & Coffee' },
    ],
    perks: [
      { label: 'À la carte Breakfast', cls: 'green', icon: 'fa-mug-hot' },
      { label: 'River / Garden View',  cls: 'blue',  icon: 'fa-leaf' },
      { label: 'Free Cancellation',    cls: 'blue',  icon: 'fa-rotate-left' },
    ],
    photos: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80',
    ],
  },
  {
    id: 'standard-queen',
    name: 'Standard Queen Room',
    bed: 'Queen Bed',
    size: '19 m²',
    max_guests: 3,
    total: 4,
    price: 3000,
    desc: 'Our Standard Queen Rooms offer a cosy and well-appointed stay with a queen-size bed, air conditioning, and a private bathroom. Accommodates up to 2 adults and 1 child — ideal for couples or small families.',
    amenities: [
      { icon: 'fa-wifi',      label: 'Free WiFi' },
      { icon: 'fa-snowflake', label: 'Air Conditioning' },
      { icon: 'fa-shower',    label: 'Private Bathroom' },
      { icon: 'fa-tree',      label: 'Garden View' },
      { icon: 'fa-mug-hot',   label: 'Tea & Coffee' },
    ],
    perks: [
      { label: 'À la carte Breakfast', cls: 'green', icon: 'fa-mug-hot' },
      { label: 'Garden View',          cls: 'blue',  icon: 'fa-leaf' },
      { label: 'Free Cancellation',    cls: 'blue',  icon: 'fa-rotate-left' },
    ],
    photos: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80',
    ],
  },
  {
    id: 'tents',
    name: 'Tents',
    bed: 'Double Bed',
    size: 'Riverside',
    max_guests: 2,
    total: 4,
    price: 2500,
    desc: 'Sleep to the sound of the flowing river in our cosy tents. A genuine nature experience with a comfortable bed and common washrooms — perfect for travellers who want to feel truly close to the outdoors.',
    amenities: [
      { icon: 'fa-wifi',     label: 'Free WiFi' },
      { icon: 'fa-shower',   label: 'Common Washrooms' },
      { icon: 'fa-water',    label: 'Riverside Location' },
      { icon: 'fa-fire',     label: 'Campfire Setup' },
    ],
    perks: [
      { label: 'À la carte Breakfast', cls: 'green', icon: 'fa-mug-hot' },
      { label: 'Campfire Experience',  cls: 'gold',  icon: 'fa-fire' },
      { label: 'Free Cancellation',    cls: 'blue',  icon: 'fa-rotate-left' },
    ],
    photos: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=900&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=900&q=80',
    ],
  },
];

// Room photo modal state
let rpmPhotos = [];
let rpmIndex  = 0;

// ─── Guests & Rooms Dropdown ───────────────────────────────────
const availGuests = { adults: 2, children: 0, rooms: 1, childAges: [] };

function toggleGuestDropdown() {
  const trigger = document.getElementById('as-guests-trigger');
  trigger.classList.toggle('open');
}

// Close when clicking outside
document.addEventListener('click', e => {
  const trigger = document.getElementById('as-guests-trigger');
  if (trigger && !trigger.contains(e.target)) trigger.classList.remove('open');
});

function adjustAvailGuest(type, delta) {
  if (type === 'adults') {
    availGuests.adults = Math.max(1, Math.min(8, availGuests.adults + delta));
    document.getElementById('asg-adults').textContent = availGuests.adults;
  } else if (type === 'children') {
    availGuests.children = Math.max(0, Math.min(6, availGuests.children + delta));
    document.getElementById('asg-children').textContent = availGuests.children;
    // Sync childAges array length
    while (availGuests.childAges.length < availGuests.children) availGuests.childAges.push(null);
    availGuests.childAges.length = availGuests.children;
    renderChildAges();
  } else if (type === 'rooms') {
    availGuests.rooms = Math.max(1, Math.min(5, availGuests.rooms + delta));
    document.getElementById('asg-rooms').textContent = availGuests.rooms;
  }
  // Disable minus btn at minimum
  updateAsgBtns();
  updateGuestSummary();
}

function renderChildAges() {
  const container = document.getElementById('asg-child-ages');
  container.innerHTML = '';
  for (let i = 0; i < availGuests.children; i++) {
    const row = document.createElement('div');
    row.className = 'asg-child-row';
    row.innerHTML = `
      <label>Child ${i + 1} age</label>
      <select class="asg-child-age" onchange="availGuests.childAges[${i}]=+this.value">
        <option value="">Select age</option>
        ${Array.from({length: 18}, (_,a) =>
          `<option value="${a}" ${availGuests.childAges[i]===a?'selected':''}>${a === 0 ? 'Under 1' : a + ' year' + (a>1?'s':'')}</option>`
        ).join('')}
      </select>
    `;
    container.appendChild(row);
  }
}

function updateAsgBtns() {
  // Disable − buttons at their minimums
  document.querySelectorAll('#as-guests-panel .asg-btn').forEach(btn => {
    btn.disabled = false;
  });
  const rows = document.querySelectorAll('#as-guests-panel .asg-row:not(.asg-row-rooms) .asg-counter, #as-guests-panel .asg-row-rooms .asg-counter');
  // Re-evaluate per value
  [['adults',1],['children',0],['rooms',1]].forEach(([type, min]) => {
    const el = document.getElementById(`asg-${type}`);
    if (!el) return;
    const btn = el.previousElementSibling;
    if (btn) btn.disabled = availGuests[type] <= min;
  });
}

function updateGuestSummary() {
  const { adults, children, rooms } = availGuests;
  const parts = [`${adults} adult${adults>1?'s':''}`];
  if (children) parts.push(`${children} child${children>1?'ren':''}`);
  parts.push(`${rooms} room${rooms>1?'s':''}`);
  document.getElementById('as-guests-summary').textContent = parts.join(' · ');
}

// ─── Availability Section ──────────────────────────────────────
function initAvailability() {
  let availCheckoutPicker;

  const isMobile = window.innerWidth <= 640;

  const commonBase = {
    showMonths: isMobile ? 1 : 2,
    disableMobile: true,
    dateFormat: 'D, j M Y',
    altInput: false,
    nextArrow: '<i class="fas fa-chevron-right"></i>',
    prevArrow: '<i class="fas fa-chevron-left"></i>',
    onOpen() {
      // Only scroll on mobile — on desktop the card is already visible and
      // scrolling while the calendar is open causes click misses on dates
      if (window.innerWidth <= 640) {
        setTimeout(() => {
          document.querySelector('.avail-search-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 10);
      }
    },
  };

  const availCheckinPicker = flatpickr('#avail-checkin', {
    ...commonBase,
    minDate: 'today',
    onChange(dates) {
      if (!dates[0]) return;
      selectedCheckin = dates[0];

      const nextDay = new Date(dates[0]);
      nextDay.setDate(nextDay.getDate() + 1);
      availCheckoutPicker.set('minDate', nextDay);

      if (selectedCheckout && selectedCheckout <= dates[0]) {
        availCheckoutPicker.clear();
        selectedCheckout = null;
      }

      setTimeout(() => availCheckoutPicker.open(), 50);
    },
  });

  availCheckoutPicker = flatpickr('#avail-checkout', {
    ...commonBase,
    minDate: new Date(Date.now() + 86400000),
    onChange(dates) {
      if (!dates[0]) return;
      selectedCheckout = dates[0];
      fetchRoomRates().then(() => renderRooms());
    },
  });

  // Make icon and label clicks open the picker (not just the input)
  document.getElementById('asc-checkin-wrap').addEventListener('click', e => {
    if (e.target.id !== 'avail-checkin') availCheckinPicker.open();
  });
  document.getElementById('asc-checkout-wrap').addEventListener('click', e => {
    if (e.target.id !== 'avail-checkout') availCheckoutPicker.open();
  });

  updateAsgBtns();
  renderRooms();
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchRoomRates() {
  // Template mode — use static rates from ROOMS array
  currentRoomRates = {};
  currentRoomAvailability = {};
  ROOMS.forEach(room => {
    currentRoomRates[room.id] = { nightly_rate: room.price };
    currentRoomAvailability[room.id] = { available: true, rooms_left: room.total };
  });
}

function checkRoomAvailability() {
  const cin  = document.getElementById('avail-checkin').value;
  const cout = document.getElementById('avail-checkout').value;
  if (!cin || !cout) {
    document.getElementById('avail-checkin').closest('.asc-field').style.outline = '2px solid var(--error)';
    setTimeout(() => {
      document.getElementById('avail-checkin').closest('.asc-field').style.outline = '';
    }, 1500);
    return;
  }
  fetchRoomRates().then(() => renderRooms());
  // Scroll to results with a flash to confirm action
  const resultsCard = document.querySelector('.avail-results-card');
  if (resultsCard) {
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    resultsCard.classList.remove('avail-flash');
    void resultsCard.offsetWidth;
    resultsCard.classList.add('avail-flash');
    setTimeout(() => resultsCard.classList.remove('avail-flash'), 900);
  }
}

function renderRooms() {
  const hasDates = selectedCheckin && selectedCheckout;
  const nights   = hasDates
    ? Math.round((selectedCheckout - selectedCheckin) / 86400000)
    : 0;
  const currency = (property && property.currency === 'INR') ? '₹' : '₹';

  // Toggle prompt vs list
  document.getElementById('avail-prompt').classList.toggle('hidden', hasDates);

  const list = document.getElementById('room-list');
  // Clear any running sliders before re-render
  Object.keys(roomSliders).forEach(id => stopRoomSlider(id));
  list.innerHTML = '';

  ROOMS.forEach(room => {
    const nightlyBase = currentRoomRates[room.id]?.nightly_rate ?? null;
    const nightly   = nightlyBase !== null ? Math.round(nightlyBase * 1.18) : null;
    const total     = nightly !== null ? formatPrice(nightly, currency) : '—';
    const fullTotal = nightly !== null ? formatPrice(nightly * nights, currency) : '—';
    const avail    = getRoomAvailability(room);

    const slides = room.photos.map((src, i) =>
      `<div class="rs-slide ${i === 0 ? 'active' : ''}">
         <img src="${src}" alt="${room.name} photo ${i+1}" loading="${i===0?'eager':'lazy'}">
       </div>`
    ).join('');

    const dots = room.photos.map((_, i) =>
      `<span class="rs-dot ${i === 0 ? 'active' : ''}"></span>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <div class="rc-photo" id="slider-${room.id}">
        <div class="rs-track" onclick="openRoomPhotos('${room.id}')">${slides}</div>
        ${hasDates ? `<div class="rc-avail-badge ${avail.cls}">${avail.label}</div>` : ''}
        <div class="rc-photo-badge"><i class="fas fa-images"></i> ${room.photos.length} photos</div>
        <div class="rs-dots">${dots}</div>
      </div>
      <div class="rc-details">
        <div class="rc-header">
          <h3 class="rc-title">${room.name}</h3>
          <div class="rc-meta">
            <span class="rc-badge"><i class="fas fa-bed"></i> ${room.bed}</span>
            <span class="rc-badge"><i class="fas fa-ruler-combined"></i> ${room.size}</span>
            <span class="rc-badge"><i class="fas fa-users"></i> Up to ${room.max_guests}</span>
          </div>
        </div>
        <p class="rc-desc">${room.desc}</p>
        <div class="rc-amenities">
          ${room.amenities.map(a => `
            <div class="rc-amenity"><i class="fas ${a.icon}"></i> ${a.label}</div>
          `).join('')}
        </div>
        <div class="rc-perks">
          ${room.perks.map(p => `
            <span class="rc-perk ${p.cls}"><i class="fas ${p.icon}"></i> ${p.label}</span>
          `).join('')}
        </div>
        <div class="rc-footer">
          ${hasDates ? `
            <div class="rc-price-block">
              <div class="rc-price">${total} <span>/ night</span></div>
              <div class="rc-gst">Inclusive of 18% GST</div>
              ${nights > 1 ? `<div class="rc-total">${fullTotal} total for ${nights} nights</div>` : ''}
            </div>
            <button class="btn-room-book" ${avail.cls === 'sold-out' || nightly === null ? 'disabled' : ''}
              onclick="${nightly !== null ? `bookRoom('${room.id}', '${room.name}', ${nightly})` : ''}">
              ${avail.cls === 'sold-out' ? 'Sold Out' : nightly === null ? 'Rate Unavailable' : 'Reserve This Room'}
            </button>
          ` : `
            <div class="rc-no-dates">
              <span class="rc-count-badge">${room.total} rooms</span>
              <span>Select dates above to see pricing</span>
            </div>
            <button class="btn-room-select-dates" onclick="scrollToAvailSearch()">
              <i class="fas fa-calendar-days"></i> Select Dates
            </button>
          `}
        </div>
      </div>
    `;
    list.appendChild(card);

    // Pause slider on hover, resume on leave (desktop)
    const sliderEl = document.getElementById(`slider-${room.id}`);
    sliderEl.addEventListener('mouseenter', () => stopRoomSlider(room.id));
    sliderEl.addEventListener('mouseleave', () => startRoomSlider(room.id, room.photos.length));

    // Touch swipe to change room photo (mobile)
    const track = sliderEl.querySelector('.rs-track');
    if (track) {
      let _rstx = 0;
      track.addEventListener('touchstart', e => {
        _rstx = e.changedTouches[0].clientX;
      }, { passive: true });
      track.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - _rstx;
        if (Math.abs(dx) > 30) {
          stopRoomSlider(room.id);
          const s = roomSliders[room.id];
          const total = room.photos.length;
          s.index = (s.index + (dx < 0 ? 1 : -1) + total) % total;
          updateRoomSlide(room.id, s.index, total);
          startRoomSlider(room.id, total);
        }
      }, { passive: true });
    }

    startRoomSlider(room.id, room.photos.length);

    // Fade each room card in with a short stagger
    setTimeout(() => revealObserveEl(card), ROOMS.indexOf(room) * 80);
  });
}

function getRoomAvailability(room) {
  const avail = currentRoomAvailability[room.id];
  if (!avail) return { cls: 'available', label: 'Available' };
  if (!avail.available) return { cls: 'sold-out', label: 'Sold Out' };
  return { cls: 'available', label: 'Available' };
}

function formatPrice(n, currency) {
  return currency + Number(n).toLocaleString('en-IN');
}

function scrollToAvailSearch() {
  document.querySelector('.avail-search-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function scrollToWidget() {
  document.querySelector('.avail-search-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function bookRoom(id, name, price) {
  selectedRoomPrice = price;
  selectedRoomId = id;
  if (!selectedCheckin || !selectedCheckout) {
    scrollToAvailSearch();
    alert('Please select check-in and check-out dates first.');
    return;
  }
  // Update summary in modal
  const cin  = selectedCheckin.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const cout = selectedCheckout.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const nights = Math.round((selectedCheckout - selectedCheckin) / 86400000);
  const currency = (property && property.currency === 'INR') ? '₹' : '₹';

  document.getElementById('summary-checkin').textContent  = cin;
  document.getElementById('summary-checkout').textContent = cout;
  document.getElementById('summary-nights').textContent   = `${nights} night${nights > 1 ? 's' : ''} · ${name}`;
  const subtotal = price * nights;
  document.getElementById('summary-total').textContent = currency + Math.round(subtotal).toLocaleString('en-IN');

  // Add room to special-requests pre-fill
  document.getElementById('special-requests').value = `Room preference: ${name}`;

  openBookingModal();
}

// ─── Room Photo Modal ──────────────────────────────────────────
function openRoomPhotos(roomId) {
  const room = ROOMS.find(r => r.id === roomId);
  if (!room) return;
  rpmPhotos = room.photos;
  rpmIndex  = 0;
  updateRpmView();
  document.getElementById('room-photo-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updateRpmView() {
  document.getElementById('rpm-img').src = rpmPhotos[rpmIndex];
  document.getElementById('rpm-current').textContent = rpmIndex + 1;
  document.getElementById('rpm-total').textContent   = rpmPhotos.length;
  // Thumbnails
  const thumbs = document.getElementById('rpm-thumbs');
  thumbs.innerHTML = rpmPhotos.map((src, i) => `
    <div class="rpm-thumb ${i === rpmIndex ? 'active' : ''}" onclick="rpmGoto(${i})">
      <img src="${src}" loading="lazy">
    </div>
  `).join('');
}

function rpmGoto(i) {
  rpmIndex = i;
  updateRpmView();
}

function shiftRoomPhoto(dir) {
  rpmIndex = (rpmIndex + dir + rpmPhotos.length) % rpmPhotos.length;
  updateRpmView();
}

function closeRoomPhotoModal(e) {
  if (e && e.currentTarget !== e.target) return;
  document.getElementById('room-photo-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Keyboard nav for room photo modal
document.addEventListener('keydown', e => {
  const rpm = document.getElementById('room-photo-modal');
  if (!rpm || !rpm.classList.contains('open')) return;
  if (e.key === 'ArrowRight') shiftRoomPhoto(1);
  if (e.key === 'ArrowLeft')  shiftRoomPhoto(-1);
  if (e.key === 'Escape') { rpm.classList.remove('open'); document.body.style.overflow = ''; }
});

// ─── Section 7 — Reviews (dummy data — template mode) ──────────
async function loadReviews() {
  try {
    const data = window.CLIENT_CONFIG?.reviews || {
      rating: 4.3,
      total: 134,
      source: 'google',
      reviews: [
        { author: 'Aditya Sharma',  location: 'Bengaluru', date: 'March 2024',    rating: 5, text: 'Absolutely stunning property! The riverside setting is breathtaking and the staff went above and beyond to make our anniversary special. The kayaking at sunrise was an experience we\'ll never forget.' },
        { author: 'Priya Menon',    location: 'Mumbai',    date: 'February 2024', rating: 5, text: 'We came as a family of 5 with our dog and were welcomed so warmly. The rooms were clean, the campfire evening was magical for the kids, and the direct booking was so easy.' },
        { author: 'Rohan D\'Souza', location: 'Goa',       date: 'January 2024',  rating: 4, text: 'Great location and value for money. The food at the café was excellent — especially the fresh seafood. The tent experience was unique and right by the river. Will definitely return!' },
        { author: 'Sneha Kulkarni', location: 'Pune',      date: 'December 2023', rating: 5, text: 'One of the best resort experiences I\'ve had in Karnataka. Clean rooms, helpful staff, and the archery and kayaking activities were great fun. The campfire under stars is unmissable.' },
        { author: 'Karan Mehta',    location: 'Hyderabad', date: 'November 2023', rating: 4, text: 'Peaceful retreat away from city chaos. The riverside location is serene and the café serves delicious local food. Would recommend the king room for the view — absolutely worth it.' },
      ]
    };

    // Update rating summary
    document.getElementById('rev7-rating').textContent = data.rating.toFixed(1);
    document.getElementById('rev7-total').textContent  = `Based on ${data.total.toLocaleString()} reviews`;
    renderStars('rev7-stars', data.rating);

    // Show Google badge if live
    if (data.source === 'google') {
      document.getElementById('rev7-google-badge').style.display = 'flex';
    }

    // Render cards
    const grid = document.getElementById('rev7-grid');
    grid.innerHTML = '';
    data.reviews.forEach(r => {
      const initial = r.author ? r.author.charAt(0).toUpperCase() : '?';
      const stars   = Array.from({length: 5}, (_, i) =>
        `<i class="fas fa-star" style="${i < r.rating ? '' : 'opacity:.25'}"></i>`
      ).join('');
      const avatarContent = r.avatar
        ? `<img src="${r.avatar}" alt="${r.author}" loading="lazy">`
        : initial;

      const card = document.createElement('div');
      card.className = 'rev7-card';
      card.innerHTML = `
        <div class="rev7-card-top">
          <div class="rev7-avatar">${avatarContent}</div>
          <div class="rev7-author-info">
            <div class="rev7-author">${r.author}</div>
            <div class="rev7-meta">${[r.location, r.date].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <div class="rev7-card-stars">${stars}</div>
        <p class="rev7-text">"${r.text}"</p>
        ${data.source === 'google' ? `
          <div class="rev7-source-tag">
            <svg viewBox="0 0 24 24" width="13" height="13"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Posted on Google
          </div>` : ''}
      `;
      grid.appendChild(card);
    });

    initRevSlider(data.reviews.length);

  } catch (e) {
    document.getElementById('rev7-grid').innerHTML =
      '<div class="rev7-loading">Could not load reviews right now.</div>';
  }
}

// ─── Reviews Slider ───────────────────────────────────────────
let revIdx = 0;
let revTimer = null;

function getRevCPV() {
  if (window.innerWidth < 640)  return 1;
  if (window.innerWidth < 1024) return 2;
  return 3;
}

function revCardOffset() {
  const card = document.querySelector('#rev7-grid .rev7-card');
  if (!card) return 0;
  return card.offsetWidth + 20; // card width + gap
}

function updateRevSlider(idx) {
  const total = document.querySelectorAll('#rev7-grid .rev7-card').length;
  if (!total) return;
  const cpv = getRevCPV();
  const max = Math.max(0, total - cpv);
  revIdx = Math.max(0, Math.min(idx, max));

  const track = document.getElementById('rev7-grid');
  if (track) track.style.transform = `translateX(-${revIdx * revCardOffset()}px)`;

  document.querySelectorAll('.rev7-dot').forEach((d, i) => d.classList.toggle('active', i === revIdx));

  const prevBtn = document.getElementById('rev7-prev');
  const nextBtn = document.getElementById('rev7-next');
  if (prevBtn) prevBtn.disabled = revIdx === 0;
  if (nextBtn) nextBtn.disabled = revIdx >= max;
}

function revSlide(dir) {
  stopRevTimer();
  updateRevSlider(revIdx + dir);
  startRevTimer();
}

function startRevTimer() {
  stopRevTimer();
  revTimer = setInterval(() => {
    const total = document.querySelectorAll('#rev7-grid .rev7-card').length;
    const max = Math.max(0, total - getRevCPV());
    updateRevSlider(revIdx >= max ? 0 : revIdx + 1);
  }, 5000);
}

function stopRevTimer() {
  if (revTimer) { clearInterval(revTimer); revTimer = null; }
}

function initRevSlider(total) {
  const cpv = getRevCPV();
  const max = Math.max(0, total - cpv);
  const dotsEl = document.getElementById('rev7-dots');
  if (dotsEl) {
    dotsEl.innerHTML = '';
    for (let i = 0; i <= max; i++) {
      const dot = document.createElement('button');
      dot.className = 'rev7-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.onclick = () => { stopRevTimer(); updateRevSlider(i); startRevTimer(); };
      dotsEl.appendChild(dot);
    }
  }
  updateRevSlider(0);
  startRevTimer();

  // Debounced resize handler — prevents jank from firing on every pixel
  let _revResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_revResizeTimer);
    _revResizeTimer = setTimeout(() => updateRevSlider(revIdx), 150);
  });

  // Touch swipe support for reviews slider
  const revWrap = document.querySelector('.rev7-slider-wrap');
  if (revWrap) {
    let _revTouchX = 0;
    revWrap.addEventListener('touchstart', e => {
      _revTouchX = e.changedTouches[0].clientX;
    }, { passive: true });
    revWrap.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - _revTouchX;
      if (Math.abs(dx) > 40) {
        stopRevTimer();
        updateRevSlider(revIdx + (dx < 0 ? 1 : -1));
        startRevTimer();
      }
    }, { passive: true });
  }
}

function renderStars(containerId, rating) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const icon = document.createElement('i');
    if (i <= Math.floor(rating))      icon.className = 'fas fa-star';
    else if (i - rating < 1)          icon.className = 'fas fa-star-half-stroke';
    else                              icon.className = 'far fa-star';
    container.appendChild(icon);
  }
}

// ─── Share Property ────────────────────────────────────────────
function shareProperty() {
  if (navigator.share) {
    navigator.share({
      title: property?.name || 'Resort Booking',
      text: property?.tagline || 'Check out this amazing property!',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const btn = document.querySelector('.share-btn');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Link copied!';
      setTimeout(() => { btn.innerHTML = original; }, 2000);
    });
  }
}

// ─── Contact Widget ─────────────────────────────────────────────
function initContactWidget(p) {
  const cw      = (p && p.contact_widget) || {};
  const waOn    = !!cw.whatsapp_enabled;
  const callOn  = !!cw.call_enabled;
  const widget  = document.getElementById('contact-widget');
  if (!widget) return;

  if (!waOn && !callOn) { widget.setAttribute('hidden', ''); return; }

  const both     = waOn && callOn;
  const mainBtn  = document.getElementById('cw-main-btn');
  const mainIcon = document.getElementById('cw-main-icon');
  const options  = document.getElementById('cw-options');

  function buildWaHref(val) {
    if (!val) return '#';
    if (val.startsWith('http')) return val;
    return 'https://wa.me/' + val.replace(/[^\d]/g, '');
  }

  if (both) {
    widget.classList.add('cw-both');
    mainIcon.className = 'fas fa-comments';
    mainBtn.setAttribute('data-label', 'Connect with us');
    document.getElementById('cw-wa-btn').href   = buildWaHref(cw.whatsapp_number || '');
    document.getElementById('cw-call-btn').href = 'tel:' + (cw.call_number || '').replace(/\s/g, '');
    mainBtn.addEventListener('click', () => widget.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!widget.contains(e.target)) widget.classList.remove('open');
    });
  } else if (waOn) {
    widget.classList.add('cw-wa-only');
    mainIcon.className = 'fab fa-whatsapp';
    mainBtn.setAttribute('data-label', 'Chat on WhatsApp');
    options.style.display = 'none';
    const href = buildWaHref(cw.whatsapp_number || '');
    mainBtn.addEventListener('click', () => window.open(href, '_blank', 'noopener'));
  } else {
    widget.classList.add('cw-call-only');
    mainIcon.className = 'fas fa-phone';
    mainBtn.setAttribute('data-label', 'Call us');
    options.style.display = 'none';
    const href = 'tel:' + (cw.call_number || '').replace(/\s/g, '');
    mainBtn.addEventListener('click', () => { window.location.href = href; });
  }
}

// ─── Navbar scroll effect ──────────────────────────────────────
// Uses requestAnimationFrame to batch DOM writes and prevent jank
function initScrollEffect() {
  const header = document.getElementById('navbar');
  let _ticking = false;
  window.addEventListener('scroll', () => {
    if (!_ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 10);
        _ticking = false;
      });
      _ticking = true;
    }
  }, { passive: true });
}

// ─── Scroll Reveal ─────────────────────────────────────────────
// Lightweight IntersectionObserver that adds .in-view to elements
// as they enter the viewport, triggering CSS fade-up transitions.
let scrollRevealObserver = null;

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return; // safe fallback for old browsers

  scrollRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          scrollRevealObserver.unobserve(entry.target); // animate once only
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
  );

  // ── Single-unit reveals (headings, boxes, section blocks) ──
  [
    '.highlights-heading',
    '.guide-heading', '.guide-box',
    '.avail-heading', '.avail-search-card', '.avail-results-card',
    '.team-intro', '.team-footer-note',
    '.rev7-heading', '.rev7-summary',
    '.rev7-slider-outer', '.rev7-dots',
    '.rev7-map-wrap',
    '.footer',
  ].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('scroll-reveal');
      scrollRevealObserver.observe(el);
    });
  });

  // ── Stagger reveals (card grids — children animate in sequence) ──
  [
    '.highlights-inner',  // highlight cards
    '.team-grid',         // team member cards
  ].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('scroll-reveal-stagger');
      scrollRevealObserver.observe(el);
    });
  });
}

// Called after dynamic content renders to add newly created
// elements (room cards, review cards) to the existing observer.
function revealObserveEl(el) {
  if (!scrollRevealObserver || !el) return;
  el.classList.add('scroll-reveal');
  scrollRevealObserver.observe(el);
}

// ─── Team Section (dummy data — template mode) ─────────────────
async function loadTeamSection() {
  try {
    const team = [
      { name: 'Rahul Sharma',   designation: 'Property Manager',    phone: '+91 98765 43210', bio: 'Passionate about hospitality and ensuring every guest has an unforgettable stay.',           photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
      { name: 'Anjali Nair',    designation: 'Guest Relations Head', phone: '+91 98765 43211', bio: 'Your first point of contact — here to make your stay smooth from arrival to checkout.',     photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
      { name: 'Vikram Hegde',   designation: 'Activities & Outdoors', phone: '',               bio: 'Leads all outdoor experiences — kayaking, archery, cycling, and campfire evenings.',         photo: 'https://images.unsplash.com/photo-1519690889869-e705e59f72e1?w=400&q=80' },
      { name: 'Meera Joshi',    designation: 'Café & Dining Chef',  phone: '',               bio: 'Chef behind our kitchen — crafting fresh, local flavours and the best breakfast you\'ll have.', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80' },
    ];
    const grid = document.getElementById('team-grid');
    if (!grid || !team.length) return;

    const fallbackPhoto = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=85';

    grid.innerHTML = team.map(m => {
      const photo    = m.photo || fallbackPhoto;
      const firstName = m.name.split(' ')[0];
      const phone    = m.phone ? m.phone.replace(/\s+/g, '') : '';
      return `
        <div class="team-card">
          <img src="${photo}" alt="${m.name}" onerror="this.src='${fallbackPhoto}'">
          <div class="team-overlay">
            <div class="team-role-tag">${m.designation}</div>
            <h3 class="team-name">${m.name}</h3>
            ${phone ? `<a href="tel:${phone}" class="team-phone"><i class="fas fa-phone"></i> ${m.phone}</a>` : ''}
            ${m.bio ? `<p style="font-size:12px;margin:4px 0;opacity:0.9;">${m.bio}</p>` : ''}
            ${phone ? `<a href="tel:${phone}" class="team-cta-btn"><i class="fas fa-phone-alt"></i> Call ${firstName}</a>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    console.error('Failed to load team:', e);
  }
}
