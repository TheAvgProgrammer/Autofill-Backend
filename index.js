import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'


const app = express()
const port = 3000

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' }))

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const bucketName = process.env.SUPABASE_BUCKET_NAME
const tableName = process.env.SUPABASE_TABLE_NAME 

const supabase = createClient(supabaseUrl, supabaseKey)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// POST endpoint to upload image and insert data
app.post('/api/v1/upload', async (req, res) => {
  try {
    const { client_name, screenshot } = req.body

    // Validate input
    if (!client_name || !screenshot) {
      return res.status(400).json({ 
        error: 'Missing required fields: client_name and screenshot are required' 
      })
    }

    // Validate that screenshot is a data URL
    if (!screenshot.startsWith('data:image/')) {
      return res.status(400).json({ 
        error: 'Invalid screenshot format: must be a data URL' 
      })
    }

    // Generate a unique ID
    const id = uuidv4()

    // Extract the base64 data from the data URL
    // Format: data:image/png;base64,iVBORw0KG...
    const matches = screenshot.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
    if (!matches) {
      return res.status(400).json({ 
        error: 'Invalid data URL format' 
      })
    }

    const fileExtension = matches[1]
    const base64Data = matches[2]
    const imageBuffer = Buffer.from(base64Data, 'base64')
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
    console.log('SUPABASE_KEY length:', process.env.SUPABASE_KEY?.length)


    // Upload image to Supabase storage with the generated ID as filename
    const fileName = `${id}.${fileExtension}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ 
        error: 'Failed to upload image',
        details: uploadError.message 
      })
    }

    // Insert row into database with date, client-name, and id
    const currentDate = new Date().toISOString()
    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert([
        {
          id: id,
          client_name: client_name,
          applied_at: currentDate
        }
      ])
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      // If database insert fails, try to delete the uploaded image
      await supabase.storage.from(bucketName).remove([fileName])
      return res.status(500).json({ 
        error: 'Failed to insert data into database',
        details: insertError.message 
      })
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Image uploaded and data inserted successfully',
      data: {
        id: id,
        client_name: client_name,
        applied_at: currentDate,
        imageUrl: uploadData.path
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
