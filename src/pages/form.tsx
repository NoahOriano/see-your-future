import React, { useState } from "react";
import "/src/styles/RoundOneForm.css";

interface FormDataState {
  selfie: File | null;
  resume: File | null;
  extraPhotos: File[];
  habits: string;
  goals: string;
  routines: string;
  lifestyle: string;
}

export default function RoundOneForm(): JSX.Element {
  const [formData, setFormData] = useState<FormDataState>({
    selfie: null,
    resume: null,
    extraPhotos: [],
    habits: "",
    goals: "",
    routines: "",
    lifestyle: "",
  });

  // for text inputs / textareas
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // name here will be one of the string keys in the state that accept strings
    // We narrow on keys that are string fields:
    if (name === "habits" || name === "goals" || name === "routines" || name === "lifestyle") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      // ignore or handle other names explicitly if necessary
      console.warn("Unhandled change field:", name);
    }
  };

  // for file inputs
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name; // 'selfie' | 'resume' | 'extraPhotos'
    const files = e.target.files;

    // guard for possible null
    if (!files || files.length === 0) {
      // If user cleared the input, set appropriate empty value
      if (name === "extraPhotos") {
        setFormData((prev) => ({ ...prev, extraPhotos: [] }));
      } else if (name === "selfie" || name === "resume") {
        setFormData((prev) => ({ ...prev, [name]: null } as Pick<FormDataState, keyof FormDataState> & FormDataState));
      }
      return;
    }

    if (name === "extraPhotos") {
      // convert FileList to File[]
      const fileArray = Array.from(files);
      setFormData((prev) => ({ ...prev, extraPhotos: fileArray }));
    } else if (name === "selfie" || name === "resume") {
      // single file expected
      const file = files[0] ?? null;
      // TypeScript indexing narrowing: use a conditional update
      if (name === "selfie") {
        setFormData((prev) => ({ ...prev, selfie: file }));
      } else {
        setFormData((prev) => ({ ...prev, resume: file }));
      }
    } else {
      console.warn("Unhandled file input name:", name);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // prepare FormData if you will POST to a server:
    const payload = new FormData();
    if (formData.selfie) payload.append("selfie", formData.selfie);
    if (formData.resume) payload.append("resume", formData.resume);
    formData.extraPhotos.forEach((f, i) => payload.append(`extraPhotos[${i}]`, f));
    payload.append("habits", formData.habits);
    payload.append("goals", formData.goals);
    payload.append("routines", formData.routines);
    payload.append("lifestyle", formData.lifestyle);

    // Example: console.log keys (do NOT log file objects in prod)
    for (const key of payload.keys()) {
      console.log("payload key:", key);
    }

    // TODO: POST payload to your backend
    // fetch('/api/round1', { method: 'POST', body: payload })
    //   .then(...)
    console.log("Submitting Round 1 Data:", formData);
  };

  return (
    <div className="round1-wrapper">
    <form onSubmit={handleSubmit} className="round1-form">
        <h1 className="text-3xl font-bold mb-6">Round 1: Baseline Intake</h1>

        <label className="block mb-4">
          <span className="font-semibold">Upload Selfie</span>
          <input type="file" accept="image/*" name="selfie" onChange={handleFile} className="mt-1" />
        </label>

        <label className="block mb-4">
          <span className="font-semibold">Upload Resume (optional)</span>
          <input type="file" accept="application/pdf,.doc,.docx" name="resume" onChange={handleFile} className="mt-1" />
        </label>

        <label className="block mb-4">
          <span className="font-semibold">Extra Photos (optional)</span>
          <input type="file" name="extraPhotos" accept="image/*" multiple onChange={handleFile} className="mt-1" />
        </label>

        <label className="block mb-4">
          <span className="font-semibold">Habits</span>
          <textarea
            name="habits"
            value={formData.habits}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Describe your daily habits..."
          />
        </label>

        <label className="block mb-4">
          <span className="font-semibold">Goals</span>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Short-term and long-term goals..."
          />
        </label>

        <label className="block mb-4">
          <span className="font-semibold">Routines</span>
          <textarea
            name="routines"
            value={formData.routines}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Describe a typical day..."
          />
        </label>

        <label className="block mb-4">
          <span className="font-semibold">Lifestyle</span>
          <textarea
            name="lifestyle"
            value={formData.lifestyle}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="Diet, sleep, activities, social life..."
          />
        </label>

        <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Continue to Round 2
        </button>
      </form>
    </div>
  );
}
