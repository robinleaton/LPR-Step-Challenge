import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: 'This is a screenshot from a fitness or health app showing a step count. Please extract the total step count number shown in this image. Return ONLY the number with no text, commas, or other characters. For example: 8432. If you cannot find a step count, return 0.',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '0'
    const steps = parseInt(text.replace(/[^0-9]/g, ''))

    if (isNaN(steps) || steps === 0) {
      return NextResponse.json({ steps: null, message: 'Could not detect steps from image' })
    }

    return NextResponse.json({ steps })
  } catch (err: any) {
    console.error('Photo analysis error:', err)
    return NextResponse.json({ error: 'Failed to analyse photo', message: err.message }, { status: 500 })
  }
}
