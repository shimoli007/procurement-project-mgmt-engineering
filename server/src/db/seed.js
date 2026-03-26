const bcrypt = require('bcryptjs');
const { initDb, runAndSave, queryOne } = require('./connection');

async function seed({ skipInit = false } = {}) {
  if (!skipInit) await initDb();

  console.log('Seeding database...');

  // Clear existing data (in reverse dependency order)
  runAndSave('DELETE FROM order_timeline');
  runAndSave('DELETE FROM orders');
  runAndSave('DELETE FROM bom_lines');
  runAndSave('DELETE FROM item_suppliers');
  runAndSave('DELETE FROM projects');
  runAndSave('DELETE FROM items');
  runAndSave('DELETE FROM suppliers');
  runAndSave('DELETE FROM users');

  // Reset autoincrement
  try { runAndSave('DELETE FROM sqlite_sequence'); } catch (e) { /* ok if table doesn't exist yet */ }

  // ---- USERS ----
  const passwordHash = await bcrypt.hash('password123', 10);

  const aliceId = runAndSave(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Alice Johnson', 'alice@company.com', passwordHash, 'Sales']
  );

  const bobId = runAndSave(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Bob Smith', 'bob@company.com', passwordHash, 'Engineer']
  );

  const carolId = runAndSave(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Carol Davis', 'carol@company.com', passwordHash, 'Procurement']
  );

  const ireneId = runAndSave(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['Irene Otieno', 'irene@company.com', passwordHash, 'CEO']
  );

  console.log(`Created 4 users (IDs: ${aliceId}, ${bobId}, ${carolId}, ${ireneId})`);

  // ---- SUPPLIERS ----
  const suppliersData = [
    ['Acme Electrical Supply', 'sales@acme-elec.com', '555-0101', '100 Industrial Blvd, Houston TX', 'Major electrical distributor'],
    ['Global Mechanical Parts', 'orders@globalmech.com', '555-0102', '200 Manufacturing Ave, Chicago IL', 'Mechanical components and assemblies'],
    ['SteelCo Industries', 'procurement@steelco.com', '555-0103', '300 Steel Way, Pittsburgh PA', 'Structural steel and fabrication'],
    ['SafetyFirst Equipment', 'info@safetyfirst.com', '555-0104', '400 Safety Rd, Atlanta GA', 'PPE and safety equipment'],
    ['PipeMaster International', 'sales@pipemaster.com', '555-0105', '500 Pipeline Dr, Tulsa OK', 'Piping, valves, and fittings'],
  ];

  const supplierIds = [];
  for (const s of suppliersData) {
    const id = runAndSave(
      'INSERT INTO suppliers (name, contact_email, contact_phone, address, notes) VALUES (?, ?, ?, ?, ?)',
      s
    );
    supplierIds.push(id);
  }
  console.log(`Created ${supplierIds.length} suppliers (IDs: ${supplierIds.join(', ')})`);

  // ---- ITEMS ----
  const itemsData = [
    ['Cable Tray 300mm', 'Hot-dip galvanized cable tray, 300mm wide', 'm', 'Electrical'],
    ['MCB 3-Phase 32A', '3-phase miniature circuit breaker, 32 Amp', 'pcs', 'Electrical'],
    ['LED Panel Light 600x600', '40W LED panel light, 4000K', 'pcs', 'Electrical'],
    ['Structural Steel H-Beam 200x200', 'Grade S355 H-beam, 200x200mm', 'm', 'Mechanical'],
    ['Bolt Set M16x60', 'High-strength bolt set M16x60, Grade 8.8', 'set', 'Mechanical'],
    ['Welding Rod E7018 3.2mm', 'Low hydrogen electrode, 3.2mm diameter', 'kg', 'Mechanical'],
    ['Concrete Mix C30', 'Ready-mix concrete, grade C30', 'm3', 'Civil'],
    ['Rebar 16mm Grade 60', 'Deformed reinforcing bar, 16mm', 'ton', 'Civil'],
    ['Formwork Plywood 18mm', 'Film-faced plywood for formwork', 'sheet', 'Civil'],
    ['Pipe Carbon Steel 4" Sch40', 'ASTM A106 Grade B seamless pipe', 'm', 'Piping'],
    ['Gate Valve 4" 150#', 'Cast steel gate valve, flanged', 'pcs', 'Piping'],
    ['Pipe Elbow 4" 90deg', 'Butt-weld elbow, long radius', 'pcs', 'Piping'],
    ['Safety Helmet', 'ANSI Z89.1 compliant hard hat', 'pcs', 'Safety'],
    ['Safety Harness Full Body', '5-point full body harness with lanyard', 'pcs', 'Safety'],
    ['Fire Extinguisher ABC 6kg', 'ABC dry chemical fire extinguisher', 'pcs', 'Safety'],
  ];

  const itemIds = [];
  for (const item of itemsData) {
    const id = runAndSave(
      'INSERT INTO items (name, description, unit, category) VALUES (?, ?, ?, ?)',
      item
    );
    itemIds.push(id);
  }
  console.log(`Created ${itemIds.length} items (IDs: ${itemIds.join(', ')})`);

  // ---- ITEM-SUPPLIER LINKS (20) ----
  const itemSupplierLinks = [
    // Acme Electrical (supplier 0) -> Electrical items (0,1,2)
    [itemIds[0], supplierIds[0], 45.50, 7, 1],
    [itemIds[1], supplierIds[0], 28.00, 5, 1],
    [itemIds[2], supplierIds[0], 35.00, 10, 1],
    // Global Mechanical (supplier 1) -> Mechanical items (3,4,5)
    [itemIds[3], supplierIds[1], 120.00, 14, 1],
    [itemIds[4], supplierIds[1], 8.50, 3, 1],
    [itemIds[5], supplierIds[1], 12.00, 5, 1],
    // SteelCo (supplier 2) -> Mechanical + Civil
    [itemIds[3], supplierIds[2], 115.00, 10, 0],
    [itemIds[6], supplierIds[2], 95.00, 2, 1],
    [itemIds[7], supplierIds[2], 850.00, 7, 1],
    [itemIds[8], supplierIds[2], 22.00, 3, 1],
    // PipeMaster (supplier 4) -> Piping items (9,10,11)
    [itemIds[9], supplierIds[4], 55.00, 10, 1],
    [itemIds[10], supplierIds[4], 320.00, 14, 1],
    [itemIds[11], supplierIds[4], 18.00, 7, 1],
    // SafetyFirst (supplier 3) -> Safety items (12,13,14)
    [itemIds[12], supplierIds[3], 15.00, 2, 1],
    [itemIds[13], supplierIds[3], 85.00, 5, 1],
    [itemIds[14], supplierIds[3], 45.00, 3, 1],
    // Cross-supplier links
    [itemIds[0], supplierIds[1], 48.00, 10, 0],
    [itemIds[9], supplierIds[2], 58.00, 12, 0],
    [itemIds[12], supplierIds[1], 16.50, 5, 0],
    [itemIds[4], supplierIds[2], 9.00, 5, 0],
  ];

  for (const link of itemSupplierLinks) {
    runAndSave(
      'INSERT INTO item_suppliers (item_id, supplier_id, unit_price, lead_time_days, is_preferred) VALUES (?, ?, ?, ?, ?)',
      link
    );
  }
  console.log(`Created ${itemSupplierLinks.length} item-supplier links`);

  // ---- PROJECTS ----
  const proj1 = runAndSave(
    'INSERT INTO projects (name, description, client_name, status, start_date, target_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Oil Refinery Expansion Phase 2', 'Expansion of processing unit including new piping and electrical systems', 'PetroMax Corp', 'Active', '2026-01-15', '2026-09-30', aliceId]
  );

  const proj2 = runAndSave(
    'INSERT INTO projects (name, description, client_name, status, start_date, target_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Warehouse Construction - Bay Area', 'New 50,000 sqft warehouse with office space', 'LogiTech Solutions', 'Active', '2026-02-01', '2026-12-15', aliceId]
  );

  const proj3 = runAndSave(
    'INSERT INTO projects (name, description, client_name, status, start_date, target_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Solar Farm Electrical Installation', 'Electrical infrastructure for 50MW solar farm', 'GreenPower Inc', 'On Hold', '2026-03-01', '2027-03-01', aliceId]
  );

  console.log(`Created 3 projects (IDs: ${proj1}, ${proj2}, ${proj3})`);

  // ---- BOM LINES ----
  const bomLines = [
    // Project 1: Oil Refinery
    [proj1, itemIds[0], 200, 'Main cable tray run for Unit 5'],
    [proj1, itemIds[1], 24, 'Distribution board MCBs'],
    [proj1, itemIds[9], 500, 'Process piping - main loop'],
    [proj1, itemIds[10], 12, 'Isolation valves'],
    [proj1, itemIds[11], 48, 'Pipe elbows for routing'],
    [proj1, itemIds[3], 150, 'Structural support beams'],
    [proj1, itemIds[12], 50, 'Construction crew helmets'],
    [proj1, itemIds[13], 20, 'Elevated work harnesses'],
    // Project 2: Warehouse
    [proj2, itemIds[2], 120, 'Office and warehouse lighting'],
    [proj2, itemIds[6], 350, 'Foundation and floor slab'],
    [proj2, itemIds[7], 25, 'Foundation reinforcement'],
    [proj2, itemIds[8], 200, 'Formwork for foundation'],
    [proj2, itemIds[3], 300, 'Main structural frame'],
    [proj2, itemIds[4], 500, 'Structural connections'],
    [proj2, itemIds[14], 30, 'Fire safety compliance'],
    // Project 3: Solar Farm
    [proj3, itemIds[0], 1000, 'Cable tray for solar array connections'],
    [proj3, itemIds[1], 100, 'Inverter protection MCBs'],
    [proj3, itemIds[2], 50, 'Control room lighting'],
  ];

  for (const line of bomLines) {
    runAndSave(
      'INSERT INTO bom_lines (project_id, item_id, quantity, notes) VALUES (?, ?, ?, ?)',
      line
    );
  }
  console.log(`Created ${bomLines.length} BOM lines`);

  // ---- ORDERS (10) ----
  const ordersData = [
    // Project 1 orders
    [proj1, itemIds[0], supplierIds[0], 200, 45.50, 'Delivered', aliceId, carolId, '2026-01-20', '2026-02-10', '2026-02-08', 'Delivered early'],
    [proj1, itemIds[9], supplierIds[4], 500, 55.00, 'Shipped', aliceId, carolId, '2026-02-01', '2026-03-01', null, 'In transit'],
    [proj1, itemIds[10], supplierIds[4], 12, 320.00, 'Ordered', aliceId, carolId, '2026-02-15', '2026-03-15', null, null],
    [proj1, itemIds[3], supplierIds[1], 150, 120.00, 'Pending', bobId, carolId, null, null, null, 'Awaiting approval'],
    [proj1, itemIds[12], supplierIds[3], 50, 15.00, 'Delivered', aliceId, carolId, '2026-01-18', '2026-01-25', '2026-01-24', null],
    // Project 2 orders
    [proj2, itemIds[6], supplierIds[2], 350, 95.00, 'Ordered', aliceId, carolId, '2026-02-10', '2026-02-25', null, 'Concrete for foundation'],
    [proj2, itemIds[7], supplierIds[2], 25, 850.00, 'Pending', bobId, carolId, null, null, null, null],
    [proj2, itemIds[3], supplierIds[2], 300, 115.00, 'Shipped', aliceId, carolId, '2026-02-05', '2026-03-05', null, 'Structural steel delivery'],
    // Project 1 additional
    [proj1, itemIds[1], supplierIds[0], 24, 28.00, 'Ordered', bobId, carolId, '2026-03-01', '2026-03-10', null, null],
    [proj1, itemIds[13], supplierIds[3], 20, 85.00, 'Cancelled', aliceId, carolId, '2026-01-20', null, null, 'Duplicate order - cancelled'],
  ];

  const orderIds = [];
  for (const o of ordersData) {
    const id = runAndSave(
      `INSERT INTO orders (project_id, item_id, supplier_id, quantity, unit_price, status, requested_by, assigned_to, order_date, expected_date, delivered_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      o
    );
    orderIds.push(id);
  }
  console.log(`Created ${orderIds.length} orders (IDs: ${orderIds.join(', ')})`);

  // ---- ORDER TIMELINE ----
  const timeline = [
    // Order 1: Pending -> Ordered -> Shipped -> Delivered
    [orderIds[0], null, 'Pending', carolId, 'Order created'],
    [orderIds[0], 'Pending', 'Ordered', carolId, 'PO sent to Acme Electrical'],
    [orderIds[0], 'Ordered', 'Shipped', carolId, 'Shipped via freight'],
    [orderIds[0], 'Shipped', 'Delivered', carolId, 'Received at site warehouse'],
    // Order 2: Pending -> Ordered -> Shipped
    [orderIds[1], null, 'Pending', carolId, 'Order created'],
    [orderIds[1], 'Pending', 'Ordered', carolId, 'PO issued'],
    [orderIds[1], 'Ordered', 'Shipped', carolId, 'Dispatched from factory'],
    // Order 3: Pending -> Ordered
    [orderIds[2], null, 'Pending', carolId, 'Order created'],
    [orderIds[2], 'Pending', 'Ordered', carolId, 'PO sent to PipeMaster'],
    // Order 4: Pending only
    [orderIds[3], null, 'Pending', bobId, 'Order requested by engineering'],
    // Order 5: Full cycle
    [orderIds[4], null, 'Pending', carolId, 'Order created'],
    [orderIds[4], 'Pending', 'Ordered', carolId, 'Ordered from SafetyFirst'],
    [orderIds[4], 'Ordered', 'Shipped', carolId, 'Express shipping'],
    [orderIds[4], 'Shipped', 'Delivered', carolId, 'Delivered to site'],
    // Order 6: Pending -> Ordered
    [orderIds[5], null, 'Pending', carolId, 'Order created'],
    [orderIds[5], 'Pending', 'Ordered', carolId, 'Concrete order placed'],
    // Order 7: Pending
    [orderIds[6], null, 'Pending', bobId, 'Rebar order requested'],
    // Order 8: Pending -> Ordered -> Shipped
    [orderIds[7], null, 'Pending', carolId, 'Order created'],
    [orderIds[7], 'Pending', 'Ordered', carolId, 'Steel order confirmed with SteelCo'],
    [orderIds[7], 'Ordered', 'Shipped', carolId, 'First batch shipped'],
    // Order 9: Pending -> Ordered
    [orderIds[8], null, 'Pending', bobId, 'MCB order for distribution board'],
    [orderIds[8], 'Pending', 'Ordered', carolId, 'PO issued to Acme'],
    // Order 10: Pending -> Cancelled
    [orderIds[9], null, 'Pending', aliceId, 'Harness order created'],
    [orderIds[9], 'Pending', 'Cancelled', carolId, 'Duplicate of existing order - cancelled'],
  ];

  for (const t of timeline) {
    runAndSave(
      'INSERT INTO order_timeline (order_id, from_status, to_status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
      t
    );
  }
  console.log(`Created ${timeline.length} timeline entries`);

  console.log('\nSeed completed successfully!');
}

module.exports = seed;

// Run directly: node seed.js
if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
