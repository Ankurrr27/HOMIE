import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CITIES } from '../constants/cities.js';
import { CATEGORIES } from '../constants/categories.js';

// Manually load environment variables from .env.local first
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim();
        process.env[key] = value;
      }
    }
  });
}

const mockListingsData = [
  // Housing
  {
    name: "Stanza Living – Salt Lake Block B",
    description: "Premium co-living PG with all amenities. WiFi, housekeeping, meals included.",
    categorySlug: "housing",
    subcategory: "PG",
    citySlug: "bengaluru",
    locality: "Koramangala",
    address: "Block B, Sector V, Koramangala, Bengaluru",
    coordinates: { lat: 12.9352, lng: 77.6245 },
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543210", whatsapp: "+91-9876543210", email: "saltlake@stanzaliving.com", website: "https://stanzaliving.com" },
    price: { value: 8500, maxValue: 12000, unit: "per_month", displayText: "₹8,500 – ₹12,000/mo" },
    amenities: ["WiFi", "AC", "Meals", "Laundry", "Security"],
    timing: { open: "00:00", close: "00:00", days: "Mon–Sun", is24Hours: true },
    tags: ["co-living", "meals-included", "verified"],
    isVerified: true,
    rating: { average: 4.5, count: 38 }
  },
  {
    name: "Zolo Stay – Indiranagar Suites",
    description: "Fully furnished single/double sharing rooms. Perfect for working professionals.",
    categorySlug: "housing",
    subcategory: "Flat",
    citySlug: "bengaluru",
    locality: "Indiranagar",
    address: "456, 12th Main Road, Indiranagar, Bengaluru",
    coordinates: { lat: 12.9718, lng: 77.6411 },
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543212", whatsapp: "+91-9876543212", website: "https://zolostays.com" },
    price: { value: 9500, maxValue: 15000, unit: "per_month", displayText: "₹9,500 – ₹15,000/mo" },
    amenities: ["WiFi", "TV", "Housekeeping", "Fridge", "Parking"],
    timing: { open: "08:00", close: "22:00", days: "Mon–Sun", is24Hours: false },
    tags: ["no-brokerage", "fully-furnished"],
    isVerified: true,
    rating: { average: 4.2, count: 21 }
  },
  {
    name: "Saraswati Boys Hostel",
    description: "Budget-friendly hostel near Katraj college area. Includes 3 meals.",
    categorySlug: "housing",
    subcategory: "Hostel",
    citySlug: "pune",
    locality: "Katraj",
    address: "Katraj Chowk, Pune",
    coordinates: { lat: 18.4529, lng: 73.8553 },
    images: ["https://images.unsplash.com/photo-1555854817-cc08c8391970?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543213" },
    price: { value: 5500, unit: "per_month", displayText: "₹5,500/mo" },
    amenities: ["WiFi", "Meals", "Water Cooler"],
    timing: { open: "00:00", close: "00:00", days: "Mon–Sun", is24Hours: true },
    tags: ["budget", "students"],
    isVerified: false,
    rating: { average: 3.8, count: 12 }
  },
  // Tiffin & Mess
  {
    name: "Didi's Ghar Ka Khana",
    description: "Delicious home-cooked vegetarian tiffin service. Free delivery in HSR Layout.",
    categorySlug: "tiffin-mess",
    subcategory: "Tiffin",
    citySlug: "bengaluru",
    locality: "HSR Layout",
    address: "Sector 3, HSR Layout, Bengaluru",
    coordinates: { lat: 12.9103, lng: 77.6450 },
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543214", whatsapp: "+91-9876543214" },
    price: { value: 2500, unit: "per_month", displayText: "₹2,500/mo" },
    amenities: ["Veg", "Home Delivery", "Weekly Plan Available"],
    timing: { open: "11:00", close: "21:30", days: "Mon–Sat", is24Hours: false },
    tags: ["vegetarian", "budget", "home-cooked"],
    isVerified: true,
    rating: { average: 4.8, count: 64 }
  },
  {
    name: "Mom's Kitchen Punjabi Tiffin",
    description: "Ghar jaisa swad. Punjabi style meals with butter roti, dal, sabzi, salad.",
    categorySlug: "tiffin-mess",
    subcategory: "Tiffin",
    citySlug: "delhi",
    locality: "Lajpat Nagar",
    address: "Lajpat Nagar II, New Delhi",
    coordinates: { lat: 28.5684, lng: 77.2435 },
    images: ["https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543215", whatsapp: "+91-9876543215" },
    price: { value: 80, unit: "per_meal", displayText: "₹80/meal" },
    amenities: ["Veg", "Non-Veg", "Home Delivery"],
    timing: { open: "12:00", close: "21:00", days: "Mon–Sun", is24Hours: false },
    tags: ["punjabi", "meals-included"],
    isVerified: true,
    rating: { average: 4.6, count: 45 }
  },
  // Food & Dining
  {
    name: "Sardarji Da Dhaba",
    description: "Famous local Punjabi eatery. Try our butter chicken and lassi.",
    categorySlug: "food-dining",
    subcategory: "Dhaba",
    citySlug: "delhi",
    locality: "Karol Bagh",
    address: "Pusa Road, Karol Bagh, Delhi",
    coordinates: { lat: 28.6441, lng: 77.1895 },
    images: ["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543216", website: "https://sardarjidadhaba.com" },
    price: { value: 300, unit: "range", displayText: "₹200 – ₹500 for two" },
    amenities: ["Ac Seating", "Home Delivery", "Card Accepted"],
    timing: { open: "12:00", close: "23:30", days: "Mon–Sun", is24Hours: false },
    tags: ["punjabi", "north-indian"],
    isVerified: true,
    rating: { average: 4.4, count: 120 }
  },
  {
    name: "Third Wave Coffee",
    description: "Artisanal coffee and working space. Excellent WiFi and quiet ambiance.",
    categorySlug: "food-dining",
    subcategory: "Cafe",
    citySlug: "mumbai",
    locality: "Bandra West",
    address: "Linking Road, Bandra West, Mumbai",
    coordinates: { lat: 19.0600, lng: 72.8360 },
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543217" },
    price: { value: 600, unit: "range", displayText: "₹500 – ₹800 for two" },
    amenities: ["Free WiFi", "AC", "Workspace Friendly"],
    timing: { open: "08:00", close: "23:00", days: "Mon–Sun", is24Hours: false },
    tags: ["premium", "wifi"],
    isVerified: true,
    rating: { average: 4.3, count: 87 }
  },
  // Gym & Fitness
  {
    name: "Gold's Gym – Indiranagar",
    description: "World class gym equipment, certified trainers, and group workouts.",
    categorySlug: "gym-fitness",
    subcategory: "Gym",
    citySlug: "bengaluru",
    locality: "Indiranagar",
    address: "80 Feet Road, Indiranagar, Bengaluru",
    coordinates: { lat: 12.9698, lng: 77.6415 },
    images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543218", website: "https://goldsgym.in" },
    price: { value: 2500, unit: "per_month", displayText: "₹2,500/mo" },
    amenities: ["Steam Bath", "Valet Parking", "Lockers", "Shower"],
    timing: { open: "06:00", close: "22:00", days: "Mon–Sat", is24Hours: false },
    tags: ["premium", "unisex"],
    isVerified: true,
    rating: { average: 4.7, count: 142 }
  },
  {
    name: "Local Akhada Fitness Club",
    description: "Old-school style budget gym focusing on weightlifting and strength training.",
    categorySlug: "gym-fitness",
    subcategory: "Gym",
    citySlug: "pune",
    locality: "Kothrud",
    address: "Ideal Colony, Kothrud, Pune",
    coordinates: { lat: 18.5089, lng: 73.8183 },
    images: ["https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543219" },
    price: { value: 800, unit: "per_month", displayText: "₹800/mo" },
    amenities: ["Weights", "Cardio Area"],
    timing: { open: "05:00", close: "22:00", days: "Mon–Sat", is24Hours: false },
    tags: ["budget", "weightlifting"],
    isVerified: false,
    rating: { average: 4.1, count: 32 }
  },
  // Home Services
  {
    name: "Ramesh Electric Works",
    description: "Reliable electrician for home wiring, fan repair, and geyser installations.",
    categorySlug: "home-services",
    subcategory: "Electrician",
    citySlug: "hyderabad",
    locality: "Gachibowli",
    address: "Telecom Nagar, Gachibowli, Hyderabad",
    coordinates: { lat: 17.4401, lng: 78.3489 },
    images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543220", whatsapp: "+91-9876543220" },
    price: { value: 150, unit: "per_visit", displayText: "₹150/visit charge" },
    amenities: ["Emergency Service", "Warranty on repair"],
    timing: { open: "08:00", close: "21:00", days: "Mon–Sun", is24Hours: false },
    tags: ["verified", "doorstep-service"],
    isVerified: true,
    rating: { average: 4.5, count: 53 }
  },
  {
    name: "Super Plumbing Solutions",
    description: "Leakage fix, bathroom pipe fitments, and water tank cleanups.",
    categorySlug: "home-services",
    subcategory: "Plumber",
    citySlug: "mumbai",
    locality: "Andheri West",
    address: "Veera Desai Road, Andheri West, Mumbai",
    coordinates: { lat: 19.1363, lng: 72.8293 },
    images: ["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543221" },
    price: { value: 200, unit: "per_visit", displayText: "₹200/visit" },
    amenities: ["Emergency Plumbing"],
    timing: { open: "00:00", close: "00:00", days: "Mon–Sun", is24Hours: true },
    tags: ["24-hours", "plumbing"],
    isVerified: true,
    rating: { average: 4.4, count: 28 }
  },
  // Grocery
  {
    name: "Reliance Fresh Supermarket",
    description: "One stop shop for daily fresh groceries, fruits, vegetables and household supplies.",
    categorySlug: "grocery",
    subcategory: "Supermarket",
    citySlug: "hyderabad",
    locality: "Madhapur",
    address: "Hitech City Road, Madhapur, Hyderabad",
    coordinates: { lat: 17.4483, lng: 78.3915 },
    images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543222", website: "https://relianceretail.com" },
    price: { unit: "on_request", displayText: "Prices vary" },
    amenities: ["Parking", "Home Delivery", "Cards Accepted"],
    timing: { open: "07:00", close: "22:00", days: "Mon–Sun", is24Hours: false },
    tags: ["supermarket", "home-delivery"],
    isVerified: true,
    rating: { average: 4.2, count: 180 }
  },
  // Sabji Mandi
  {
    name: "Koramangala Sabji Mandi",
    description: "Famous local market for cheapest wholesale vegetables and fresh greens.",
    categorySlug: "sabji-mandi",
    subcategory: "Local Mandi",
    citySlug: "bengaluru",
    locality: "Koramangala",
    address: "Koramangala 4th Block Market, Bengaluru",
    coordinates: { lat: 12.9343, lng: 77.6290 },
    images: ["https://images.unsplash.com/photo-1543083503-4c904031e886?auto=format&fit=crop&w=800&q=80"],
    contact: {},
    price: { unit: "free", displayText: "No entry charge" },
    amenities: ["Wholesale Prices", "Organic Stalls"],
    timing: { open: "06:00", close: "13:00", days: "Mon–Sun", is24Hours: false },
    tags: ["cheap", "local-market"],
    isVerified: true,
    rating: { average: 4.3, count: 98 }
  },
  // Dairy
  {
    name: "Mother Dairy Booth",
    description: "Fresh milk, curd, cheese, paneer, and ice creams directly from booth.",
    categorySlug: "dairy",
    subcategory: "Dairy Booth",
    citySlug: "delhi",
    locality: "Dwarka",
    address: "Sector 6 Market, Dwarka, New Delhi",
    coordinates: { lat: 28.5921, lng: 77.0617 },
    images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "1800-11-6200" },
    price: { unit: "per_kg", displayText: "Standard MRP rates" },
    amenities: ["Token Milk Machine", "Fresh Curd"],
    timing: { open: "06:00", close: "21:30", days: "Mon–Sun", is24Hours: false },
    tags: ["milk-booth", "daily-needs"],
    isVerified: true,
    rating: { average: 4.6, count: 72 }
  },
  // Maid & Cook
  {
    name: "Kamla Bai Cook Services",
    description: "Experienced North Indian home cook. Specializes in rotis, sabzi, and biryani.",
    categorySlug: "maid-cook",
    subcategory: "Cook",
    citySlug: "pune",
    locality: "Hinjewadi",
    address: "Phase 1, Hinjewadi IT Park, Pune",
    coordinates: { lat: 18.5913, lng: 73.7389 },
    images: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543225" },
    price: { value: 3000, unit: "per_month", displayText: "₹3,000/mo (Once daily)" },
    amenities: ["Veg cooking", "Non-veg cooking"],
    timing: { open: "07:00", close: "19:30", days: "Mon–Sat", is24Hours: false },
    tags: ["cook", "home-service"],
    isVerified: false,
    rating: { average: 4.2, count: 18 }
  },
  // Places to Visit
  {
    name: "Lalbagh Botanical Garden",
    description: "Beautiful historical park built by Hyder Ali. Iconic glass house and lake.",
    categorySlug: "places-to-visit",
    subcategory: "Park",
    citySlug: "bengaluru",
    locality: "Mavalli",
    address: "Lalbagh Road, Mavalli, Bengaluru",
    coordinates: { lat: 12.9507, lng: 77.5844 },
    images: ["https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80"],
    contact: {},
    price: { value: 30, unit: "per_visit", displayText: "₹30 entry ticket" },
    amenities: ["Walkways", "Public Toilets", "Drinking Water"],
    timing: { open: "06:00", close: "19:00", days: "Mon–Sun", is24Hours: false },
    tags: ["nature", "historical"],
    isVerified: true,
    rating: { average: 4.5, count: 512 }
  },
  // Social & Fun
  {
    name: "The Social Pub",
    description: "Great music, premium cocktails, and workspaces during the daytime.",
    categorySlug: "social-fun",
    subcategory: "Pub",
    citySlug: "mumbai",
    locality: "Colaba",
    address: "Apollo Bunder, Colaba, Mumbai",
    coordinates: { lat: 18.9220, lng: 72.8340 },
    images: ["https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80"],
    contact: { phone: "+91-9876543228", website: "https://socialoffline.in" },
    price: { value: 1500, unit: "range", displayText: "₹1,200 – ₹2,000 for two" },
    amenities: ["Valet Parking", "AC", "Pub Food"],
    timing: { open: "11:00", close: "01:30", days: "Mon–Sun", is24Hours: false },
    tags: ["nightlife", "pub", "premium"],
    isVerified: true,
    rating: { average: 4.4, count: 320 }
  },
  // Local Transport
  {
    name: "MG Road Metro Station",
    description: "Purple Line metro station. Connecting East-West Bengaluru directly.",
    categorySlug: "transport",
    subcategory: "Metro Station",
    citySlug: "bengaluru",
    locality: "MG Road",
    address: "MG Road, Bengaluru",
    coordinates: { lat: 12.9756, lng: 77.6067 },
    images: ["https://images.unsplash.com/photo-1562920841-029f94c50166?auto=format&fit=crop&w=800&q=80"],
    contact: {},
    price: { value: 10, maxValue: 60, unit: "range", displayText: "₹10 – ₹60 fare" },
    amenities: ["Toilets", "Parking", "ATM"],
    timing: { open: "05:00", close: "23:00", days: "Mon–Sun", is24Hours: false },
    tags: ["metro", "fast-travel"],
    isVerified: true,
    rating: { average: 4.6, count: 910 }
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    // Dynamically import database utilities and Mongoose models
    const dbConnect = (await import('../lib/mongodb.js')).default;
    const City = (await import('../models/City.js')).default;
    const Category = (await import('../models/Category.js')).default;
    const Listing = (await import('../models/Listing.js')).default;

    const conn = await dbConnect();
    console.log('Connected. Starting seed operation on:', conn.connection.name);

    // 1. Clear existing collections
    console.log('Clearing old collections...');
    await City.deleteMany({});
    await Category.deleteMany({});
    await Listing.deleteMany({});
    console.log('Cleared City, Category, and Listing collections.');

    // 2. Seed Cities
    console.log('Seeding Cities...');
    const insertedCities = await City.insertMany(CITIES);
    console.log(`Successfully seeded ${insertedCities.length} cities.`);

    // Build city slug -> ObjectId map
    const cityMap = {};
    insertedCities.forEach(city => {
      cityMap[city.slug] = city._id;
    });

    // 3. Seed Categories
    console.log('Seeding Categories...');
    const insertedCategories = await Category.insertMany(CATEGORIES);
    console.log(`Successfully seeded ${insertedCategories.length} categories.`);

    // Build category slug -> ObjectId map
    const categoryMap = {};
    insertedCategories.forEach(category => {
      categoryMap[category.slug] = category._id;
    });

    // 4. Seed Listings
    console.log('Seeding Listings...');
    const listingsToInsert = mockListingsData.map(listing => {
      const cityId = cityMap[listing.citySlug];
      const categoryId = categoryMap[listing.categorySlug];

      if (!cityId) {
        throw new Error(`Missing city slug resolver for: ${listing.citySlug} in listing "${listing.name}"`);
      }
      if (!categoryId) {
        throw new Error(`Missing category slug resolver for: ${listing.categorySlug} in listing "${listing.name}"`);
      }

      return {
        ...listing,
        city: cityId,
        category: categoryId,
        isActive: true,
        saveCount: Math.floor(Math.random() * 100),
        viewCount: Math.floor(Math.random() * 500) + 100
      };
    });

    const insertedListings = await Listing.insertMany(listingsToInsert);
    console.log(`Successfully seeded ${insertedListings.length} listings.`);

    // 5. Update City listing counts
    console.log('Updating City listing counts...');
    for (const city of insertedCities) {
      const count = await Listing.countDocuments({ city: city._id });
      await City.findByIdAndUpdate(city._id, { listingCount: count });
    }
    console.log('City listing counts updated.');

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding operation failed:', error);
    process.exit(1);
  }
}

seed();
