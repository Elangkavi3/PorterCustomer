export const activeBooking = {
  id: 'TRP-2026-00452',
  status: 'In Transit',
  route: {
    from: 'Indiranagar, Bengaluru',
    to: 'Whitefield, Bengaluru',
    distanceKm: 24,
  },
  pickupDate: '22/05/2026',
  eta: '12 min',
  vehicle: {
    number: 'KA 05 MN 4821',
    type: '20 ft Container Truck',
    bodyType: 'Closed Body',
    capacity: 'Up to 10 tonnes',
    compliance: 'Valid',
  },
  driver: {
    name: 'Arjun Menon',
    mobile: '+91 98765 43210',
    rating: '4.8',
    licenseStatus: 'Valid',
  },
  load: {
    type: 'Retail cartons',
    weight: '420 kg',
    notes: 'Fragile items. Call before delivery.',
  },
  payment: {
    amount: 'Rs 18,500',
    mode: 'Bank transfer',
    status: 'Pending',
  },
  readiness: [
    { label: 'Vehicle assigned', ok: true },
    { label: 'Driver assigned', ok: true },
    { label: 'Inspection complete', ok: true },
    { label: 'Payment verified', ok: false },
  ],
  timeline: [
    { label: 'Booking created', time: '09:10 AM', state: 'done' },
    { label: 'Vehicle assigned', time: '09:18 AM', state: 'done' },
    { label: 'Pickup reached', time: '09:42 AM', state: 'done' },
    { label: 'In transit', time: '10:05 AM', state: 'active' },
    { label: 'Delivered', time: 'Expected 10:35 AM', state: 'pending' },
  ],
};

export const bookingHistory = [
  {
    id: 'TRP-2026-00452',
    route: 'Indiranagar to Whitefield',
    status: 'In Transit',
    amount: 'Rs 18,500',
    date: '22/05/2026',
  },
  {
    id: 'TRP-2026-00434',
    route: 'Bengaluru to Chennai',
    status: 'Delivered',
    amount: 'Rs 22,000',
    date: '21/05/2026',
  },
  {
    id: 'TRP-2026-00418',
    route: 'Bengaluru to Hyderabad',
    status: 'Cancelled',
    amount: 'Rs 0',
    date: '20/05/2026',
  },
];

export const vehicleOptions = [
  {
    bodyType: 'Closed Body',
    type: '20 ft Container Truck',
    dimensions: '20 x 8 x 8 ft',
    eta: 'Same day placement',
    price: 'Rs 23-57 / km',
    load: 'Up to 10 tonnes',
    bestFor: 'FMCG, retail, e-commerce',
  },
  {
    bodyType: 'Closed Body',
    type: '22 ft Container Truck',
    dimensions: '22 x 8 x 8 ft',
    eta: 'Same day placement',
    price: 'Rs 22-65 / km',
    load: 'Up to 10 tonnes',
    bestFor: 'Retail, construction materials, food and beverage',
  },
  {
    bodyType: 'Closed Body',
    type: '24 ft Container Truck',
    dimensions: '24 x 8 x 8 ft',
    eta: 'Within 6 hours',
    price: 'Rs 34-41 / km',
    load: 'Up to 14 tonnes',
    bestFor: 'Consumer goods, pharmaceuticals, textiles',
  },
  {
    bodyType: 'Closed Body',
    type: '32 ft Container Truck (SXL)',
    dimensions: '32 x 8 x 9 ft',
    eta: 'Within 6 hours',
    price: 'Rs 30-67 / km',
    load: '7 - 9 tonnes',
    bestFor: 'Electronics, paper products, consumer durables',
  },
  {
    bodyType: 'Closed Body',
    type: '32 ft Container Truck (MXL)',
    dimensions: '32 x 8 x 9 ft',
    eta: 'Within 8 hours',
    price: 'Rs 45-85 / km',
    load: '15 - 18 tonnes',
    bestFor: 'Electronics, chemicals, retail, paper, FMCG, textiles',
  },
  {
    bodyType: 'Open Body',
    type: '19 ft Open Truck',
    dimensions: '19 x 7.5 x 7 ft',
    eta: 'Same day placement',
    price: 'Rs 32-61 / km',
    load: '7 - 12 tonnes',
    bestFor: 'FMCG, construction materials, palletised goods',
  },
  {
    bodyType: 'Open Body',
    type: '10 Tyre Open Truck',
    dimensions: '22 - 24 x 7.5 ft',
    eta: 'Within 8 hours',
    price: 'Rs 45-65 / km',
    load: '12 - 18 tonnes',
    bestFor: 'Steel, granite, heavy cargo',
  },
  {
    bodyType: 'Open Body',
    type: '12 Tyre Open Truck',
    dimensions: '25 - 26 x 7.8 ft',
    eta: 'Within 8 hours',
    price: 'Rs 50-70 / km',
    load: '21 - 25 tonnes',
    bestFor: 'Long-haul bulk freight, cement, steel, large machinery',
  },
  {
    bodyType: 'Open Body',
    type: '14 Tyre Open Truck',
    dimensions: '28 - 29 x 8 ft',
    eta: 'Within 12 hours',
    price: 'Rs 60-80 / km',
    load: 'Up to 30 tonnes',
    bestFor: 'Oversized loads, heavy plant equipment, mining output',
  },
  {
    bodyType: 'Open Body',
    type: '16 Tyre Open Truck',
    dimensions: '32 x 8 ft',
    eta: 'Within 12 hours',
    price: 'Rs 65-85 / km',
    load: 'Up to 35 tonnes',
    bestFor: 'Heavy industrial loads, bulk transport, FMCG, glass',
  },
];

export const notifications = [
  {
    id: 'NTF-0001',
    title: 'Driver assigned',
    detail: 'Arjun Menon is assigned to TRP-2026-00452.',
    type: 'Trip',
    unread: true,
  },
  {
    id: 'NTF-0002',
    title: 'Payment pending',
    detail: 'Complete Rs 18,500 payment before delivery closure.',
    type: 'Finance',
    unread: true,
  },
  {
    id: 'NTF-0003',
    title: 'Proof of delivery ready',
    detail: 'Your last delivery POD and invoice are available.',
    type: 'Document',
    unread: false,
  },
];

export const disputes = [
  {
    id: 'DSP-2026-0007',
    tripId: 'TRP-2026-00434',
    type: 'Damage',
    status: 'Under Review',
    amount: 'Rs 1,500',
    reason: 'Packaging damage reported during unloading.',
    evidence: ['Delivery photo', 'Receiver note', 'Invoice'],
  },
  {
    id: 'DSP-2026-0002',
    tripId: 'TRP-2026-00396',
    type: 'Payment',
    status: 'Resolved',
    amount: 'Rs 320',
    reason: 'Fare adjustment reviewed and refunded.',
    evidence: ['Ledger screenshot', 'Trip invoice'],
  },
];

export const transactionSummary = [
  { label: 'Last paid invoice', value: 'Rs 22,000' },
  { label: 'Pending invoice', value: 'Rs 18,500' },
  { label: 'May transactions', value: 'Rs 1,86,400' },
];

export const recentTransactions = [
  {
    id: 'INV-2026-00434',
    tripId: 'TRP-2026-00434',
    title: 'Bengaluru to Chennai',
    amount: 'Rs 22,000',
    status: 'Paid',
    date: '21/05/2026',
  },
  {
    id: 'INV-2026-00452',
    tripId: 'TRP-2026-00452',
    title: 'Indiranagar to Whitefield',
    amount: 'Rs 18,500',
    status: 'Pending',
    date: '22/05/2026',
  },
];
