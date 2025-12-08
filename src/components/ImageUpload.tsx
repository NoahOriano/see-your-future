import React, { useState } from 'react';

interface ImageUploadProps {
  onImageSelected: (base64: string | null, mimeType: string | null, description: string | null) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDescribing, setIsDescribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      onImageSelected(null, null, null);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsDescribing(true);
      setError(null);

      try {
        const response = await fetch('/api/describe-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64,
            imageMimeType: file.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to describe image');
        }

        const result = await response.json();
        onImageSelected(base64, file.type, result.description);
      } catch (e: unknown) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred');
        }
        onImageSelected(base64, file.type, null); // still pass up the image
      } finally {
        setIsDescribing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
      <h3>Upload an Image of Yourself</h3>
      <p>This image will be used to generate your future.</p>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={isDescribing} />
      {isDescribing && <p>Describing image...</p>}
      {error && <p style={{ color: '#b00020' }}>{error}</p>}
      {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '1rem' }} />}
    </div>
  );
};
