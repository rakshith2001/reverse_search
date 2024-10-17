import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';
import * as XLSX from 'xlsx';

// Define the ImageResult interface
interface ImageResult {
  title: string;
  snippet: string;
  link: string;
  source: string;
  thumbnail: string;
  original_image?: {
    link: string;
    height: number;
    width: number;
  };
}

// Function to generate the Excel file as a base64 string
function generateExcelBase64(data: ImageResult[]): string { // Use ImageResult[] instead of any[]
  const sheetData = data.map((item) => ({
    Title: item.title,
    Snippet: item.snippet,
    Link: item.link,
    Source: item.source,
    'Thumbnail Link': item.thumbnail,
    'Original Image Link': item.original_image?.link || '',
    'Original Image Height': item.original_image?.height || '',
    'Original Image Width': item.original_image?.width || '',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ImageResults');

  // Write the workbook to a buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer).toString('base64'); // Convert buffer to base64 string
}

// API route handler
export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();
    const API_KEY = process.env.NEXT_PUBLIC_SERP_API_KEY; // Make sure to keep this secure

    // Fetch image search results from SerpAPI
    const json = await getJson({
      engine: 'yandex_images',
      url: imageUrl,
      api_key: API_KEY,
    });

    if (!json || !json['image_results']) {
      throw new Error('No image results found');
    }

    const imageResults: ImageResult[] = json['image_results']; // Ensure the response matches the interface

    // Generate the Excel file base64 string
    const excelBuffer = generateExcelBase64(imageResults);

    // Return the buffer as a response with appropriate headers for JSON download
    return NextResponse.json({ results: imageResults, excelBuffer });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process image search' }, { status: 500 });
  }
}
