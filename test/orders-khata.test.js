'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var orders = require('../lib/orders');
var ledger = require('../lib/ledger');

function orderFixture() {
  return {
    orders: [
      { id: 1004, date: '30/01/2022' },
      { id: 1001, date: '28/12/2021' },
      { id: 1008, date: '15/03/2022' }
    ]
  };
}

test('order history sorts DD/MM/YYYY dates newest first chronologically', function () {
  var result = orders.list(orderFixture());

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008, 1004, 1001]);
});

test('March date range includes only March orders', function () {
  var result = orders.list(orderFixture(), {
    from: '2022-03-01',
    to: '2022-03-31'
  });

  assert.deepEqual(result.map(function (order) { return order.id; }), [1008]);
});

test('string settlement amount is added numerically to the customer ledger', function () {
  var db = {
    nextSettlementId: 1,
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200
    }],
    settlements: []
  };

  var result = ledger.recordSettlement(db, 1, '500', 'upi', 'Test settlement');

  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});
