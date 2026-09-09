const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({ total: Number });

async function recent(Order) {
  return Order.find({ total: { $gt: 100 } }).select('id total').populate('customer');
}

module.exports = { OrderSchema, recent };
