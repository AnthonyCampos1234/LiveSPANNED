import { v4 as uuidv4 } from 'uuid';
import { BettingQuestion, BettingOption } from '@/lib/supabase';

// Define the interface for OpenAI API response
interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Define types for question generation
interface GeneratedQuestion {
  question: string;
  options: {
    text: string;
    odds: number;
  }[];
}

// Function to generate betting questions using OpenAI
export const generateBettingQuestions = async (count: number = 3): Promise<BettingQuestion[]> => {
  try {
    // Check if OpenAI API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file');
      return getMockQuestions(count); // Fallback to mock questions if no API key
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a betting question generator for a CSPAN video of President Trump signing executive orders supporting the coal industry. Generate unique betting questions based on the provided video description with 2-4 betting options each. Format output as valid JSON array of objects with 'question' and 'options' fields. Each option should have 'text' and 'odds' properties where odds are between 1.1 and 10.0."
          },
          {
            role: "user",
            content: `Generate ${count} betting questions related to this CSPAN video description of President Trump signing executive orders supporting the coal industry. The questions should match moments and events that could happen in the video described. Each question should have 2-4 betting options with odds.

VIDEO DESCRIPTION:
Temporal Analysis of CSPAN Video: President Trump Signs Executive Orders Supporting Coal Industry
00:00 - 00:15
The video opens with a wide shot of the EPA headquarters room
President Trump is seated at a desk with several executive orders laid out in front of him
Behind him stand approximately 10-12 coal miners in work attire, some wearing mining helmets
Cabinet officials and EPA administrators are positioned to his left and right
The President begins with opening remarks, leaning slightly forward toward the microphone
His posture is formal, hands resting on the desk with minimal movement initially

00:15 - 00:45
President Trump starts addressing the coal miners directly, turning his head slightly to acknowledge them
He gestures with his right hand (first significant hand movement, variance increasing) while emphasizing the importance of coal jobs
The miners remain mostly stationary, standing at attention behind the President
Trump references "ending the war on coal" with increased vocal emphasis
His speech pattern shows a measured pace (around 100 words per minute)
The camera occasionally cuts to show reactions from miners and officials

00:45 - 01:15
The President begins explaining the specific executive orders, pointing to the documents on the desk
He uses both hands now to gesture while explaining regulatory rollbacks (hand movement variance increases to 0.06)
His head movements become more pronounced as he alternates between looking at the audience and the documents
One of the miners shifts position slightly, adjusting his stance
Trump mentions specific Obama-era regulations being targeted
The lighting remains consistent, with American flags visible in the background

01:15 - 01:45
President Trump acknowledges specific officials in the room, nodding toward them
He picks up the first executive order, holding it up briefly to show the audience
The miners behind him maintain their positions, with minimal movement
Trump begins to prepare for signing, adjusting his position in the chair
An aide approaches briefly from the right to adjust the microphone
The President's speech slows as he transitions from speaking to preparing to sign

01:45 - 02:15
Trump picks up a pen and begins signing the first executive order
His posture changes significantly - leaning forward over the desk
The camera zooms in to capture the signing moment
After signing, he holds up the signed document, displaying it to the cameras
The miners behind him applaud, with several nodding in approval
Trump hands the signed document to an aide and prepares for the next one

02:15 - 02:45
The President begins signing the second executive order
His movements are deliberate and ceremonial, taking time with each signature
He makes a brief remark about the significance of this particular order
The miners remain in their positions, though with more subtle movements now
Several officials exchange glances and nods as the signing continues
Trump's right hand shows increased movement variance during the signing process

02:45 - 03:15
After completing the signatures, President Trump stands up from the desk
His posture straightens as he moves to shake hands with the miners
The first miner steps forward to shake the President's hand
Trump exchanges brief words with each miner, maintaining eye contact
The formal atmosphere shifts to a more personal interaction
Camera angles change to capture these interactions from different perspectives

03:15 - 03:45
The President continues greeting each miner individually
He gestures toward the signed orders while speaking to them
Several miners nod in agreement to the President's remarks
Officials in the room begin to move around more freely
Trump's body language becomes more relaxed and conversational
The miners' expressions show visible approval and gratitude

03:45 - 04:00 (Conclusion)
The event begins to conclude as the formal portion ends
President Trump makes final remarks to the assembled press
He gestures toward the miners one final time, acknowledging their presence
The miners begin to prepare to exit the stage area
The camera pulls back for a wide shot of the entire scene
The video concludes with Trump standing amidst the miners and officials, the signed executive orders prominently displayed on the desk`
          }
        ],
        temperature: 1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return getMockQuestions(count);
    }

    const data = await response.json() as OpenAIResponse;
    const generatedContent = data.choices[0].message.content;
    
    try {
      // Clean up the response in case it comes back with markdown code blocks
      let cleanedContent = generatedContent;
      
      // Check if the content starts with markdown code block and extract the JSON
      if (cleanedContent.includes('```json') || cleanedContent.includes('```')) {
        // Extract content between code block markers
        const codeBlockMatch = cleanedContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          cleanedContent = codeBlockMatch[1].trim();
        } else {
          // Try to find the JSON array directly
          const jsonMatch = cleanedContent.match(/\[\s*{[\s\S]*}\s*\]/);
          if (jsonMatch) {
            cleanedContent = jsonMatch[0];
          }
        }
      }
      
      console.log('Cleaned content for parsing:', cleanedContent.substring(0, 100) + '...');
      
      // Parse the cleaned JSON response from OpenAI
      const parsedQuestions = JSON.parse(cleanedContent) as GeneratedQuestion[];
      
      // Convert to our app's format
      return parsedQuestions.map(q => formatQuestion(q));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw response:', generatedContent);
      
      // Try to manually extract and parse the JSON from the raw response
      try {
        const jsonData = extractJsonFromString(generatedContent);
        console.log('Manually extracted JSON data:', jsonData.substring(0, 100) + '...');
        
        if (jsonData) {
          const parsedQuestions = JSON.parse(jsonData) as GeneratedQuestion[];
          return parsedQuestions.map(q => formatQuestion(q));
        }
      } catch (extractError) {
        console.error('Failed to extract JSON manually:', extractError);
      }
      
      return getMockQuestions(count);
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return getMockQuestions(count);
  }
};

