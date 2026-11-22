'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

function orderWithRiceAndCoupon() {
  var items = [{
    id: 1,
    sku: 'GRN-001',
    name: 'Rice',
    hsn: '1006',
    price: 100,
    qty: 6
  }];
  var totals = pricing.computeTotals(items, 'SAVE10');

  return {
    id: 42,
    date: '22/11/2026',
    customer: 'Test customer',
    paymentMode: 'cash',
    status: 'completed',
    items: items,
    coupon: 'SAVE10',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('invoice figures match the billed totals and HSN GST breakdown', function () {
  var order = orderWithRiceAndCoupon();
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.subtotal, order.subtotal);
  assert.equal(figures.discount, order.discount);
  assert.equal(figures.tax, order.tax);
  assert.equal(figures.cgst, 13.5);
  assert.equal(figures.sgst, 13.5);
  assert.equal(figures.total, order.total);
});

test('order pricing applies SAVE10 to subtotal and HSN GST after discount', function () {
  var totals = pricing.computeTotals(orderWithRiceAndCoupon().items, 'SAVE10');

  assert.equal(totals.subtotal, 600);
  assert.equal(totals.discount, 60);
  assert.equal(totals.tax, 27);
  assert.equal(totals.cgst, 13.5);
  assert.equal(totals.sgst, 13.5);
  assert.equal(totals.total, 567);
  assert.equal(totals.lines[0].gstPercent, 5);
});

test('invoice uses the billed totals and the product HSN GST rate', function () {
  var order = orderWithRiceAndCoupon();
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(order.total, 567);
  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.subtotal, 600);
  assert.equal(figures.tax, 27);
  assert.equal(figures.cgst, 13.5);
  assert.equal(figures.sgst, 13.5);
  assert.equal(figures.discount, 60);
  assert.equal(figures.total, 567);
});

test('GST reconciliation matches order totals and the invoice has no mismatch warning', function () {
  var order = orderWithRiceAndCoupon();
  var recon = reports.getGstReconciliation({ orders: [order] });
  var html = invoice.render(order);

  assert.equal(recon.totalChecked, 1);
  assert.equal(recon.mismatchCount, 0);
  assert.equal(recon.rows[0].ledgerTotal, 567);
  assert.equal(recon.rows[0].invoiceTotal, 567);
  assert.equal(recon.rows[0].delta, 0);
  assert.equal(recon.rows[0].ledgerTax, 27);
  assert.equal(recon.rows[0].invoiceTax, 27);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});
