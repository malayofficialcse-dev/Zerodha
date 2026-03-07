import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function checkDB() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to DB');
  
  const Stock = mongoose.model('Stock', new mongoose.Schema({}, { strict: false }));
  const stocks = await Stock.find({}, 'name symbol');
  console.log('Stocks in DB symbols:', stocks.map(s => s.symbol));
  
  await mongoose.disconnect();
}

checkDB().catch(console.error);
