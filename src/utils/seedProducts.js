const mongoose = require('mongoose')
const { MilletItem } = require('../models/millet_item')
const { User } = require('../models/user')
require('dotenv').config()

/**
 * Seed the database with sample products
 */
async function seedProducts () {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/farmerspot'
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })

    console.log('Connected to MongoDB...')

    // Find the farmer user to list products under
    const farmer = await User.findOne({ email: 'farmer@gmail.com' })

    if (!farmer) {
      console.error('❌ Farmer account not found. Please run "npm run seed" first to create user accounts.')
      process.exit(1)
    }

    // Sample products data - Prices in Nigerian Naira (NGN)
    const products = [
      {
        name: 'Organic Tomatoes',
        description: 'Fresh, locally grown organic tomatoes. Rich in vitamins and perfect for salads, cooking, or eating fresh. Harvested daily from our farm.',
        price: 1200.00,
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Fresh Spinach',
        description: 'Nutrient-rich green spinach leaves, freshly harvested. Packed with iron, vitamins, and minerals. Perfect for smoothies, salads, and cooking.',
        price: 900.00,
        images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Organic Carrots',
        description: 'Sweet and crunchy organic carrots grown without pesticides. High in beta-carotene and fiber. Great for snacking, juicing, or cooking.',
        price: 1000.00,
        images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Fresh Lettuce',
        description: 'Crisp and fresh lettuce heads, perfect for salads and sandwiches. Hydroponically grown for maximum freshness and nutrition.',
        price: 800.00,
        images: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Bell Peppers Mix',
        description: 'Colorful mix of red, yellow, and green bell peppers. Sweet, crunchy, and loaded with vitamin C. Perfect for stir-fries and salads.',
        price: 1500.00,
        images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Organic Potatoes',
        description: 'Versatile organic potatoes, perfect for any dish. Grown in nutrient-rich soil without chemical fertilizers. Great for frying, baking, or mashing.',
        price: 950.00,
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Fresh Broccoli',
        description: 'Premium quality broccoli florets, packed with nutrients and antioxidants. Freshly harvested and ready to cook or steam.',
        price: 1300.00,
        images: ['https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Organic Cucumbers',
        description: 'Cool, refreshing organic cucumbers. Perfect for salads, pickling, or as a healthy snack. Grown without harmful pesticides.',
        price: 850.00,
        images: ['https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Sweet Corn',
        description: 'Farm-fresh sweet corn with juicy, tender kernels. Perfect for grilling, boiling, or adding to your favorite recipes. Non-GMO.',
        price: 1100.00,
        images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Fresh Cabbage',
        description: 'Crisp and fresh cabbage heads, rich in vitamins K and C. Perfect for coleslaw, stir-fries, soups, and fermented dishes like kimchi.',
        price: 700.00,
        images: ['https://images.unsplash.com/photo-1598030513239-6aa00b7d3a18?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Organic Onions',
        description: 'Flavorful organic onions, a kitchen essential. Perfect for cooking, grilling, or eating raw. Adds depth to any dish.',
        price: 900.00,
        images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Fresh Green Beans',
        description: 'Tender green beans, freshly picked. Rich in fiber and vitamins. Perfect for sautéing, steaming, or adding to casseroles.',
        price: 1150.00,
        images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Organic Zucchini',
        description: 'Fresh organic zucchini, versatile and nutritious. Perfect for grilling, baking, or making zoodles. Low in calories, high in nutrients.',
        price: 950.00,
        images: ['https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Fresh Cauliflower',
        description: 'Premium white cauliflower heads, packed with vitamins and fiber. Great for roasting, mashing, or making cauliflower rice.',
        price: 1200.00,
        images: ['https://images.unsplash.com/photo-1568584711271-f9f5ab5fb0f7?w=800'],
        listedBy: farmer._id
      },
      {
        name: 'Mixed Salad Greens',
        description: 'Fresh mix of baby greens including arugula, mizuna, and lettuce. Perfect for quick and healthy salads. Ready to eat.',
        price: 1000.00,
        images: ['https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800'],
        listedBy: farmer._id
      }
    ]

    // Check if products already exist
    const existingProducts = await MilletItem.countDocuments()

    if (existingProducts > 0) {
      console.log(`✓ Database already has ${existingProducts} products`)
      const choice = 'add' // You can change this to 'skip' or 'replace' as needed

      if (choice === 'skip') {
        console.log('Skipping product seeding...')
        await mongoose.connection.close()
        return
      } else if (choice === 'replace') {
        await MilletItem.deleteMany({})
        console.log('✓ Cleared existing products')
      }
    }

    // Create products
    let created = 0
    for (const productData of products) {
      const product = new MilletItem(productData)
      await product.save()
      created++
      console.log(`✓ Added: ${productData.name} - ₦${productData.price}/kg`)
    }

    console.log(`\n🎉 Successfully added ${created} products to the database!\n`)
    console.log('📦 Product Categories Added:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✓ Leafy Greens (Spinach, Lettuce, Cabbage, Salad Mix)')
    console.log('✓ Root Vegetables (Carrots, Potatoes, Onions)')
    console.log('✓ Fruits Vegetables (Tomatoes, Bell Peppers, Cucumbers)')
    console.log('✓ Cruciferous (Broccoli, Cauliflower)')
    console.log('✓ Squash (Zucchini)')
    console.log('✓ Legumes (Green Beans)')
    console.log('✓ Corn (Sweet Corn)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🌾 All products are listed under farmer@gmail.com')
  } catch (error) {
    console.error('❌ Error seeding products:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed.')
    process.exit(0)
  }
}

// Run the seed function
seedProducts()
