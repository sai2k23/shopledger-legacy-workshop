'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('inventory allows selling exactly the remaining sellable quantity', function () {
  var products = [
    { id: 6, name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
    { id: 11, name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 }
  ];

  var gheeResult = inventory.check(products, [{ id: 6, qty: 1 }]);
  var chilliResult = inventory.check(products, [{ id: 11, qty: 1 }]);

  assert.deepEqual(gheeResult, { ok: true });
  assert.deepEqual(chilliResult, { ok: true });
});

test('cancelling an order marks it cancelled and restores physical stock', function () {
  var db = {
    products: [
      { id: 6, stock: 3, reserved: 0 },
      { id: 4, stock: 8, reserved: 4 }
    ],
    orders: [{
      id: 1007,
      status: 'pending',
      paymentMode: 'cash',
      total: 1280,
      items: [
        { id: 6, qty: 2 },
        { id: 4, qty: 2 }
      ]
    }]
  };

  var result = orders.cancel(db, 1007, 'Test cancellation');

  assert.equal(result.ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.equal(db.products[0].stock, 5);
  assert.equal(db.products[1].stock, 10);
  assert.equal(db.products[0].reserved, 0);
  assert.equal(db.products[1].reserved, 4);
});

test('inventory release uses order item ids and leaves reservations unchanged', function () {
  var products = [{ id: 6, stock: 3, reserved: 2 }];

  inventory.release(products, [{ id: 6, qty: 1 }]);

  assert.equal(products[0].stock, 4);
  assert.equal(products[0].reserved, 2);
});
