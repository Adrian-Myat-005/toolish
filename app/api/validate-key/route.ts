import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customApiKey, preferredModel } = body;

    // Verify directly with Google to ensure real-time valid/invalid reporting
    // Using axios with a longer timeout (60s) to handle slow networks
    try {
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${customApiKey}`, {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return NextResponse.json({ valid: true, models: response.data.models });
    } catch (axiosError: any) {
       console.error('API Route: Validation Failed:', axiosError.message);
       return NextResponse.json(
        { error: axiosError.response?.data?.error?.message || axiosError.message || 'Validation failed' }, 
        { status: axiosError.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('API Route: Validation Internal Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
