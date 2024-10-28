"use client";

import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

// Define the interface for search results
interface SearchResult {
  title: string;
  link: string;
}

const HomePage = () => {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [excelBuffer, setExcelBuffer] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
        formData
      );
      const imageUrl = response.data.data.url;
      setImageUrl(imageUrl);

      const searchResponse = await axios.post('/api/reverse-search', { imageUrl });

      if (searchResponse.data.results && Array.isArray(searchResponse.data.results)) {
        setResults(searchResponse.data.results);
        setExcelBuffer(searchResponse.data.excelBuffer);
      } else {
        setError('No results found.');
      }
    } catch (err) {
      console.error(err); // Log the error to avoid the unused variable warning
      setError('Failed to upload or search image.');
    } finally {
      setUploading(false);
    }
  };

  const downloadExcel = async () => {
    if (!excelBuffer) return;

    try {
      const byteCharacters = atob(excelBuffer);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'image_results.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err); // Log the error to avoid the unused variable warning
      setError('Failed to download the Excel file.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-10 bg-gradient-to-b from-gray-50 to-gray-200">
      <h1 className="text-4xl font-extrabold text-center text-blue-600 mb-6">Reverse Image Search</h1>

      {/* Make the file input wider */}
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageChange} 
        className="mb-4 p-2 border border-gray-300 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 text-black"
      />

      <button 
        onClick={uploadImage} 
        disabled={uploading || !image} 
        className={`px-6 py-3 text-white bg-blue-500 rounded shadow transition duration-300 hover:bg-blue-600 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {error && <p className="text-red-600 mt-4 font-semibold">{error}</p>}

      {imageUrl && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-lg text-center">
          <p className="text-lg font-semibold mb-4 text-black">Image uploaded successfully!</p>
          
          {/* Update the size of the image container */}
          <div className="relative w-96 h-96 mx-auto overflow-hidden rounded-lg border border-gray-300">
            <Image 
              src={imageUrl} 
              alt="Uploaded Image"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Search Results</h2>
          <ul className="space-y-4">
            {results.map((result, index) => (
              <li key={index} className="bg-white p-4 rounded-lg shadow">
                <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold">
                  {result.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {excelBuffer && (
        <button 
          onClick={downloadExcel} 
          className="px-6 py-3 text-white bg-green-500 rounded shadow transition duration-300 hover:bg-green-600 mt-4"
        >
          Download Excel File
        </button>
      )}
    </div>
  );
};

export default HomePage;