// Helper to format questions into our app format
const formatQuestion = (generatedQ: GeneratedQuestion): BettingQuestion => {
  // Add local- prefix to mark this as frontend-generated
  const questionId = `local-openai-${uuidv4()}`;
  const now = new Date();
  
  // Set end time to 30 seconds from now
  const endTime = new Date(now.getTime() + 30 * 1000);
  
  console.log(`Formatting OpenAI question with local ID: ${questionId}`);
  
  return {
    id: questionId,
    question: generatedQ.question,
    time_remaining: 30, // 30 seconds
    start_time: now.toISOString(),
    end_time: endTime.toISOString(),
    is_active: true,
    is_hot: Math.random() > 0.7, // 30% chance of being hot
    created_at: now.toISOString(),
    options: generatedQ.options.map(opt => ({
      id: `local-opt-openai-${uuidv4()}`, // Add local- prefix to options too
      question_id: questionId,
      text: opt.text,
      odds: opt.odds,
      is_winner: null,
      created_at: now.toISOString()
    }))
  };
};

// Helper function to extract JSON from various string formats
const extractJsonFromString = (str: string): string => {
  // Try to find content within code blocks
  const codeBlockRegex = /```(?:json)?\n([\s\S]*?)\n```/;
  const codeBlockMatch = str.match(codeBlockRegex);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find a JSON array directly
  const jsonArrayRegex = /\[\s*\{[\s\S]*?\}\s*\]/;
  const jsonArrayMatch = str.match(jsonArrayRegex);
  if (jsonArrayMatch) {
    return jsonArrayMatch[0];
  }
  
  // If all else fails, return the original string
  return str;
};

// Fallback mock questions if API fails - based on the Trump coal industry executive orders video
const getMockQuestions = (count: number): BettingQuestion[] => {
  const mockQuestions: BettingQuestion[] = [];
  const now = new Date();
  
  const templates = [
    // Question about Trump's references
    {
      question: "Will President Trump specifically mention 'ending the war on coal' in his speech?",
      options: [
        { text: "Yes", odds: 1.3 },
        { text: "No", odds: 3.5 }
      ]
    },
    // Question about executive orders
    {
      question: "How many executive orders will President Trump sign during this event?",
      options: [
        { text: "1 order", odds: 3.0 },
        { text: "2 orders", odds: 1.8 },
        { text: "3 or more orders", odds: 2.5 }
      ]
    },
    // Question about miners' reactions
    {
      question: "Will the coal miners applaud after the first executive order is signed?",
      options: [
        { text: "Yes, enthusiastically", odds: 1.7 },
        { text: "Yes, modestly", odds: 2.2 },
        { text: "No applause", odds: 4.0 }
      ]
    },
    // Question about Trump's gestures
    {
      question: "How many times will Trump gesture significantly with his hands during the speech?",
      options: [
        { text: "0-3 times", odds: 3.0 },
        { text: "4-7 times", odds: 1.9 },
        { text: "8+ times", odds: 2.5 }
      ]
    },
    // Question about handshakes
    {
      question: "Will Trump shake hands with every miner present?",
      options: [
        { text: "Yes, every miner", odds: 1.5 },
        { text: "Only some miners", odds: 2.8 },
        { text: "No handshakes", odds: 6.0 }
      ]
    },
    // Question about microphone adjustment
    {
      question: "Will an aide need to adjust the microphone during the event?",
      options: [
        { text: "Yes", odds: 2.2 },
        { text: "No", odds: 1.8 }
      ]
    },
    // Question about concluding remarks
    {
      question: "How will Trump conclude the signing ceremony?",
      options: [
        { text: "With remarks to the press", odds: 1.7 },
        { text: "By thanking the miners", odds: 2.0 },
        { text: "By discussing regulatory changes", odds: 3.2 },
        { text: "Abruptly without concluding remarks", odds: 5.0 }
      ]
    }
  ];
  
  // Loop through and create questions up to the requested count
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const template = templates[i];
    const id = `local-mock-${uuidv4()}`; // Add local- prefix to identify frontend questions
    const endTime = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
    
    console.log(`Creating mock question with local ID: ${id}`);
    
    mockQuestions.push({
      id,
      question: template.question,
      time_remaining: 30, // 30 seconds
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      is_active: true,
      is_hot: Math.random() > 0.7,
      created_at: now.toISOString(),
      options: template.options.map(opt => ({
        id: `local-opt-mock-${uuidv4()}`, // Add local- prefix to options too
        question_id: id,
        text: opt.text,
        odds: opt.odds,
        is_winner: null,
        created_at: now.toISOString()
      }))
    });
  }
  
  return mockQuestions;
};
